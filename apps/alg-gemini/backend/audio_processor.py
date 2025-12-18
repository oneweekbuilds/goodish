"""
Audio Intelligence Layer for MOBILE_VIDEO Scans

This module provides deterministic audio extraction and transcription for video scans.
Key principles:
    - Deterministic: CPU-only mode with fixed settings produces identical output
    - Auditable: All settings, versions, and errors are logged
    - No silent failures: Every processing attempt returns explicit status/error codes

Pipeline stages:
    1. Audio extraction via ffprobe/ffmpeg (subprocess with captured output)
    2. VAD (Voice Activity Detection) to prevent hallucinations
    3. ASR transcription via faster-whisper (CPU deterministic mode)
    4. Error reason code reporting

Error reason codes:
    - FFMPEG_NOT_FOUND: ffmpeg/ffprobe binaries not found in PATH
    - PROBE_FAILED: ffprobe could not read video
    - NO_AUDIO_STREAM: Video confirmed to have no audio track
    - EXTRACTION_FAILED: ffmpeg failed to extract audio
    - INVALID_AUDIO_FILE: Audio file corrupted or unreadable
    - SKIPPED_NO_SPEECH: VAD detected no speech (music/ambient only)
    - ASR_FAILED: Transcription threw exception
    - ASR_LOW_CONFIDENCE: All segments below confidence threshold
    - WHISPER_NOT_AVAILABLE: faster-whisper not installed
"""

import os
import subprocess
import json
import shutil
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

# Whisper import with graceful fallback
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    WhisperModel = None


# =============================================================================
# Constants and Configuration
# =============================================================================

# Deterministic ASR settings (LOCKED - do not change without version bump)
ASR_SETTINGS = {
    "beam_size": 5,
    "temperature": 0.0,  # Greedy decoding, no sampling
    "condition_on_previous_text": False,  # Prevents drift
    "word_timestamps": False,  # Segment-level sufficient
    "language": "en",  # Lock language for determinism
    "vad_filter": True,  # Use Silero VAD for speech detection
    "vad_parameters": {
        "min_silence_duration_ms": 500,
        "speech_pad_ms": 200,
    },
}

# Compute environment settings (CPU deterministic mode)
COMPUTE_SETTINGS = {
    "device": "cpu",
    "compute_type": "int8",
    "cpu_threads": 4,
    "gpu_device_id": None,
    "deterministic_mode": True,
}

# Model configuration
DEFAULT_MODEL_SIZE = "small"  # ~500MB, good accuracy/size tradeoff
MODEL_ID_FORMAT = "faster-whisper-{size}"

# VAD threshold for speech detection
VAD_SPEECH_THRESHOLD_PERCENT = 5.0  # Below this = no speech (music-only/ambient)

# ASR quality thresholds (based on avg_logprob)
ASR_QUALITY_GOOD_THRESHOLD = -0.5
ASR_QUALITY_PARTIAL_THRESHOLD = -1.0


# =============================================================================
# Binary Detection (robust PATH checking)
# =============================================================================

def _binary_available(name: str) -> bool:
    """
    Check if a binary is available in PATH using shutil.which.

    This is more reliable than attempting subprocess calls, as it
    doesn't require actually executing the binary.

    Args:
        name: Binary name (e.g., "ffmpeg", "ffprobe")

    Returns:
        True if binary is found in PATH, False otherwise
    """
    return shutil.which(name) is not None


def ffmpeg_available() -> bool:
    """Check if ffmpeg binary is available in PATH."""
    return _binary_available("ffmpeg")


def ffprobe_available() -> bool:
    """Check if ffprobe binary is available in PATH."""
    return _binary_available("ffprobe")


def ffmpeg_binaries_available() -> bool:
    """
    Check if both ffmpeg AND ffprobe are available.

    Both are required for audio extraction pipeline.

    Returns:
        True only if both binaries are found in PATH
    """
    return ffmpeg_available() and ffprobe_available()


# =============================================================================
# Version Detection
# =============================================================================

def _get_binary_version(binary_name: str) -> Optional[str]:
    """
    Get version string from a binary (ffmpeg or ffprobe).

    Returns:
        Version string or None if binary not found/failed
    """
    # First check if binary exists to avoid subprocess errors
    if not _binary_available(binary_name):
        return None

    try:
        result = subprocess.run(
            [binary_name, "-version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            # First line typically contains version
            first_line = result.stdout.split("\n")[0]
            return first_line.strip()
        return None
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return None


def get_ffmpeg_version() -> Optional[str]:
    """Get ffmpeg version string."""
    return _get_binary_version("ffmpeg")


def get_ffprobe_version() -> Optional[str]:
    """Get ffprobe version string."""
    return _get_binary_version("ffprobe")


def get_ffmpeg_versions() -> Dict[str, Optional[str]]:
    """
    Get version strings for both ffmpeg and ffprobe.

    Returns:
        Dict with ffmpeg_version and ffprobe_version (None if not found)
    """
    return {
        "ffmpeg_version": get_ffmpeg_version(),
        "ffprobe_version": get_ffprobe_version(),
    }


def check_dependencies() -> Dict[str, Any]:
    """
    Check availability of required dependencies.

    Returns:
        Dict with availability status for each dependency
    """
    versions = get_ffmpeg_versions()
    return {
        "ffmpeg_available": versions["ffmpeg_version"] is not None,
        "ffprobe_available": versions["ffprobe_version"] is not None,
        "whisper_available": WHISPER_AVAILABLE,
        "ffmpeg_version": versions["ffmpeg_version"],
        "ffprobe_version": versions["ffprobe_version"],
    }


# =============================================================================
# Audio Extraction (Stage 1)
# =============================================================================

def probe_video_audio(video_path: str) -> Dict[str, Any]:
    """
    Probe video file for audio stream information using ffprobe.

    Args:
        video_path: Path to video file

    Returns:
        Dict with:
            - has_audio: bool
            - audio_codec: str or None
            - duration_ms: int or None
            - sample_rate: int or None
            - channels: int or None
            - error_reason_code: str or None
            - audit: dict with stdout/stderr/returncode
    """
    result = {
        "has_audio": False,
        "audio_codec": None,
        "duration_ms": None,
        "sample_rate": None,
        "channels": None,
        "error_reason_code": None,
        "audit": {},
    }

    try:
        # Run ffprobe to get audio stream info
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=codec_name,duration,sample_rate,channels",
            "-of", "json",
            video_path
        ]

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )

        # Store audit info
        result["audit"] = {
            "command": " ".join(cmd),
            "returncode": proc.returncode,
            "stdout": proc.stdout[:2000] if proc.stdout else "",
            "stderr": proc.stderr[:2000] if proc.stderr else "",
        }

        if proc.returncode != 0:
            result["error_reason_code"] = "PROBE_FAILED"
            return result

        # Parse JSON output
        try:
            probe_data = json.loads(proc.stdout)
            streams = probe_data.get("streams", [])

            if not streams:
                result["error_reason_code"] = "NO_AUDIO_STREAM"
                return result

            audio_stream = streams[0]
            result["has_audio"] = True
            result["audio_codec"] = audio_stream.get("codec_name")
            result["sample_rate"] = int(audio_stream.get("sample_rate", 0)) or None
            result["channels"] = int(audio_stream.get("channels", 0)) or None

            # Duration may be in stream or format
            duration_str = audio_stream.get("duration")
            if duration_str:
                result["duration_ms"] = int(float(duration_str) * 1000)

        except json.JSONDecodeError:
            result["error_reason_code"] = "PROBE_FAILED"

    except subprocess.TimeoutExpired:
        result["error_reason_code"] = "PROBE_FAILED"
        result["audit"]["error"] = "Timeout after 30 seconds"
    except FileNotFoundError:
        result["error_reason_code"] = "PROBE_FAILED"
        result["audit"]["error"] = "ffprobe not found in PATH"
    except Exception as e:
        result["error_reason_code"] = "PROBE_FAILED"
        result["audit"]["error"] = str(e)

    return result


def extract_audio(video_path: str, output_path: str) -> Dict[str, Any]:
    """
    Extract audio from video file as 16kHz mono WAV using ffmpeg.

    Args:
        video_path: Path to input video file
        output_path: Path for output WAV file

    Returns:
        Dict with:
            - success: bool
            - error_reason_code: str or None
            - audit: dict with stdout/stderr/returncode
    """
    result = {
        "success": False,
        "error_reason_code": None,
        "audit": {},
    }

    try:
        # ffmpeg command to extract audio as 16kHz mono WAV
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output
            "-i", video_path,
            "-vn",  # No video
            "-acodec", "pcm_s16le",  # 16-bit PCM
            "-ar", "16000",  # 16kHz sample rate (Whisper expects this)
            "-ac", "1",  # Mono
            output_path
        ]

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 2 minutes for long videos
        )

        # Store audit info
        result["audit"] = {
            "command": " ".join(cmd),
            "returncode": proc.returncode,
            "stdout": proc.stdout[:2000] if proc.stdout else "",
            "stderr": proc.stderr[:2000] if proc.stderr else "",
        }

        if proc.returncode != 0:
            result["error_reason_code"] = "EXTRACTION_FAILED"
            return result

        # Verify output file exists and has content
        if not os.path.exists(output_path):
            result["error_reason_code"] = "EXTRACTION_FAILED"
            result["audit"]["error"] = "Output file not created"
            return result

        if os.path.getsize(output_path) < 1000:  # Less than 1KB
            result["error_reason_code"] = "INVALID_AUDIO_FILE"
            result["audit"]["error"] = f"Output file too small: {os.path.getsize(output_path)} bytes"
            return result

        result["success"] = True

    except subprocess.TimeoutExpired:
        result["error_reason_code"] = "EXTRACTION_FAILED"
        result["audit"]["error"] = "Timeout after 120 seconds"
    except FileNotFoundError:
        result["error_reason_code"] = "EXTRACTION_FAILED"
        result["audit"]["error"] = "ffmpeg not found in PATH"
    except Exception as e:
        result["error_reason_code"] = "EXTRACTION_FAILED"
        result["audit"]["error"] = str(e)

    return result


# =============================================================================
# ASR Transcription (Stages 2 & 3)
# =============================================================================

def _load_whisper_model(model_size: str = DEFAULT_MODEL_SIZE) -> Optional[Any]:
    """
    Load Whisper model with deterministic CPU settings.

    Args:
        model_size: Model size (tiny, base, small, medium, large)

    Returns:
        WhisperModel instance or None if not available
    """
    if not WHISPER_AVAILABLE:
        return None

    try:
        model = WhisperModel(
            model_size,
            device=COMPUTE_SETTINGS["device"],
            compute_type=COMPUTE_SETTINGS["compute_type"],
            cpu_threads=COMPUTE_SETTINGS["cpu_threads"],
        )
        return model
    except Exception:
        return None


def transcribe_audio(
    audio_path: str,
    model_size: str = DEFAULT_MODEL_SIZE
) -> Dict[str, Any]:
    """
    Transcribe audio file using faster-whisper with deterministic settings.

    Includes VAD gating to prevent hallucinations on music-only audio.

    Args:
        audio_path: Path to 16kHz mono WAV file
        model_size: Whisper model size

    Returns:
        Dict with:
            - transcript: str or None
            - segments: list of segment dicts
            - speech_detected: bool
            - vad_coverage_percent: float
            - asr_quality: "GOOD" | "PARTIAL" | "FAILED" | "SKIPPED_NO_SPEECH"
            - asr_model_id: str
            - asr_settings: dict
            - error_reason_code: str or None
    """
    result = {
        "transcript": None,
        "segments": [],
        "speech_detected": False,
        "vad_coverage_percent": 0.0,
        "asr_quality": None,
        "asr_model_id": MODEL_ID_FORMAT.format(size=model_size),
        "asr_settings": {
            **ASR_SETTINGS,
            **COMPUTE_SETTINGS,
            "ffmpeg_version": get_ffmpeg_version(),
            "ffprobe_version": get_ffprobe_version(),
        },
        "error_reason_code": None,
    }

    # Check Whisper availability
    if not WHISPER_AVAILABLE:
        result["error_reason_code"] = "WHISPER_NOT_AVAILABLE"
        result["asr_quality"] = "FAILED"
        return result

    # Load model
    model = _load_whisper_model(model_size)
    if model is None:
        result["error_reason_code"] = "ASR_FAILED"
        result["asr_quality"] = "FAILED"
        return result

    try:
        # Run transcription with VAD filtering
        segments_gen, info = model.transcribe(
            audio_path,
            beam_size=ASR_SETTINGS["beam_size"],
            temperature=ASR_SETTINGS["temperature"],
            condition_on_previous_text=ASR_SETTINGS["condition_on_previous_text"],
            word_timestamps=ASR_SETTINGS["word_timestamps"],
            language=ASR_SETTINGS["language"],
            vad_filter=ASR_SETTINGS["vad_filter"],
            vad_parameters=ASR_SETTINGS["vad_parameters"],
        )

        # Process segments
        segments = []
        transcript_parts = []
        total_speech_duration_ms = 0
        quality_scores = []

        for segment in segments_gen:
            start_ms = int(segment.start * 1000)
            end_ms = int(segment.end * 1000)
            text = segment.text.strip()

            if text:  # Only include non-empty segments
                seg_dict = {
                    "start_ms": start_ms,
                    "end_ms": end_ms,
                    "text": text,
                    "avg_logprob": segment.avg_logprob,  # Store raw for audit
                }
                segments.append(seg_dict)
                transcript_parts.append(text)
                total_speech_duration_ms += (end_ms - start_ms)
                quality_scores.append(segment.avg_logprob)

        # Calculate VAD coverage
        audio_duration_ms = info.duration * 1000 if info.duration else 1
        vad_coverage = (total_speech_duration_ms / audio_duration_ms) * 100 if audio_duration_ms > 0 else 0
        result["vad_coverage_percent"] = round(vad_coverage, 2)

        # Check speech threshold
        if vad_coverage < VAD_SPEECH_THRESHOLD_PERCENT:
            result["speech_detected"] = False
            result["asr_quality"] = "SKIPPED_NO_SPEECH"
            result["segments"] = []  # Clear segments for no-speech case
            result["transcript"] = None
            return result

        result["speech_detected"] = True
        result["segments"] = segments
        result["transcript"] = " ".join(transcript_parts) if transcript_parts else None

        # Determine ASR quality based on avg_logprob scores
        if not quality_scores:
            result["asr_quality"] = "FAILED"
            result["error_reason_code"] = "ASR_LOW_CONFIDENCE"
        elif all(s >= ASR_QUALITY_GOOD_THRESHOLD for s in quality_scores):
            result["asr_quality"] = "GOOD"
        elif any(s >= ASR_QUALITY_PARTIAL_THRESHOLD for s in quality_scores):
            result["asr_quality"] = "PARTIAL"
        else:
            result["asr_quality"] = "FAILED"
            result["error_reason_code"] = "ASR_LOW_CONFIDENCE"

    except Exception as e:
        result["error_reason_code"] = "ASR_FAILED"
        result["asr_quality"] = "FAILED"
        result["asr_settings"]["error"] = str(e)

    return result


# =============================================================================
# Main Pipeline
# =============================================================================

def _build_ffmpeg_not_found_result() -> Dict[str, Any]:
    """
    Build a deterministic failure result when ffmpeg/ffprobe are not found.

    Returns a properly structured result with FFMPEG_NOT_FOUND error code
    and appropriate asr_settings for audit trail.
    """
    versions = get_ffmpeg_versions()
    return {
        "processed_at": datetime.now().isoformat(),
        "availability": "unknown",  # Cannot confirm audio presence/absence without ffprobe
        "speech_detected": None,
        "vad_coverage_percent": None,
        "transcript": None,
        "segments": None,
        "asr_quality": None,
        "asr_model_id": None,
        "asr_settings": {
            **ASR_SETTINGS,
            **COMPUTE_SETTINGS,
            "ffmpeg_version": versions["ffmpeg_version"],  # Will be None
            "ffprobe_version": versions["ffprobe_version"],  # Will be None
            "ffmpeg_available": ffmpeg_available(),
            "ffprobe_available": ffprobe_available(),
        },
        "excerpts": None,
        "error_reason_code": "FFMPEG_NOT_FOUND",
        "probe_audit": {
            "error": "ffmpeg and/or ffprobe not found in PATH. Install ffmpeg to enable audio analysis.",
            "ffmpeg_in_path": ffmpeg_available(),
            "ffprobe_in_path": ffprobe_available(),
        },
        "extraction_audit": None,
    }


def process_audio_from_video(
    video_path: str,
    scan_id: str,
    tmp_dir: str,
    model_size: str = DEFAULT_MODEL_SIZE
) -> Dict[str, Any]:
    """
    Complete audio processing pipeline for a video file.

    Stages:
        0. Check for ffmpeg/ffprobe availability (MUST pass before proceeding)
        1. Probe video for audio stream
        2. Extract audio to temporary WAV
        3. Transcribe with VAD gating
        4. Clean up temporary files

    Args:
        video_path: Path to input video file
        scan_id: Scan ID for file naming
        tmp_dir: Directory for temporary files
        model_size: Whisper model size

    Returns:
        AudioAnalysis dict ready for storage in scan_result
    """
    # ==========================================================================
    # Stage 0: Check for ffmpeg/ffprobe BEFORE attempting any subprocess calls
    # ==========================================================================
    if not ffmpeg_binaries_available():
        print("[audio_processor] ffmpeg/ffprobe not found in PATH - returning FFMPEG_NOT_FOUND")
        return _build_ffmpeg_not_found_result()

    audio_path = os.path.join(tmp_dir, f"{scan_id}_audio.wav")

    result = {
        "processed_at": datetime.now().isoformat(),
        "availability": "unknown",
        "speech_detected": None,
        "vad_coverage_percent": None,
        "transcript": None,
        "segments": None,
        "asr_quality": None,
        "asr_model_id": None,
        "asr_settings": None,
        "excerpts": None,
        "error_reason_code": None,
        "probe_audit": None,
        "extraction_audit": None,
    }

    try:
        # Stage 1: Probe for audio stream
        probe_result = probe_video_audio(video_path)
        result["probe_audit"] = probe_result.get("audit")

        if probe_result.get("error_reason_code"):
            if probe_result["error_reason_code"] == "NO_AUDIO_STREAM":
                result["availability"] = "absent"
            else:
                result["availability"] = "unknown"
            result["error_reason_code"] = probe_result["error_reason_code"]
            return result

        if not probe_result.get("has_audio"):
            result["availability"] = "absent"
            result["error_reason_code"] = "NO_AUDIO_STREAM"
            return result

        # Stage 2: Extract audio
        extract_result = extract_audio(video_path, audio_path)
        result["extraction_audit"] = extract_result.get("audit")

        if not extract_result.get("success"):
            result["availability"] = "unknown"
            result["error_reason_code"] = extract_result.get("error_reason_code", "EXTRACTION_FAILED")
            return result

        # Stage 3: Transcribe
        transcribe_result = transcribe_audio(audio_path, model_size)

        result["availability"] = "present_processed"
        result["speech_detected"] = transcribe_result.get("speech_detected")
        result["vad_coverage_percent"] = transcribe_result.get("vad_coverage_percent")
        result["transcript"] = transcribe_result.get("transcript")
        result["segments"] = transcribe_result.get("segments")
        result["asr_quality"] = transcribe_result.get("asr_quality")
        result["asr_model_id"] = transcribe_result.get("asr_model_id")
        result["asr_settings"] = transcribe_result.get("asr_settings")
        result["error_reason_code"] = transcribe_result.get("error_reason_code")

    finally:
        # Always clean up temporary audio file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except OSError:
                pass

    return result


def is_audio_processing_available() -> bool:
    """
    Check if audio processing is available (all dependencies present).

    Returns:
        True if ffmpeg, ffprobe, and faster-whisper are available
    """
    return ffmpeg_binaries_available() and WHISPER_AVAILABLE


def get_audio_dependencies_status() -> Dict[str, Any]:
    """
    Get detailed status of audio processing dependencies.

    Useful for diagnostics and user-facing error messages.

    Returns:
        Dict with availability status and version info for each dependency
    """
    versions = get_ffmpeg_versions()
    return {
        "ffmpeg_available": ffmpeg_available(),
        "ffprobe_available": ffprobe_available(),
        "ffmpeg_binaries_available": ffmpeg_binaries_available(),
        "whisper_available": WHISPER_AVAILABLE,
        "all_available": is_audio_processing_available(),
        "ffmpeg_version": versions["ffmpeg_version"],
        "ffprobe_version": versions["ffprobe_version"],
        "missing_components": _get_missing_components(),
    }


def _get_missing_components() -> List[str]:
    """Get list of missing audio processing components."""
    missing = []
    if not ffmpeg_available():
        missing.append("ffmpeg")
    if not ffprobe_available():
        missing.append("ffprobe")
    if not WHISPER_AVAILABLE:
        missing.append("faster-whisper")
    return missing
