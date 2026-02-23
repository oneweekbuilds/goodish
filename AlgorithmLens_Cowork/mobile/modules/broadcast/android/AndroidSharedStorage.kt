package com.algorithmlens.broadcast

import android.content.Context
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * AndroidSharedStorage — Internal storage for frame exchange.
 *
 * Android equivalent of iOS SharedContainer. Since Android doesn't have
 * the App Group concept, we use the app's internal storage directory.
 * The MediaProjectionService and BroadcastModule both run in the same
 * app process, so shared storage access is straightforward.
 *
 * Storage layout:
 * - {internalDir}/broadcast/frames/         → JPEG frame files
 * - {internalDir}/broadcast/session_metadata.json → session lifecycle state
 * - {internalDir}/broadcast/frame_metadata.json   → array of frame info
 *
 * All file writes use atomic rename-to-place pattern via File.renameTo
 * where practical. JSON writes use temporary files to prevent corruption.
 */
class AndroidSharedStorage(private val context: Context) {

    private val broadcastDir: File
        get() = File(context.filesDir, "broadcast").also { it.mkdirs() }

    val framesDir: File
        get() = File(broadcastDir, "frames").also { it.mkdirs() }

    private val sessionMetadataFile: File
        get() = File(broadcastDir, "session_metadata.json")

    private val frameMetadataFile: File
        get() = File(broadcastDir, "frame_metadata.json")

    // ── Session Metadata ──────────────────────────────────

    /**
     * Reads session metadata from storage.
     * Returns null if the file doesn't exist or is malformed.
     */
    fun readSessionMetadata(): JSONObject? {
        return try {
            val file = sessionMetadataFile
            if (!file.exists()) return null
            JSONObject(file.readText())
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Writes session metadata to storage atomically.
     */
    fun writeSessionMetadata(metadata: JSONObject) {
        writeJsonAtomic(sessionMetadataFile, metadata.toString(2))
    }

    /**
     * Returns the current session status string, or "IDLE" if unavailable.
     */
    fun currentSessionStatus(): String {
        return readSessionMetadata()?.optString("status", "IDLE") ?: "IDLE"
    }

    /**
     * Updates session metadata with current stats.
     */
    fun updateSessionMetadata(
        status: String,
        framesCaptured: Int,
        framesUnique: Int,
        durationSeconds: Double
    ) {
        val metadata = readSessionMetadata() ?: JSONObject()
        metadata.put("status", status)
        metadata.put("frames_captured", framesCaptured)
        metadata.put("frames_unique", framesUnique)
        metadata.put("duration_seconds", Math.round(durationSeconds * 10.0) / 10.0)
        writeSessionMetadata(metadata)
    }

    // ── Frame Metadata ────────────────────────────────────

    /**
     * Reads the frame metadata array from storage.
     * Returns an empty array if the file doesn't exist or is malformed.
     */
    fun readFrameMetadata(): JSONArray {
        return try {
            val file = frameMetadataFile
            if (!file.exists()) return JSONArray()
            JSONArray(file.readText())
        } catch (e: Exception) {
            JSONArray()
        }
    }

    /**
     * Writes the frame metadata array to storage atomically.
     */
    fun writeFrameMetadata(frames: JSONArray) {
        writeJsonAtomic(frameMetadataFile, frames.toString(2))
    }

    private val metadataLock = Any()

    /**
     * Appends a single frame metadata entry to the existing array.
     * Synchronized to prevent race conditions from concurrent frame captures.
     */
    fun appendFrameMetadata(entry: JSONObject) {
        synchronized(metadataLock) {
            val existing = readFrameMetadata()
            existing.put(entry)
            writeFrameMetadata(existing)
        }
    }

    // ── Frame Files ───────────────────────────────────────

    /**
     * Saves a JPEG frame to the frames directory.
     * Returns the file path on success, null on failure.
     */
    fun saveFrame(data: ByteArray, filename: String): String? {
        return try {
            val file = File(framesDir, filename)
            file.writeBytes(data)
            file.absolutePath
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Reads a frame's JPEG data by filename.
     */
    fun readFrameData(filename: String): ByteArray? {
        return try {
            val file = File(framesDir, filename)
            if (file.exists()) file.readBytes() else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Reads a frame as base64-encoded JPEG data.
     */
    fun getFrameBase64(filename: String): String? {
        val data = readFrameData(filename) ?: return null
        return Base64.encodeToString(data, Base64.NO_WRAP)
    }

    /**
     * Returns sorted list of all JPEG filenames in the frames directory.
     */
    fun allFrameFilenames(): List<String> {
        return framesDir.listFiles()
            ?.filter { it.extension == "jpg" }
            ?.map { it.name }
            ?.sorted()
            ?: emptyList()
    }

    /**
     * Returns full file paths for all captured JPEG frames, sorted.
     */
    fun allFramePaths(): List<String> {
        return framesDir.listFiles()
            ?.filter { it.extension == "jpg" }
            ?.sortedBy { it.name }
            ?.map { it.absolutePath }
            ?: emptyList()
    }

    /**
     * Returns the count of JPEG frame files.
     */
    fun frameCount(): Int {
        return framesDir.listFiles()
            ?.count { it.extension == "jpg" }
            ?: 0
    }

    /**
     * Returns the total size of all frame files in bytes.
     */
    fun totalFrameSize(): Long {
        return framesDir.listFiles()
            ?.filter { it.extension == "jpg" }
            ?.sumOf { it.length() }
            ?: 0L
    }

    // ── Cleanup ───────────────────────────────────────────

    /**
     * Removes all frame files and frame metadata.
     * Recreates an empty frames directory.
     */
    fun cleanupFrames() {
        framesDir.listFiles()?.forEach { it.delete() }
        if (frameMetadataFile.exists()) {
            frameMetadataFile.delete()
        }
    }

    /**
     * Prepares storage for a new session.
     * Cleans all previous data and writes initial metadata.
     */
    fun prepareForNewSession() {
        cleanupFrames()
        if (sessionMetadataFile.exists()) {
            sessionMetadataFile.delete()
        }

        val initialMeta = JSONObject().apply {
            put("status", "AWAITING_BROADCAST_START")
            put("prepared_at", isoTimestamp())
        }
        writeSessionMetadata(initialMeta)
    }

    /**
     * Full reset: removes all broadcast data including session metadata.
     */
    fun fullReset() {
        cleanupFrames()
        if (sessionMetadataFile.exists()) sessionMetadataFile.delete()
        if (frameMetadataFile.exists()) frameMetadataFile.delete()

        val idleMeta = JSONObject().apply {
            put("status", "IDLE")
            put("cleaned_at", isoTimestamp())
        }
        writeSessionMetadata(idleMeta)
    }

    // ── Helpers ───────────────────────────────────────────

    /**
     * Writes JSON content to a file atomically via temp file + rename.
     */
    private fun writeJsonAtomic(target: File, content: String) {
        val tempFile = File(target.parentFile, "${target.name}.tmp")
        try {
            tempFile.writeText(content)
            tempFile.renameTo(target)
        } catch (e: Exception) {
            // Fallback: direct write if rename fails
            target.writeText(content)
            if (tempFile.exists()) tempFile.delete()
        }
    }

    companion object {
        /**
         * Returns an ISO 8601 timestamp string.
         */
        fun isoTimestamp(): String {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            return sdf.format(Date())
        }
    }
}
