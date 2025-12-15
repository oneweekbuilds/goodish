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
    PrivacyInfo, DebugInfo, ScreenResolution
)

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
            
            # Convert to RGB for Pillow
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)
            
            # OCR
            try:
                text = pytesseract.image_to_string(pil_image).lower()
            except Exception:
                text = "" # Tesseract might fail or not be installed
            
            # Create FeedItem for this frame/segment
            item = FeedItem(
                position_in_feed=frames_analyzed,
                approx_timestamp_offset_sec=(current_frame / fps) if fps > 0 else 0,
                content_type="VIDEO",
                source_details=SourceDetails(
                    capture_source_type="MOBILE_VIDEO_FRAME",
                    ocr_metadata={"frames_sampled": 1}
                )
            )
            
            item.content_text.on_screen_labels.append(text[:100]) # Store snippet

            # Heuristics
            is_ad = False
            if "sponsored" in text or "ad" in text or "shop now" in text or "link in bio" in text:
                is_ad = True
                item.is_ad = True
                item.ad_metadata = AdMetadata(ad_detected_reason="keyword_match")
                ad_items_count += 1
            
            # Topics
            detected_topic = None
            if "workout" in text or "gym" in text or "fitness" in text:
                detected_topic = "fitness"
            elif "makeup" in text or "skin" in text or "beauty" in text or "haul" in text:
                detected_topic = "shopping/beauty"
            elif "lol" in text or "funny" in text or "meme" in text:
                detected_topic = "funny/memes"
            elif "vote" in text or "election" in text or "policy" in text:
                detected_topic = "politics"
            
            if detected_topic:
                topic_counts[detected_topic] += 1
                item.topics.secondary_categories.append(detected_topic)

            # Products (very simple extraction)
            if "drink" in text:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand A Energy Drink"
            if "leggings" in text:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand B Leggings"
                
            # Engagement Drivers
            if "challenge" in text:
                hook = "fitness challenges"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1
            if "routine" in text:
                hook = "beauty routines"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1
            
            # Tone
            if "good" in text or "love" in text:
                positive_score += 1
                item.wellbeing.valence = "POSITIVE"
            elif "bad" in text or "hate" in text:
                negative_score += 1
                item.wellbeing.valence = "NEGATIVE"
            else:
                neutral_score += 1
                item.wellbeing.valence = "NEUTRAL"

            # Wellbeing Themes
            if "body" in text or "weight" in text:
                item.wellbeing.themes.append("body_image")
            if "diet" in text:
                item.wellbeing.themes.append("diet_weight_loss")
            if "conflict" in text or "drama" in text:
                item.wellbeing.themes.append("conflict")

            # Political
            if detected_topic == "politics":
                item.political.is_political = True
                political_items_count += 1
                # Note: stance_or_alignment_guess left as None - we don't have enough signal to infer this

            feed_items.append(item)

        current_frame += 1
        
    cap.release()
    
    # Delete file
    try:
        os.remove(file_path)
        deleted_raw_video = True
    except OSError:
        deleted_raw_video = False

    # Aggregate results
    total_samples = frames_analyzed if frames_analyzed > 0 else 1
    
    ad_percentage = ad_items_count / total_samples
    
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
                approx_feed_items_visible=frames_analyzed # Treating samples as items for MVP
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
            frames_extracted=frames_analyzed
        )
    )
