import Vision
import UIKit

/**
 * FrameProcessor — On-device frame deduplication and OCR.
 *
 * Uses Apple Vision framework for:
 * 1. VNGenerateImageFeaturePrintRequest — perceptual hashing for dedup
 * 2. VNRecognizeTextRequest — on-device OCR (zero API cost, ~20-30ms)
 *
 * This runs inside the broadcast extension process. All processing
 * must be efficient since extensions have limited memory (~50MB).
 */
class FrameProcessor {

    private var lastFeaturePrint: VNFeaturePrintObservation?
    private let dedupThreshold: Float

    init(dedupThreshold: Float = 0.15) {
        self.dedupThreshold = dedupThreshold
    }

    /// Computes a perceptual hash for the given image using Vision framework.
    /// Returns nil if the computation fails.
    func computeFeaturePrint(for image: CGImage) -> VNFeaturePrintObservation? {
        let request = VNGenerateImageFeaturePrintRequest()
        let handler = VNImageRequestHandler(cgImage: image, options: [:])

        do {
            try handler.perform([request])
            return request.results?.first as? VNFeaturePrintObservation
        } catch {
            return nil
        }
    }

    /// Returns true if the frame is visually distinct from the last unique frame.
    /// Uses perceptual hash distance — frames with less than `dedupThreshold`
    /// difference are considered duplicates.
    func isUniqueFrame(_ image: CGImage) -> Bool {
        guard let currentPrint = computeFeaturePrint(for: image) else {
            // If we can't compute a hash, keep the frame to be safe
            return true
        }

        defer { lastFeaturePrint = currentPrint }

        guard let previousPrint = lastFeaturePrint else {
            // First frame is always unique
            return true
        }

        var distance: Float = 0
        do {
            try currentPrint.computeDistance(&distance, to: previousPrint)
        } catch {
            return true
        }

        // Higher distance = more different. Keep frames above threshold.
        return distance >= dedupThreshold
    }

    /// Runs on-device OCR on the given image.
    /// Returns extracted text and confidence score.
    func performOCR(on image: CGImage) -> (text: String, confidence: Float) {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: image, options: [:])

        do {
            try handler.perform([request])
        } catch {
            return ("", 0.0)
        }

        guard let observations = request.results else {
            return ("", 0.0)
        }

        var fullText = ""
        var totalConfidence: Float = 0
        var observationCount: Float = 0

        for observation in observations {
            guard let topCandidate = observation.topCandidates(1).first else { continue }
            fullText += topCandidate.string + "\n"
            totalConfidence += topCandidate.confidence
            observationCount += 1
        }

        let averageConfidence = observationCount > 0 ? totalConfidence / observationCount : 0
        return (fullText.trimmingCharacters(in: .whitespacesAndNewlines), averageConfidence)
    }

    /// Compresses a CGImage to JPEG data at the specified quality.
    func compressToJPEG(_ image: CGImage, quality: CGFloat = 0.75) -> Data? {
        let uiImage = UIImage(cgImage: image)
        return uiImage.jpegData(compressionQuality: quality)
    }

    /// Resets the processor state for a new session.
    func reset() {
        lastFeaturePrint = nil
    }
}
