import ExpoModulesCore
import ReplayKit

/**
 * BroadcastModule — Expo native module bridge for iOS ReplayKit broadcast.
 *
 * This module provides the React Native interface to query and manage
 * ReplayKit screen broadcasts. The actual frame capture happens in the
 * BroadcastExtension (a separate iOS target that runs in its own process).
 *
 * Communication between the main app and the extension happens through
 * a shared App Group container (group.com.algorithmlens.broadcast).
 *
 * Responsibilities:
 * - Query broadcast availability and status
 * - Read session metadata written by the extension
 * - Read frame metadata and frame file paths
 * - Collect captured frames for upload to analysis pipeline
 * - Clean up shared container after processing
 * - Emit status change events to React Native
 *
 * The RPSystemBroadcastPickerView (system broadcast trigger) is handled
 * at the React Native layer via a native UIView component.
 */
public class BroadcastModule: Module {

    private let appGroupID = "group.com.algorithmlens.broadcast"
    private var statusPollTimer: Timer?

    public func definition() -> ModuleDefinition {
        Name("ExpoBroadcast")

        // Emit events to JS when broadcast status changes
        Events("onStatusChange", "onFrameCountUpdate")

        // MARK: - Availability & Status

        /// Returns whether ReplayKit broadcast is available on this device.
        /// Requires iOS 12+ and the broadcast extension to be configured.
        Function("isAvailable") { () -> Bool in
            if #available(iOS 12.0, *) {
                return true
            }
            return false
        }

        /// Returns the current broadcast session status from the shared container.
        /// Reads the session_metadata.json written by the broadcast extension.
        Function("getStatus") { () -> [String: Any] in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return ["status": "IDLE", "error": "Shared container not available"]
            }

            let metadataURL = containerURL.appendingPathComponent("session_metadata.json")
            guard FileManager.default.fileExists(atPath: metadataURL.path),
                  let data = try? Data(contentsOf: metadataURL),
                  let metadata = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return ["status": "IDLE"]
            }

            return metadata
        }

        /// Returns the shared container path for debugging/diagnostics.
        Function("getSharedContainerPath") { () -> String? in
            let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            )
            return containerURL?.path
        }

        // MARK: - Frame Data

        /// Returns the number of unique JPEG frames stored in the shared container.
        Function("getFrameCount") { () -> Int in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return 0
            }
            let framesDir = containerURL.appendingPathComponent("frames")
            let contents = try? FileManager.default.contentsOfDirectory(atPath: framesDir.path)
            return contents?.filter { $0.hasSuffix(".jpg") }.count ?? 0
        }

        /// Returns the frame metadata array written by the broadcast extension.
        /// Each entry contains: frame_id, filename, captured_at, size_bytes,
        /// width, height, ocr_text, ocr_confidence, is_unique, frame_number.
        Function("getFrameMetadata") { () -> [[String: Any]] in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return []
            }

            let metadataURL = containerURL.appendingPathComponent("frame_metadata.json")
            guard FileManager.default.fileExists(atPath: metadataURL.path),
                  let data = try? Data(contentsOf: metadataURL),
                  let frames = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                return []
            }

            return frames
        }

        /// Returns the full file paths for all captured JPEG frames,
        /// sorted by filename (which includes the capture timestamp).
        Function("getFramePaths") { () -> [String] in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return []
            }

            let framesDir = containerURL.appendingPathComponent("frames")
            guard let contents = try? FileManager.default.contentsOfDirectory(atPath: framesDir.path) else {
                return []
            }

            return contents
                .filter { $0.hasSuffix(".jpg") }
                .sorted()
                .map { framesDir.appendingPathComponent($0).path }
        }

        /// Reads a single frame's JPEG data as a base64-encoded string.
        /// Used for sending frames to the Gemini analysis pipeline.
        Function("getFrameBase64") { (filename: String) -> String? in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return nil
            }

            let fileURL = containerURL
                .appendingPathComponent("frames")
                .appendingPathComponent(filename)

            guard let data = try? Data(contentsOf: fileURL) else {
                return nil
            }

            return data.base64EncodedString()
        }

        // MARK: - Session Management

        /// Starts polling the shared container for status changes.
        /// Call this when the user initiates a broadcast session.
        /// The module reads session_metadata.json every second and emits
        /// onStatusChange events when the status changes.
        Function("startStatusPolling") { () in
            self.stopPolling()

            var lastStatus = ""
            var lastFrameCount = 0

            self.statusPollTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                guard let self = self else { return }

                guard let containerURL = FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier: self.appGroupID
                ) else { return }

                let metadataURL = containerURL.appendingPathComponent("session_metadata.json")

                guard FileManager.default.fileExists(atPath: metadataURL.path),
                      let data = try? Data(contentsOf: metadataURL),
                      let metadata = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    return
                }

                let currentStatus = metadata["status"] as? String ?? "IDLE"
                let currentFrames = metadata["frames_unique"] as? Int ?? 0

                // Emit status change event
                if currentStatus != lastStatus {
                    lastStatus = currentStatus
                    self.sendEvent("onStatusChange", [
                        "status": currentStatus,
                        "metadata": metadata
                    ])

                    // Auto-stop polling when session completes or fails
                    if currentStatus == "COMPLETE" || currentStatus == "FAILED" {
                        self.stopPolling()
                    }
                }

                // Emit frame count update
                if currentFrames != lastFrameCount {
                    lastFrameCount = currentFrames
                    self.sendEvent("onFrameCountUpdate", [
                        "frameCount": currentFrames,
                        "framesTotal": metadata["frames_captured"] as? Int ?? 0
                    ])
                }
            }
        }

        /// Stops polling for status changes.
        Function("stopStatusPolling") { () in
            self.stopPolling()
        }

        /// Prepares the shared container for a new broadcast session.
        /// Cleans up any stale data from previous sessions.
        AsyncFunction("prepareSession") { (promise: Promise) in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                promise.reject("CONTAINER_ERROR", "Shared container not available")
                return
            }

            do {
                // Remove stale frames
                let framesDir = containerURL.appendingPathComponent("frames")
                if FileManager.default.fileExists(atPath: framesDir.path) {
                    try FileManager.default.removeItem(at: framesDir)
                }
                try FileManager.default.createDirectory(
                    at: framesDir,
                    withIntermediateDirectories: true
                )

                // Remove stale metadata
                let sessionMetaURL = containerURL.appendingPathComponent("session_metadata.json")
                if FileManager.default.fileExists(atPath: sessionMetaURL.path) {
                    try FileManager.default.removeItem(at: sessionMetaURL)
                }

                let frameMetaURL = containerURL.appendingPathComponent("frame_metadata.json")
                if FileManager.default.fileExists(atPath: frameMetaURL.path) {
                    try FileManager.default.removeItem(at: frameMetaURL)
                }

                // Write initial IDLE state
                let initialMeta: [String: Any] = [
                    "status": "AWAITING_BROADCAST_START",
                    "prepared_at": ISO8601DateFormatter().string(from: Date())
                ]
                let data = try JSONSerialization.data(withJSONObject: initialMeta, options: .prettyPrinted)
                try data.write(to: sessionMetaURL, options: .atomic)

                promise.resolve(true)
            } catch {
                promise.reject("PREPARE_ERROR", error.localizedDescription)
            }
        }

        // MARK: - Cleanup

        /// Cleans up all frame data and metadata from the shared container.
        /// Call this after frames have been processed and uploaded.
        AsyncFunction("cleanupFrames") { (promise: Promise) in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                promise.resolve(false)
                return
            }

            do {
                // Remove frames directory and recreate empty
                let framesDir = containerURL.appendingPathComponent("frames")
                if FileManager.default.fileExists(atPath: framesDir.path) {
                    try FileManager.default.removeItem(at: framesDir)
                    try FileManager.default.createDirectory(
                        at: framesDir,
                        withIntermediateDirectories: true
                    )
                }

                // Remove frame metadata
                let frameMetaURL = containerURL.appendingPathComponent("frame_metadata.json")
                if FileManager.default.fileExists(atPath: frameMetaURL.path) {
                    try FileManager.default.removeItem(at: frameMetaURL)
                }

                // Reset session metadata to IDLE
                let sessionMetaURL = containerURL.appendingPathComponent("session_metadata.json")
                let idleMeta: [String: Any] = [
                    "status": "IDLE",
                    "cleaned_at": ISO8601DateFormatter().string(from: Date())
                ]
                let data = try JSONSerialization.data(withJSONObject: idleMeta, options: .prettyPrinted)
                try data.write(to: sessionMetaURL, options: .atomic)

                promise.resolve(true)
            } catch {
                promise.reject("CLEANUP_ERROR", error.localizedDescription)
            }
        }

        /// Returns the total storage used by captured frames in bytes.
        Function("getStorageUsed") { () -> Int in
            guard let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: self.appGroupID
            ) else {
                return 0
            }

            let framesDir = containerURL.appendingPathComponent("frames")
            guard let contents = try? FileManager.default.contentsOfDirectory(atPath: framesDir.path) else {
                return 0
            }

            var totalSize = 0
            for filename in contents where filename.hasSuffix(".jpg") {
                let filePath = framesDir.appendingPathComponent(filename).path
                if let attrs = try? FileManager.default.attributesOfItem(atPath: filePath),
                   let size = attrs[.size] as? Int {
                    totalSize += size
                }
            }
            return totalSize
        }
    }

    // MARK: - Private

    private func stopPolling() {
        statusPollTimer?.invalidate()
        statusPollTimer = nil
    }
}
