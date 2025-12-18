import cv2
import pytesseract
from PIL import Image
import numpy as np
import os
import uuid
from datetime import datetime
import time
from unified_scan_models import (
    UnifiedScanResult, ScanMetadata, Environment, VideoCaptureInfo,
    FeedItem, AdMetadata, ContentText, TopicsInfo, PoliticalInfo,
    WellbeingInfo, EngagementDrivers, RepetitionInfo, SourceDetails,
    Aggregates, TopicDistributionEntry, WellbeingSummary, ValenceDistribution,
    PoliticalContentSummary, RepetitionSummary, EngagementPatternSummary, HookCount,
    PrivacyInfo, DebugInfo, ScreenResolution, OcrMetadata,
    AudioAnalysis, AudioSegment, AudioExcerpt
)
from ocr_utils import (
    extract_text_with_preprocessing,
    extract_text_multi_pass,
    compute_average_ocr_confidence_v2,
    detect_ad_from_ocr,
    OCRDebugger,
    get_ocr_debug_enabled
)
from audio_processor import (
    process_audio_from_video,
    is_audio_processing_available
)
from audio_signals import extract_audio_excerpts

# Ensure Tesseract is available.
# On Windows, you might need to set the path explicitly if it's not in PATH.
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def process_video(file_path: str, user_id: str = "demo-user", platform: str = "tiktok") -> UnifiedScanResult:
    start_time = time.time()
    scan_id = str(uuid.uuid4())

    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    # Sample every ~400ms
    sample_rate_ms = 400
    frame_interval = int(fps * (sample_rate_ms / 1000)) if fps > 0 else 10
    if frame_interval < 1:
        frame_interval = 1

    frames_analyzed = 0
    feed_items = []

    # Initialize OCR debugger for tracking OCR quality
    ocr_debugger = OCRDebugger(scan_id)

    # Track OCR metrics for aggregates
    ocr_total_chars = 0
    ocr_non_empty_frames = 0
    ocr_ad_detections = 0  # Ads detected via OCR disclosure tokens

    # Accumulators for aggregates
    topic_counts = {
        "fitness": 0,
        "shopping/beauty": 0,
        "funny/memes": 0,
        "politics": 0,
        "gaming": 0,
        "educational": 0
    }

    positive_score = 0
    neutral_score = 0
    negative_score = 0

    political_items_count = 0
    ad_items_count = 0

    hook_counts = {}

    current_frame = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if current_frame % frame_interval == 0:
            frames_analyzed += 1

            # Multi-pass OCR with ROI extraction for better accuracy on mobile video frames
            # Uses multiple Tesseract configs + platform-specific ROI crops
            try:
                ocr_result = extract_text_multi_pass(frame, platform)
                text = ocr_result.get("full_text", "")
                roi_texts = ocr_result.get("roi_texts", {})
                ad_disclosure_snippet = ocr_result.get("ad_disclosure_snippet")
                handles_detected = ocr_result.get("handles_detected", [])
                ocr_quality_flags = ocr_result.get("quality_flags", {})
                best_text_source = ocr_result.get("best_text_source", "none")
            except Exception as e:
                text = ""
                roi_texts = {}
                ad_disclosure_snippet = None
                handles_detected = []
                ocr_quality_flags = {"extraction_failed": 1}
                best_text_source = "none"
                ocr_result = {}

            # Track OCR metrics
            if text:
                ocr_total_chars += len(text)
                ocr_non_empty_frames += 1

            # Also get preprocessed frame for debug recording (using sparse config)
            preprocessed_frame = None
            try:
                _, preprocessed_frame = extract_text_with_preprocessing(frame)
            except Exception:
                pass

            # Record frame for debug output (if ALGO_OCR_DEBUG=1)
            if preprocessed_frame is not None:
                ocr_debugger.record_frame(preprocessed_frame, text, current_frame)

            # Calculate OCR confidence using improved v2 method
            ocr_confidence = compute_average_ocr_confidence_v2(ocr_result) if ocr_result else 0.0

            # Create FeedItem for this frame/segment
            item = FeedItem(
                position_in_feed=frames_analyzed,
                approx_timestamp_offset_sec=(current_frame / fps) if fps > 0 else 0,
                content_type="VIDEO",
                source_details=SourceDetails(
                    capture_source_type="MOBILE_VIDEO_FRAME",
                    ocr_metadata=OcrMetadata(
                        frames_sampled=1,
                        average_ocr_confidence=round(ocr_confidence, 2) if ocr_confidence > 0 else None
                    )
                )
            )

            # Store OCR text (Task B: persist more useful data)
            # Store best combined text (truncated for storage efficiency)
            if text:
                item.content_text.on_screen_labels.append(text[:200])

            # Store best ROI text if different and useful (for downstream analysis)
            if roi_texts:
                # Get the most valuable ROI text (longest with useful content)
                best_roi_text = ""
                for roi_name, roi_text in roi_texts.items():
                    if len(roi_text) > len(best_roi_text):
                        best_roi_text = roi_text
                if best_roi_text and best_roi_text.lower() != text[:200].lower():
                    item.content_text.on_screen_labels.append(f"[roi]{best_roi_text[:150]}")

            # Store ad disclosure snippet if detected (helps downstream analysis)
            if ad_disclosure_snippet:
                item.content_text.on_screen_labels.append(f"[disclosure]{ad_disclosure_snippet}")

            # Store detected handles (useful for creator identification)
            if handles_detected:
                handles_str = " ".join(f"@{h}" for h in handles_detected[:3])  # Max 3 handles
                if handles_str not in (text or ""):  # Avoid duplication
                    item.content_text.on_screen_labels.append(f"[handles]{handles_str[:100]}")

            # Ad detection: First check for OCR-based disclosure tokens
            # This is the PRIMARY method for mobile video since platform labels aren't available
            is_ad = False
            ad_detected_reason = None
            ad_disclosure_match = None

            # Check for ad disclosure from multi-pass OCR (already detected)
            if ad_disclosure_snippet:
                is_ad = True
                ad_detected_reason = "ocr_disclosure_token"
                ad_disclosure_match = ad_disclosure_snippet
                ocr_ad_detections += 1
            else:
                # Fallback: check full text + ROI texts
                all_ocr_text = text
                for roi_text in roi_texts.values():
                    all_ocr_text += " " + roi_text

                ocr_ad_detected, matched_token = detect_ad_from_ocr(all_ocr_text)
                if ocr_ad_detected:
                    is_ad = True
                    ad_detected_reason = "ocr_disclosure_token"
                    ad_disclosure_match = matched_token
                    ocr_ad_detections += 1

            # Fallback: legacy keyword heuristics (less reliable)
            if not is_ad:
                all_text_lower = (text + " " + " ".join(roi_texts.values())).lower()
                if "shop now" in all_text_lower or "link in bio" in all_text_lower or "swipe up" in all_text_lower:
                    is_ad = True
                    ad_detected_reason = "keyword_match"

            if is_ad:
                item.is_ad = True
                item.ad_metadata = AdMetadata(
                    ad_detected_reason=ad_detected_reason,
                    sponsored_label_text=ad_disclosure_match
                )
                ad_items_count += 1
            
            # Topics (use combined text for better detection)
            combined_text_for_analysis = (text + " " + " ".join(roi_texts.values())).lower()
            detected_topic = None
            if "workout" in combined_text_for_analysis or "gym" in combined_text_for_analysis or "fitness" in combined_text_for_analysis:
                detected_topic = "fitness"
            elif "makeup" in combined_text_for_analysis or "skin" in combined_text_for_analysis or "beauty" in combined_text_for_analysis or "haul" in combined_text_for_analysis:
                detected_topic = "shopping/beauty"
            elif "lol" in combined_text_for_analysis or "funny" in combined_text_for_analysis or "meme" in combined_text_for_analysis:
                detected_topic = "funny/memes"
            elif "vote" in combined_text_for_analysis or "election" in combined_text_for_analysis or "policy" in combined_text_for_analysis:
                detected_topic = "politics"
            
            if detected_topic:
                topic_counts[detected_topic] += 1
                item.topics.secondary_categories.append(detected_topic)

            # Products (very simple extraction - using combined text)
            if "drink" in combined_text_for_analysis:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand A Energy Drink"
            if "leggings" in combined_text_for_analysis:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand B Leggings"

            # Engagement Drivers (using combined text)
            if "challenge" in combined_text_for_analysis:
                hook = "fitness challenges"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1
            if "routine" in combined_text_for_analysis:
                hook = "beauty routines"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1

            # Tone (using combined text)
            if "good" in combined_text_for_analysis or "love" in combined_text_for_analysis:
                positive_score += 1
                item.wellbeing.valence = "POSITIVE"
            elif "bad" in combined_text_for_analysis or "hate" in combined_text_for_analysis:
                negative_score += 1
                item.wellbeing.valence = "NEGATIVE"
            else:
                neutral_score += 1
                item.wellbeing.valence = "NEUTRAL"

            # Wellbeing Themes (using combined text)
            if "body" in combined_text_for_analysis or "weight" in combined_text_for_analysis:
                item.wellbeing.themes.append("body_image")
            if "diet" in combined_text_for_analysis:
                item.wellbeing.themes.append("diet_weight_loss")
            if "conflict" in combined_text_for_analysis or "drama" in combined_text_for_analysis:
                item.wellbeing.themes.append("conflict")

            # Political
            if detected_topic == "politics":
                item.political.is_political = True
                political_items_count += 1
                # Note: stance_or_alignment_guess left as None - we don't have enough signal to infer this

            feed_items.append(item)

        current_frame += 1
        
    cap.release()

    # Finalize OCR debugger (saves frames and logs summary if ALGO_OCR_DEBUG=1)
    ocr_summary = ocr_debugger.finalize()

    # ==========================================================================
    # Audio Processing (MUST happen BEFORE video deletion)
    # ==========================================================================
    audio_analysis = None
    if is_audio_processing_available():
        try:
            tmp_dir = os.path.dirname(file_path)
            audio_result = process_audio_from_video(
                video_path=file_path,
                scan_id=scan_id,
                tmp_dir=tmp_dir
            )

            # Extract excerpts if we have a transcript
            excerpts_result = None
            if audio_result.get("transcript") and audio_result.get("segments"):
                excerpts_result = extract_audio_excerpts(
                    transcript=audio_result["transcript"],
                    segments=audio_result["segments"],
                    max_excerpts=10
                )

            # Build AudioAnalysis model
            segments_models = None
            if audio_result.get("segments"):
                segments_models = [
                    AudioSegment(
                        start_ms=seg["start_ms"],
                        end_ms=seg["end_ms"],
                        text=seg["text"],
                        avg_logprob=seg.get("avg_logprob")
                    )
                    for seg in audio_result["segments"]
                ]

            excerpts_models = None
            if excerpts_result and excerpts_result.get("excerpts"):
                excerpts_models = [
                    AudioExcerpt(
                        start_ms=exc["start_ms"],
                        end_ms=exc["end_ms"],
                        text=exc["text"],
                        signal_type=exc["signal_type"],
                        matched_term=exc["matched_term"]
                    )
                    for exc in excerpts_result["excerpts"]
                ]

            audio_analysis = AudioAnalysis(
                processed_at=audio_result.get("processed_at"),
                availability=audio_result.get("availability", "unknown"),
                speech_detected=audio_result.get("speech_detected"),
                vad_coverage_percent=audio_result.get("vad_coverage_percent"),
                transcript=audio_result.get("transcript"),
                segments=segments_models,
                asr_quality=audio_result.get("asr_quality"),
                asr_model_id=audio_result.get("asr_model_id"),
                asr_settings=audio_result.get("asr_settings"),
                excerpts=excerpts_models,
                error_reason_code=audio_result.get("error_reason_code"),
                # Omit audit trails to reduce storage (uncomment for debugging)
                # probe_audit=audio_result.get("probe_audit"),
                # extraction_audit=audio_result.get("extraction_audit"),
            )

            print(f"[video_processor] Audio analysis: availability={audio_analysis.availability}, "
                  f"speech_detected={audio_analysis.speech_detected}, "
                  f"quality={audio_analysis.asr_quality}, "
                  f"transcript_len={len(audio_analysis.transcript) if audio_analysis.transcript else 0}")

        except Exception as e:
            print(f"[video_processor] Audio processing failed: {e}")
            audio_analysis = AudioAnalysis(
                availability="unknown",
                error_reason_code="ASR_FAILED",
                asr_settings={"error": str(e)}
            )
    else:
        # Audio processing not available (missing dependencies)
        print("[video_processor] Audio processing skipped (dependencies not available)")
        audio_analysis = AudioAnalysis(
            availability="present_unprocessed",
            error_reason_code="WHISPER_NOT_AVAILABLE"
        )

    # Delete file
    try:
        os.remove(file_path)
        deleted_raw_video = True
    except OSError:
        deleted_raw_video = False

    # Aggregate results
    total_samples = frames_analyzed if frames_analyzed > 0 else 1

    ad_percentage = ad_items_count / total_samples

    # Log OCR summary even when not in debug mode (helps diagnose issues)
    print(f"[video_processor] OCR Summary: {ocr_non_empty_frames}/{frames_analyzed} frames with text, "
          f"{ocr_ad_detections} ads detected via OCR, "
          f"avg chars: {ocr_total_chars / max(ocr_non_empty_frames, 1):.0f}")
    
    # Normalize topics
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    topic_distribution = [
        TopicDistributionEntry(category=t, count=c, percentage=c/total_samples) 
        for t, c in sorted_topics if c > 0
    ]
    
    # Engagement Hooks
    top_hooks = [
        HookCount(hook=k, count=v) for k, v in hook_counts.items()
    ]

    processing_time = time.time() - start_time

    # Construct Unified Result
    return UnifiedScanResult(
        scan_metadata=ScanMetadata(
            scan_id=scan_id,
            created_at=datetime.now(),
            source_type="MOBILE_VIDEO",
            platform=platform.upper(),
            user_identifier=user_id
        ),
        environment=Environment(
            device_type="MOBILE",
            screen_resolution=ScreenResolution(width=width, height=height),
            video_capture=VideoCaptureInfo(
                is_video_based=True,
                duration_seconds=duration,
                frame_rate_fps=fps,
                approx_feed_items_visible=frames_analyzed,  # Treating samples as items for MVP
                sample_interval_ms=sample_rate_ms,  # Store sampling interval explicitly
                audio_analysis=audio_analysis  # Scan-level audio analysis
            )
        ),
        feed_items=feed_items,
        aggregates=Aggregates(
            total_feed_items=frames_analyzed,
            total_ads=ad_items_count,
            ad_percentage=ad_percentage,
            topic_distribution=topic_distribution,
            wellbeing_summary=WellbeingSummary(
                high_relevance_items=0, # Placeholder
                valence_distribution=ValenceDistribution(
                    POSITIVE=positive_score,
                    NEUTRAL=neutral_score,
                    NEGATIVE=negative_score
                )
            ),
            political_content_summary=PoliticalContentSummary(
                political_items=political_items_count,
                political_percentage=political_items_count/total_samples
            ),
            repetition_summary=RepetitionSummary(
                items_in_repetition_clusters=0,  # Real repetition detection not implemented yet
                largest_cluster_size=0
            ),
            engagement_pattern_summary=EngagementPatternSummary(
                top_hooks=top_hooks
            )
        ),
        debug=DebugInfo(
            processing_time_seconds=processing_time,
            frames_extracted=frames_analyzed,
            frames_sampled_for_ocr=frames_analyzed,
            raw_backend_payload={
                "ocr_summary": {
                    "frames_with_text": ocr_non_empty_frames,
                    "ocr_ad_detections": ocr_ad_detections,
                    "avg_text_length": ocr_summary.get("avg_text_length", 0),
                    "max_text_length": ocr_summary.get("max_text_length", 0),
                    "non_empty_rate_percent": ocr_summary.get("non_empty_rate", 0),
                    "debug_enabled": get_ocr_debug_enabled(),
                },
                "multi_pass_ocr": {
                    "enabled": True,
                    "passes_configured": ["sparse", "block", "single_line"],
                    "roi_extraction_enabled": True,
                    "platform_roi_config": platform.lower() if platform else "default",
                }
            }
        )
    )
