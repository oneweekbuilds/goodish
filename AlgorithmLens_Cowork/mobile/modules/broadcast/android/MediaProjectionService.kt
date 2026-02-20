package com.algorithmlens.broadcast

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * MediaProjectionService — Foreground service for Android screen capture.
 *
 * Android requires a foreground service with a persistent notification
 * to use MediaProjection for screen capture. This service:
 *
 * 1. Holds the MediaProjection token (obtained via Activity result)
 * 2. Creates a VirtualDisplay that mirrors the screen
 * 3. Captures frames via ImageReader at ~0.4 fps (1 frame per 2.5 seconds)
 * 4. Runs perceptual dedup (AndroidFrameProcessor)
 * 5. Runs on-device OCR via ML Kit
 * 6. Saves unique frames + metadata to AndroidSharedStorage
 *
 * Lifecycle:
 * - Started by BroadcastModule after user grants MediaProjection permission
 * - Runs as a foreground service with a "Recording" notification
 * - Stops when: user taps stop, max duration reached, or max frames reached
 * - On stop: writes final session metadata, releases resources
 *
 * Frame processing runs on a dedicated HandlerThread to avoid
 * blocking the main thread or the ImageReader callback.
 */
class MediaProjectionService : Service() {

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "algorithmlens_broadcast"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.algorithmlens.broadcast.START"
        const val ACTION_STOP = "com.algorithmlens.broadcast.STOP"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"

        private const val TARGET_FRAME_INTERVAL_MS = 2500L
        private const val MAX_FRAMES_PER_SESSION = 200
        private const val MAX_SESSION_DURATION_MS = 600_000L
        private const val JPEG_QUALITY = 75
        private const val DEDUP_THRESHOLD = 0.15f
        private const val SCALE_FACTOR = 0.5f // Capture at half resolution to save memory

        var isRunning = false
            private set
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var frameProcessor: AndroidFrameProcessor? = null
    private var sharedStorage: AndroidSharedStorage? = null

    private var processingThread: HandlerThread? = null
    private var processingHandler: Handler? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var sessionStartTime: Long = 0
    private var lastCaptureTime: Long = 0
    @Volatile private var framesCaptured: Int = 0
    @Volatile private var framesUnique: Int = 0
    @Volatile
    private var isCapturing: Boolean = false

    // ── Service Lifecycle ─────────────────────────────────

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        sharedStorage = AndroidSharedStorage(applicationContext)
        frameProcessor = AndroidFrameProcessor(DEDUP_THRESHOLD)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, -1)
                val resultData: Intent? = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(EXTRA_RESULT_DATA)
                }

                if (resultCode == -1 || resultData == null) {
                    writeSessionMetadata("FAILED")
                    stopSelf()
                    return START_NOT_STICKY
                }

                startForeground(NOTIFICATION_ID, buildNotification("Preparing..."))
                isRunning = true
                startCapture(resultCode, resultData)
            }
            ACTION_STOP -> {
                stopCapture()
            }
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        stopCapture()
        serviceScope.cancel()
        frameProcessor?.release()
        isRunning = false
        super.onDestroy()
    }

    // ── Screen Capture ────────────────────────────────────

    private fun startCapture(resultCode: Int, resultData: Intent) {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

        if (mediaProjection == null) {
            writeSessionMetadata("FAILED")
            stopSelf()
            return
        }

        // Register callback for projection stop
        mediaProjection?.registerCallback(projectionCallback, null)

        // Get screen dimensions (scaled down)
        val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(metrics)

        val captureWidth = (metrics.widthPixels * SCALE_FACTOR).toInt()
        val captureHeight = (metrics.heightPixels * SCALE_FACTOR).toInt()
        val densityDpi = metrics.densityDpi

        // Create ImageReader for receiving screen frames
        imageReader = ImageReader.newInstance(
            captureWidth,
            captureHeight,
            PixelFormat.RGBA_8888,
            2 // Double buffer
        )

        // Create processing thread
        processingThread = HandlerThread("BroadcastFrameProcessor").also { it.start() }
        processingHandler = Handler(processingThread!!.looper)

        // Set up frame callback
        imageReader?.setOnImageAvailableListener(imageListener, processingHandler)

        // Create virtual display
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "AlgorithmLensBroadcast",
            captureWidth,
            captureHeight,
            densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )

        // Initialize session state
        sessionStartTime = SystemClock.elapsedRealtime()
        lastCaptureTime = 0
        framesCaptured = 0
        framesUnique = 0
        isCapturing = true
        frameProcessor?.reset()

        // Write initial session metadata
        val metadata = JSONObject().apply {
            put("started_at", AndroidSharedStorage.isoTimestamp())
            put("status", "RECORDING")
            put("frames_captured", 0)
            put("frames_unique", 0)
            put("duration_seconds", 0)
        }
        sharedStorage?.writeSessionMetadata(metadata)

        updateNotification("Recording — 0 frames captured")
    }

    private fun stopCapture() {
        isCapturing = false

        virtualDisplay?.release()
        virtualDisplay = null

        imageReader?.setOnImageAvailableListener(null, null)
        imageReader?.close()
        imageReader = null

        mediaProjection?.unregisterCallback(projectionCallback)
        mediaProjection?.stop()
        mediaProjection = null

        processingThread?.quitSafely()
        processingThread = null
        processingHandler = null

        // Write final session metadata
        writeFinalMetadata()

        isRunning = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    // ── Frame Processing ──────────────────────────────────

    private val imageListener = ImageReader.OnImageAvailableListener { reader ->
        if (!isCapturing) return@OnImageAvailableListener

        val image = reader?.acquireLatestImage() ?: return@OnImageAvailableListener

        try {
            val currentTime = SystemClock.elapsedRealtime()

            // Check max session duration
            if ((currentTime - sessionStartTime) >= MAX_SESSION_DURATION_MS) {
                image.close()
                stopCapture()
                return@OnImageAvailableListener
            }

            // Check max frames
            if (framesUnique >= MAX_FRAMES_PER_SESSION) {
                image.close()
                stopCapture()
                return@OnImageAvailableListener
            }

            // Frame rate limiting
            if ((currentTime - lastCaptureTime) < TARGET_FRAME_INTERVAL_MS) {
                image.close()
                return@OnImageAvailableListener
            }

            framesCaptured++
            lastCaptureTime = currentTime

            // Convert Image to Bitmap — save dimensions BEFORE closing
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * image.width
            val imageWidth = image.width   // Save before close
            val imageHeight = image.height // Save before close

            val bitmap = Bitmap.createBitmap(
                imageWidth + rowPadding / pixelStride,
                imageHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)
            image.close()

            // Crop to actual screen size (remove row padding)
            val croppedBitmap = if (rowPadding > 0) {
                Bitmap.createBitmap(bitmap, 0, 0, imageWidth, imageHeight).also {
                    if (it !== bitmap) bitmap.recycle()
                }
            } else {
                bitmap
            }

            // Perceptual deduplication
            if (!frameProcessor!!.isUniqueFrame(croppedBitmap)) {
                croppedBitmap.recycle()
                return@OnImageAvailableListener
            }

            framesUnique++

            // Process frame asynchronously (OCR + save)
            val frameNumber = framesUnique
            val capturedBitmap = croppedBitmap.copy(Bitmap.Config.ARGB_8888, false)
            croppedBitmap.recycle()

            serviceScope.launch {
                processAndSaveFrame(capturedBitmap, frameNumber)
            }

            // Update notification periodically
            if (framesUnique % 5 == 0) {
                val elapsed = (currentTime - sessionStartTime) / 1000
                updateNotification("Recording — $framesUnique frames (${elapsed}s)")
            }

            // Update session metadata periodically
            if (framesUnique % 10 == 0) {
                val duration = (SystemClock.elapsedRealtime() - sessionStartTime) / 1000.0
                sharedStorage?.updateSessionMetadata(
                    status = "RECORDING",
                    framesCaptured = framesCaptured,
                    framesUnique = framesUnique,
                    durationSeconds = duration
                )
            }

        } catch (e: Exception) {
            try { image.close() } catch (_: Exception) {}
        }
    }

    /**
     * Processes a single frame: OCR + JPEG compression + save to storage.
     * Runs on the IO coroutine scope.
     */
    private suspend fun processAndSaveFrame(bitmap: Bitmap, frameNumber: Int) {
        try {
            // On-device OCR via ML Kit
            val ocrResult = frameProcessor!!.performOCR(bitmap)

            // Compress to JPEG — save dimensions before recycling
            val jpegData = frameProcessor!!.compressToJPEG(bitmap, JPEG_QUALITY)
            val bitmapWidth = bitmap.width
            val bitmapHeight = bitmap.height
            bitmap.recycle()

            // Generate filename
            val timestamp = System.currentTimeMillis()
            val filename = "${timestamp}_${frameNumber}.jpg"

            // Save to storage
            val savedPath = sharedStorage?.saveFrame(jpegData, filename) ?: return

            // Write frame metadata
            val frameMetadata = JSONObject().apply {
                put("frame_id", "${timestamp}_${frameNumber}")
                put("filename", filename)
                put("captured_at", AndroidSharedStorage.isoTimestamp())
                put("size_bytes", jpegData.size)
                put("width", bitmapWidth)
                put("height", bitmapHeight)
                put("ocr_text", ocrResult.text)
                put("ocr_confidence", (ocrResult.confidence * 1000).toInt() / 1000.0)
                put("is_unique", true)
                put("frame_number", frameNumber)
            }
            sharedStorage?.appendFrameMetadata(frameMetadata)

        } catch (e: Exception) {
            // Frame processing failure is non-fatal — continue capturing
            try { bitmap.recycle() } catch (_: Exception) {}
        }
    }

    // ── Projection Callback ───────────────────────────────

    private val projectionCallback = object : MediaProjection.Callback() {
        override fun onStop() {
            // MediaProjection was revoked (user stopped from notification or system)
            isCapturing = false
            stopCapture()
        }
    }

    // ── Session Metadata ──────────────────────────────────

    private fun writeFinalMetadata() {
        val duration = (SystemClock.elapsedRealtime() - sessionStartTime) / 1000.0
        val metadata = JSONObject().apply {
            put("ended_at", AndroidSharedStorage.isoTimestamp())
            put("status", "COMPLETE")
            put("frames_captured", framesCaptured)
            put("frames_unique", framesUnique)
            put("duration_seconds", Math.round(duration * 10.0) / 10.0)
            put("average_frame_interval_seconds",
                if (framesUnique > 1) Math.round((duration / framesUnique) * 10.0) / 10.0
                else 0
            )
        }
        sharedStorage?.writeSessionMetadata(metadata)
    }

    private fun writeSessionMetadata(status: String) {
        val metadata = JSONObject().apply {
            put("status", status)
            put("timestamp", AndroidSharedStorage.isoTimestamp())
        }
        sharedStorage?.writeSessionMetadata(metadata)
    }

    // ── Notification ──────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "AlgorithmLens Broadcast",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when AlgorithmLens is recording your feed for analysis"
                setShowBadge(false)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        // Intent to stop recording
        val stopIntent = Intent(this, MediaProjectionService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("AlgorithmLens")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop Recording",
                stopPendingIntent
            )
            .build()
    }

    private fun updateNotification(contentText: String) {
        val notification = buildNotification(contentText)
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }
}
