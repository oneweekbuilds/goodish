import ReplayKit
import Vision
import CoreMedia

/**
 * SampleHandler — ReplayKit Broadcast Upload Extension
 *
 * This handler receives raw CMSampleBuffer frames at the screen's
 * refresh rate while the user scrolls their native social media app.
 *
 * Frame processing pipeline:
 * 1. Rate-limit to 1 frame per ~2.5 seconds (skip intermediate frames)
 * 2. Convert CMSampleBuffer → CGImage
 * 3. Compute perceptual hash via VNGenerateImageFeaturePrintRequest
 * 4. Compare hash against previous frame — skip if <15% visual difference
 * 5. Run VNRecognizeTextRequest for on-device OCR (free, ~20-30ms)
 * 6. Save unique frames as compressed JPEGs to shared App Group container
 * 7. Append frame metadata to rolling JSON array
 *
 * The main app reads frames from the shared container after the broadcast ends.
 *
 * Memory constraint: broadcast extensions have ~50MB limit.
 * We process frames synchronously and release buffers promptly.
 */
class SampleHandler: RPBroadcastSampleHandler {

    // MARK: - Configuration

    private let sharedContainerID = "group.com.algorithmlens.broadcast"
    private let targetFrameInterval: TimeInterval = 2.5
    private let jpegQuality: CGFloat = 0.75
    private let maxFramesPerSession: Int = 200
    private let maxSessionDuration: TimeInterval = 600

    // MARK: - State

    private var frameProcessor: FrameProcessor!
    private var lastCaptureTime: TimeInterval = 0
    private var frameCount: Int = 0
    private var uniqueFrameCount: Int = 0
    private var sessionStartTime: TimeInterval = 0
    private var isSessionActive: Bool = false
    private var frameMetadataEntries: [[String: Any]] = []
    private lazy var ciContext = CIContext(options: [.useSoftwareRenderer: false])

    // Build #41 diagnostic counters. Surfaced into session_metadata.json so the
    // main app can read them via BroadcastModule.getStatus() and reason about
    // where in the pipeline frames are being lost (rate-limit drops vs dedup
    // drops vs actual write failures vs no buffers received at all).
    private var framesRateLimited: Int = 0
    private var framesDedup: Int = 0
    private var framesWriteFailed: Int = 0
    private var lastWriteError: String = ""

    // MARK: - Lifecycle

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        sessionStartTime = CACurrentMediaTime()
        lastCaptureTime = 0
        frameCount = 0
        uniqueFrameCount = 0
        framesRateLimited = 0
        framesDedup = 0
        framesWriteFailed = 0
        lastWriteError = ""
        isSessionActive = true
        frameMetadataEntries = []

        frameProcessor = FrameProcessor(dedupThreshold: 0.15)

        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: sharedContainerID
        ) else {
            finishBroadcastWithError(
                makeError(code: 1, message: "Shared container not available")
            )
            return
        }

        // Ensure frames directory exists
        let framesDir = containerURL.appendingPathComponent("frames")
        do {
            // Clean any stale frames from a previous session
            if FileManager.default.fileExists(atPath: framesDir.path) {
                try FileManager.default.removeItem(at: framesDir)
            }
            try FileManager.default.createDirectory(
                at: framesDir,
                withIntermediateDirectories: true
            )
        } catch {
            finishBroadcastWithError(
                makeError(code: 2, message: "Failed to create frames directory: \(error.localizedDescription)")
            )
            return
        }

        // Write session start metadata
        writeSessionMetadata(status: "RECORDING", containerURL: containerURL)
    }

    override func broadcastPaused() {
        // System paused (e.g., phone call). We keep the session alive
        // but stop processing frames until resumed.
        isSessionActive = false

        if let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: sharedContainerID
        ) {
            writeSessionMetadata(status: "PAUSED", containerURL: containerURL)
        }
    }

    override func broadcastResumed() {
        isSessionActive = true
        // Reset the capture timer so we don't immediately skip frames
        lastCaptureTime = CACurrentMediaTime() - targetFrameInterval

        if let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: sharedContainerID
        ) {
            writeSessionMetadata(status: "RECORDING", containerURL: containerURL)
        }
    }

    override func broadcastFinished() {
        isSessionActive = false

        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: sharedContainerID
        ) else {
            return
        }

        // Write final frame metadata array
        writeFrameMetadata(containerURL: containerURL)

        // Write final session metadata with complete stats
        let duration = CACurrentMediaTime() - sessionStartTime
        let metadata: [String: Any] = [
            "started_at": ISO8601DateFormatter().string(from: Date(timeIntervalSinceNow: -duration)),
            "ended_at": ISO8601DateFormatter().string(from: Date()),
            "status": "COMPLETE",
            "frames_captured": frameCount,
            "frames_unique": uniqueFrameCount,
            "frames_rate_limited": framesRateLimited,
            "frames_dedup": framesDedup,
            "frames_write_failed": framesWriteFailed,
            "last_write_error": lastWriteError,
            "duration_seconds": round(duration * 10) / 10,
            "average_frame_interval_seconds": uniqueFrameCount > 1
                ? round((duration / Double(uniqueFrameCount)) * 10) / 10
                : 0
        ]
        if let data = try? JSONSerialization.data(withJSONObject: metadata, options: .prettyPrinted) {
            let metadataURL = containerURL.appendingPathComponent("session_metadata.json")
            try? data.write(to: metadataURL, options: .atomic)
        }

        frameProcessor.reset()
    }

    // MARK: - Frame Processing

    override func processSampleBuffer(
        _ sampleBuffer: CMSampleBuffer,
        with sampleBufferType: RPSampleBufferType
    ) {
        // Only process video frames
        guard sampleBufferType == .video else { return }
        guard isSessionActive else { return }

        let currentTime = CACurrentMediaTime()

        // Check max session duration
        if (currentTime - sessionStartTime) >= maxSessionDuration {
            finishBroadcastWithError(
                makeError(code: 3, message: "Maximum session duration reached")
            )
            return
        }

        // Check max frames limit
        if uniqueFrameCount >= maxFramesPerSession {
            finishBroadcastWithError(
                makeError(code: 4, message: "Maximum frame count reached")
            )
            return
        }

        // Frame rate limiting: only process ~1 frame per targetFrameInterval
        guard (currentTime - lastCaptureTime) >= targetFrameInterval else {
            framesRateLimited += 1
            return
        }

        frameCount += 1
        lastCaptureTime = currentTime

        // Wrap in autoreleasepool to release intermediate objects promptly.
        // Broadcast extensions have ~50MB memory limit, so preventing
        // CGImage/CIImage accumulation across frames is critical.
        autoreleasepool {
            processFrame(sampleBuffer, currentTime: currentTime)
        }
    }

    private func processFrame(_ sampleBuffer: CMSampleBuffer, currentTime: TimeInterval) {
        // Convert CMSampleBuffer → CGImage
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let rect = ciImage.extent
        guard let cgImage = ciContext.createCGImage(ciImage, from: rect) else { return }

        // Perceptual deduplication — skip visually similar frames
        guard frameProcessor.isUniqueFrame(cgImage) else {
            framesDedup += 1
            return
        }

        uniqueFrameCount += 1

        // On-device OCR (runs synchronously, ~20-30ms)
        let ocrResult = frameProcessor.performOCR(on: cgImage)

        // Compress to JPEG
        guard let jpegData = frameProcessor.compressToJPEG(cgImage, quality: jpegQuality) else { return }

        // Generate filename: timestamp_frameNumber.jpg
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let filename = "\(timestamp)_\(uniqueFrameCount).jpg"

        // Save to shared container
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: sharedContainerID
        ) else { return }

        let framesDir = containerURL.appendingPathComponent("frames")
        let fileURL = framesDir.appendingPathComponent(filename)

        do {
            try jpegData.write(to: fileURL, options: .atomic)
        } catch {
            // Failed to write frame — continue processing. Don't crash the extension.
            framesWriteFailed += 1
            lastWriteError = String(error.localizedDescription.prefix(120))
            // Build #41: still publish updated metadata so the main app can see
            // the failure counter climb. Otherwise a write-permission issue
            // would look identical to "no frames received at all".
            writeSessionMetadata(status: "RECORDING", containerURL: containerURL)
            return
        }

        // Build frame metadata entry
        let frameMetadata: [String: Any] = [
            "frame_id": "\(timestamp)_\(uniqueFrameCount)",
            "filename": filename,
            "captured_at": ISO8601DateFormatter().string(from: Date()),
            "size_bytes": jpegData.count,
            "width": cgImage.width,
            "height": cgImage.height,
            "ocr_text": ocrResult.text,
            "ocr_confidence": Double(round(ocrResult.confidence * 1000) / 1000),
            "is_unique": true,
            "frame_number": uniqueFrameCount
        ]
        frameMetadataEntries.append(frameMetadata)

        // Build #41: update session_metadata.json after every successful frame
        // so the main app's polling Timer (which reads frames_unique from this
        // file every 1s) actually surfaces a live count. Previously this was
        // only written at lifecycle events, so the live UI count stuck at 0
        // throughout recording. The file is small (single dict) and writes are
        // atomic — overhead is trivial at the 1-frame-per-2.5s rate.
        writeSessionMetadata(status: "RECORDING", containerURL: containerURL)

        // Periodically flush metadata to disk (every 10 frames) for crash resilience
        if uniqueFrameCount % 10 == 0 {
            writeFrameMetadata(containerURL: containerURL)
        }
    }

    // MARK: - Helpers

    private func writeSessionMetadata(status: String, containerURL: URL) {
        let duration = CACurrentMediaTime() - sessionStartTime
        let metadata: [String: Any] = [
            "started_at": ISO8601DateFormatter().string(from: Date(timeIntervalSinceNow: -duration)),
            "status": status,
            "frames_captured": frameCount,
            "frames_unique": uniqueFrameCount,
            "frames_rate_limited": framesRateLimited,
            "frames_dedup": framesDedup,
            "frames_write_failed": framesWriteFailed,
            "last_write_error": lastWriteError,
            "duration_seconds": round(duration * 10) / 10
        ]
        if let data = try? JSONSerialization.data(withJSONObject: metadata, options: .prettyPrinted) {
            let metadataURL = containerURL.appendingPathComponent("session_metadata.json")
            try? data.write(to: metadataURL, options: .atomic)
        }
    }

    private func writeFrameMetadata(containerURL: URL) {
        let metadataURL = containerURL.appendingPathComponent("frame_metadata.json")
        if let data = try? JSONSerialization.data(withJSONObject: frameMetadataEntries, options: .prettyPrinted) {
            try? data.write(to: metadataURL, options: .atomic)
        }
    }

    private func makeError(code: Int, message: String) -> NSError {
        return NSError(
            domain: "com.algorithmlens.broadcast",
            code: code,
            userInfo: [NSLocalizedDescriptionKey: message]
        )
    }
}
