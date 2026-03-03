package com.algorithmlens.broadcast

import android.graphics.Bitmap
import android.graphics.Color
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import kotlin.coroutines.resume
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * AndroidFrameProcessor — On-device frame deduplication and OCR.
 *
 * Android equivalent of iOS FrameProcessor. Uses:
 * 1. Downscaled pixel-difference hashing for frame deduplication
 * 2. Google ML Kit Text Recognition for on-device OCR (free, ~30-50ms)
 *
 * Frame deduplication strategy:
 * Since Android doesn't have VNGenerateImageFeaturePrintRequest, we use
 * a lightweight perceptual hash approach: downscale to 16x16, compute
 * average luminance, then compare against the previous frame using
 * normalized mean squared error. Frames below the dedup threshold
 * are considered duplicates.
 *
 * ML Kit runs on-device — no network calls, no API costs.
 * Processing should be efficient since this runs alongside the
 * foreground service's screen capture.
 */
class AndroidFrameProcessor(
    private val dedupThreshold: Float = 0.15f
) {
    private var lastHash: LongArray? = null
    private val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    /**
     * OCR result container.
     */
    data class OcrResult(
        val text: String,
        val confidence: Float
    )

    /**
     * Computes a perceptual hash for the given bitmap.
     * Downscales to 16x16 and computes luminance values.
     * Returns a 256-element array of luminance values.
     */
    fun computePerceptualHash(bitmap: Bitmap): LongArray {
        val size = 16
        val scaled = Bitmap.createScaledBitmap(bitmap, size, size, true)
        val hash = LongArray(size * size)

        for (y in 0 until size) {
            for (x in 0 until size) {
                val pixel = scaled.getPixel(x, y)
                // Luminance using standard coefficients
                val luminance = (
                    0.299 * Color.red(pixel) +
                    0.587 * Color.green(pixel) +
                    0.114 * Color.blue(pixel)
                ).toLong()
                hash[y * size + x] = luminance
            }
        }

        if (scaled !== bitmap) {
            scaled.recycle()
        }

        return hash
    }

    /**
     * Returns true if the frame is visually distinct from the last unique frame.
     * Uses normalized mean squared error between perceptual hashes.
     * Higher distance = more different. Keeps frames above threshold.
     */
    fun isUniqueFrame(bitmap: Bitmap): Boolean {
        val currentHash = computePerceptualHash(bitmap)
        val previousHash = lastHash

        lastHash = currentHash

        if (previousHash == null) {
            // First frame is always unique
            return true
        }

        if (currentHash.size != previousHash.size) {
            return true
        }

        // Compute normalized mean squared error
        var sumSquaredDiff = 0.0
        for (i in currentHash.indices) {
            val diff = (currentHash[i] - previousHash[i]).toDouble()
            sumSquaredDiff += diff * diff
        }
        val mse = sumSquaredDiff / currentHash.size
        // Normalize to 0-1 range (max possible MSE is 255^2 = 65025)
        val normalizedDistance = sqrt(mse) / 255.0

        return normalizedDistance >= dedupThreshold
    }

    /**
     * Runs on-device OCR on the given bitmap using ML Kit.
     * Returns extracted text and average confidence score.
     *
     * This is a suspend function to work with coroutines in the
     * MediaProjectionService.
     */
    suspend fun performOCR(bitmap: Bitmap): OcrResult {
        return suspendCancellableCoroutine { continuation ->
            val image = InputImage.fromBitmap(bitmap, 0)

            textRecognizer.process(image)
                .addOnSuccessListener { visionText ->
                    if (continuation.isActive) {
                        val fullText = visionText.text
                        var totalConfidence = 0f
                        var blockCount = 0

                        for (block in visionText.textBlocks) {
                            for (line in block.lines) {
                                line.confidence?.let { conf ->
                                    totalConfidence += conf
                                    blockCount++
                                }
                            }
                        }

                        val averageConfidence = if (blockCount > 0) {
                            totalConfidence / blockCount
                        } else {
                            0f
                        }

                        continuation.resume(
                            OcrResult(
                                text = fullText.trim(),
                                confidence = averageConfidence
                            )
                        )
                    }
                }
                .addOnFailureListener { _ ->
                    if (continuation.isActive) {
                        continuation.resume(OcrResult(text = "", confidence = 0f))
                    }
                }
        }
    }

    /**
     * Compresses a Bitmap to JPEG data at the specified quality.
     */
    fun compressToJPEG(bitmap: Bitmap, quality: Int = 75): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
        return stream.toByteArray()
    }

    /**
     * Resets the processor state for a new session.
     */
    fun reset() {
        lastHash = null
    }

    /**
     * Releases ML Kit resources.
     * Call when the processor is no longer needed.
     */
    fun release() {
        textRecognizer.close()
        lastHash = null
    }
}
