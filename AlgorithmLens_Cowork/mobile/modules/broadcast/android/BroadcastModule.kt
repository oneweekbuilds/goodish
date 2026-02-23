package com.algorithmlens.broadcast

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.CodedException
import org.json.JSONObject
import java.io.File
import java.util.Timer
import java.util.TimerTask

/**
 * BroadcastModule — Expo native module bridge for Android MediaProjection.
 *
 * This module provides the React Native interface to start/stop/query
 * Android MediaProjection screen capture. The capture runs in a foreground
 * service (MediaProjectionService) with a persistent notification.
 *
 * Responsibilities:
 * - Query MediaProjection availability
 * - Request screen capture permission via Activity result
 * - Start/stop the foreground capture service
 * - Read session metadata and frame data from AndroidSharedStorage
 * - Emit status change events to React Native
 * - Clean up storage after processing
 *
 * Key difference from iOS:
 * On iOS, the user taps RPSystemBroadcastPickerView to start recording.
 * On Android, we request MediaProjection permission via an Activity intent,
 * then start a foreground service. The permission flow is triggered
 * from the React Native layer via requestScreenCapture().
 */
class BroadcastModule : Module() {

    private val REQUEST_CODE_SCREEN_CAPTURE = 7001
    private var statusPollTimer: Timer? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private val sharedStorage: AndroidSharedStorage
        get() = AndroidSharedStorage(appContext.reactContext ?: throw CodedException("CONTEXT_ERROR", "React context not available", null))

    override fun definition() = ModuleDefinition {
        Name("ExpoBroadcast")

        // Emit events to JS when broadcast status changes
        Events("onStatusChange", "onFrameCountUpdate")

        // ── Availability & Status ─────────────────────────

        /**
         * Returns whether MediaProjection is available on this device.
         * Requires Android 5.0 (API 21)+.
         */
        Function("isAvailable") {
            return@Function Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
        }

        /**
         * Returns the current broadcast session status from storage.
         */
        Function("getStatus") {
            val metadata = sharedStorage.readSessionMetadata()
            if (metadata != null) {
                return@Function jsonToMap(metadata)
            }
            return@Function mapOf("status" to "IDLE")
        }

        /**
         * Returns the storage directory path for debugging/diagnostics.
         */
        Function("getSharedContainerPath") {
            val context = appContext.reactContext ?: return@Function null
            return@Function File(context.filesDir, "broadcast").absolutePath
        }

        // ── Frame Data ────────────────────────────────────

        /**
         * Returns the number of unique JPEG frames stored.
         */
        Function("getFrameCount") {
            return@Function sharedStorage.frameCount()
        }

        /**
         * Returns the frame metadata array.
         */
        Function("getFrameMetadata") {
            val frames = sharedStorage.readFrameMetadata()
            val result = mutableListOf<Map<String, Any?>>()
            for (i in 0 until frames.length()) {
                result.add(jsonToMap(frames.getJSONObject(i)))
            }
            return@Function result
        }

        /**
         * Returns the full file paths for all captured JPEG frames, sorted.
         */
        Function("getFramePaths") {
            return@Function sharedStorage.allFramePaths()
        }

        /**
         * Reads a single frame's JPEG data as a base64-encoded string.
         */
        Function("getFrameBase64") { filename: String ->
            return@Function sharedStorage.getFrameBase64(filename)
        }

        // ── Session Management ────────────────────────────

        /**
         * Starts polling storage for status changes.
         * Emits onStatusChange and onFrameCountUpdate events.
         */
        Function("startStatusPolling") {
            stopPolling()

            var lastStatus = ""
            var lastFrameCount = 0

            statusPollTimer = Timer().also { timer ->
                timer.scheduleAtFixedRate(object : TimerTask() {
                    override fun run() {
                        val metadata = sharedStorage.readSessionMetadata() ?: return

                        val currentStatus = metadata.optString("status", "IDLE")
                        val currentFrames = metadata.optInt("frames_unique", 0)

                        if (currentStatus != lastStatus) {
                            lastStatus = currentStatus
                            mainHandler.post {
                                sendEvent("onStatusChange", mapOf(
                                    "status" to currentStatus,
                                    "metadata" to jsonToMap(metadata)
                                ))
                            }

                            // Auto-stop polling on terminal states
                            if (currentStatus == "COMPLETE" || currentStatus == "FAILED") {
                                stopPolling()
                            }
                        }

                        if (currentFrames != lastFrameCount) {
                            lastFrameCount = currentFrames
                            mainHandler.post {
                                sendEvent("onFrameCountUpdate", mapOf(
                                    "frameCount" to currentFrames,
                                    "framesTotal" to metadata.optInt("frames_captured", 0)
                                ))
                            }
                        }
                    }
                }, 0, 1000)
            }
        }

        /**
         * Stops polling for status changes.
         */
        Function("stopStatusPolling") {
            stopPolling()
        }

        /**
         * Prepares storage for a new broadcast session.
         */
        AsyncFunction("prepareSession") { promise: Promise ->
            try {
                sharedStorage.prepareForNewSession()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PREPARE_ERROR", e.message ?: "Failed to prepare session", e)
            }
        }

        /**
         * Requests MediaProjection permission and starts the capture service.
         * This triggers the system permission dialog for screen capture.
         *
         * The permission result is handled via onActivityResult, which
         * starts the MediaProjectionService with the result token.
         */
        AsyncFunction("requestScreenCapture") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No activity available to request screen capture", null)
                return@AsyncFunction
            }

            val projectionManager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
            if (projectionManager == null) {
                promise.reject("NO_PROJECTION", "MediaProjection not available on this device", null)
                return@AsyncFunction
            }

            // Store the promise to resolve when we get the activity result
            pendingCapturePromise = promise

            val captureIntent = projectionManager.createScreenCaptureIntent()
            activity.startActivityForResult(captureIntent, REQUEST_CODE_SCREEN_CAPTURE)
        }

        /**
         * Stops the screen capture service.
         */
        Function("stopCapture") {
            val context = appContext.reactContext ?: return@Function
            val stopIntent = Intent(context, MediaProjectionService::class.java).apply {
                action = MediaProjectionService.ACTION_STOP
            }
            context.startService(stopIntent)
        }

        // ── Cleanup ───────────────────────────────────────

        /**
         * Cleans up all frame data and metadata from storage.
         */
        AsyncFunction("cleanupFrames") { promise: Promise ->
            try {
                sharedStorage.fullReset()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CLEANUP_ERROR", e.message ?: "Cleanup failed", e)
            }
        }

        /**
         * Returns the total storage used by captured frames in bytes.
         */
        Function("getStorageUsed") {
            return@Function sharedStorage.totalFrameSize()
        }

        // ── Activity Result Handling ──────────────────────

        OnActivityResult { _, payload ->
            val requestCode = payload.requestCode
            val resultCode = payload.resultCode
            val data = payload.data

            if (requestCode == REQUEST_CODE_SCREEN_CAPTURE) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    // User granted screen capture permission
                    val context = appContext.reactContext
                    if (context != null) {
                        val serviceIntent = Intent(context, MediaProjectionService::class.java).apply {
                            action = MediaProjectionService.ACTION_START
                            putExtra(MediaProjectionService.EXTRA_RESULT_CODE, resultCode)
                            putExtra(MediaProjectionService.EXTRA_RESULT_DATA, data)
                        }

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(serviceIntent)
                        } else {
                            context.startService(serviceIntent)
                        }
                    }
                    pendingCapturePromise?.resolve(true)
                } else {
                    // User denied screen capture
                    pendingCapturePromise?.reject(
                        "USER_DENIED",
                        "Screen capture permission was denied",
                        null
                    )
                }
                pendingCapturePromise = null
            }
        }
    }

    // ── Private ───────────────────────────────────────────

    private var pendingCapturePromise: Promise? = null

    private fun stopPolling() {
        statusPollTimer?.cancel()
        statusPollTimer = null
    }

    /**
     * Converts a JSONObject to a Map<String, Any?> for Expo module return values.
     */
    private fun jsonToMap(json: JSONObject): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            val value = json.opt(key)
            map[key] = when (value) {
                JSONObject.NULL -> null
                is JSONObject -> jsonToMap(value)
                else -> value
            }
        }
        return map
    }
}
