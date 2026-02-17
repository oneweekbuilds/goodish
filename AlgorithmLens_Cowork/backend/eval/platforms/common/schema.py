"""
Common capture schema for all platform modules.

Every platform capture module normalizes its data to these models.
This ensures the grader, fixer, and reporter work identically
regardless of which platform the data came from.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PostEngagement(BaseModel):
    """Engagement metrics for a single post."""
    likes: int = 0
    comments: int = 0
    shares: int = 0      # retweets, reposts, etc.
    views: int = 0
    bookmarks: int = 0


class CapturedPost(BaseModel):
    """A single post captured from a social media feed."""
    id: str                                     # Unique identifier (platform post ID or generated)
    author: str                                 # Handle or username
    author_display_name: Optional[str] = None   # Display name if different from handle
    content_text: str = ""                      # Full text content of the post
    content_type: str = "text"                  # text | image | video | link | carousel | story | reel
    media_urls: List[str] = Field(default_factory=list)
    engagement: PostEngagement = Field(default_factory=PostEngagement)
    timestamp: Optional[str] = None             # ISO-8601 if available
    is_ad: bool = False                         # Whether the post is marked as an ad/promoted
    is_repost: bool = False                     # Whether this is a retweet/repost
    original_author: Optional[str] = None       # If repost, the original author
    position_in_feed: int = 0                   # Order in which it appeared
    hashtags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Platform-specific extras


class FeedMetadata(BaseModel):
    """Metadata about the feed capture session."""
    total_posts_captured: int = 0
    scroll_depth: str = "unknown"               # How far down the feed we scrolled
    feed_type: str = "for_you"                  # for_you | following | explore | trending | etc.
    capture_duration_seconds: Optional[float] = None


class CaptureSnapshot(BaseModel):
    """
    Complete snapshot of a captured feed.

    This is the ground truth reference that analysis results
    are compared against during grading.
    """
    platform: str                               # twitter | instagram | reddit | tiktok | etc.
    capture_timestamp: str                      # ISO-8601
    screenshot_path: Optional[str] = None       # Path to visual screenshot
    posts: List[CapturedPost] = Field(default_factory=list)
    feed_metadata: FeedMetadata = Field(default_factory=FeedMetadata)
    capture_config: Dict[str, Any] = Field(default_factory=dict)  # Settings used during capture

    def summary(self) -> str:
        """Human-readable summary of this snapshot."""
        n = len(self.posts)
        authors = len(set(p.author for p in self.posts))
        ads = sum(1 for p in self.posts if p.is_ad)
        types = {}
        for p in self.posts:
            types[p.content_type] = types.get(p.content_type, 0) + 1
        type_str = ", ".join(f"{k}: {v}" for k, v in sorted(types.items(), key=lambda x: -x[1]))
        return (
            f"[{self.platform}] {n} posts from {authors} authors "
            f"({ads} ads) | types: {type_str} | feed: {self.feed_metadata.feed_type}"
        )


class GradingCriterion(BaseModel):
    """Result for a single grading criterion."""
    name: str
    passed: bool
    category: str                               # quantitative | qualitative | completeness
    expected: Optional[Any] = None
    actual: Optional[Any] = None
    accuracy_pct: Optional[float] = None        # For quantitative checks
    threshold_pct: float = 5.0                  # The ±% threshold used
    error_description: Optional[str] = None
    fix_category: Optional[str] = None          # parsing_bug | analysis_logic | prompt_engineering | data_pipeline
    evidence: Optional[str] = None              # Supporting detail


class GradingReport(BaseModel):
    """Complete grading report for one eval cycle."""
    cycle_number: int
    timestamp: str
    overall_passed: bool
    criteria: List[GradingCriterion] = Field(default_factory=list)
    total_criteria: int = 0
    passed_criteria: int = 0
    failed_criteria: int = 0
    accuracy_scores: Dict[str, float] = Field(default_factory=dict)  # criterion_name → accuracy %
    suggested_fixes: List[Dict[str, str]] = Field(default_factory=list)  # [{category, description, target_file}]


class FixRecord(BaseModel):
    """Record of a single fix applied during the fix loop."""
    cycle_number: int
    criterion_name: str
    fix_category: str                           # parsing_bug | analysis_logic | prompt_engineering | data_pipeline
    description: str
    file_changed: Optional[str] = None
    change_summary: Optional[str] = None
    auto_fixed: bool = False                    # True if applied automatically, False if suggest-only


class EvalRunSummary(BaseModel):
    """Summary of a complete eval run (all cycles)."""
    run_id: str
    platform: str
    started_at: str
    completed_at: Optional[str] = None
    total_cycles: int = 0
    final_passed: bool = False
    threshold_pct: float = 5.0
    max_cycles: int = 10
    grading_reports: List[GradingReport] = Field(default_factory=list)
    fixes_applied: List[FixRecord] = Field(default_factory=list)
    snapshot_path: Optional[str] = None
    analysis_output_path: Optional[str] = None
    notes: Optional[str] = None
