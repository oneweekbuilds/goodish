from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime


class Topic(BaseModel):
    topic: str
    percentage: float

    @field_validator('percentage')
    @classmethod
    def validate_percentage(cls, v):
        """Ensure percentage is between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('percentage must be between 0 and 100')
        return round(v, 2)

class ToneBreakdown(BaseModel):
    positive: float
    neutral: float
    negative: float

    @field_validator('positive', 'neutral', 'negative')
    @classmethod
    def validate_tone_percentages(cls, v):
        """Ensure tone percentages are between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('tone percentages must be between 0 and 100')
        return round(v, 2)

class ContentTypeBreakdown(BaseModel):
    ads: float
    talking_head: float
    text_overlay: float
    product_promotions: float
    lifestyle_videos: float

    @field_validator('ads', 'talking_head', 'text_overlay', 'product_promotions', 'lifestyle_videos')
    @classmethod
    def validate_content_percentages(cls, v):
        """Ensure content type percentages are between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('content type percentages must be between 0 and 100')
        return round(v, 2)

class WellbeingSignals(BaseModel):
    body_image_focus: float
    diet_weight_loss_focus: float
    conflict_politics_focus: float

    @field_validator('body_image_focus', 'diet_weight_loss_focus', 'conflict_politics_focus')
    @classmethod
    def validate_wellbeing_percentages(cls, v):
        """Ensure wellbeing percentages are between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('wellbeing percentages must be between 0 and 100')
        return round(v, 2)

class PoliticalSignals(BaseModel):
    politicalContentShare: float
    politicalLeanScore: float
    politicalLeanLabel: str

    @field_validator('politicalContentShare', 'politicalLeanScore')
    @classmethod
    def validate_political_percentages(cls, v):
        """Ensure political percentages are between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('political percentages must be between 0 and 100')
        return round(v, 2)

class Product(BaseModel):
    name: str
    category: str
    approxFrequency: float

    @field_validator('name', 'category')
    @classmethod
    def validate_required_fields(cls, v):
        """Ensure name and category are not empty."""
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError('name and category are required non-empty strings')
        return v.strip()

    @field_validator('approxFrequency')
    @classmethod
    def validate_frequency(cls, v):
        """Ensure frequency is a positive number."""
        if v < 0:
            raise ValueError('approxFrequency must be positive')
        return round(v, 2)

class EngagementDriver(BaseModel):
    label: str
    confidence: float

    @field_validator('label')
    @classmethod
    def validate_label(cls, v):
        """Ensure label is not empty."""
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError('label is required and must be non-empty')
        return v.strip()

    @field_validator('confidence')
    @classmethod
    def validate_confidence(cls, v):
        """Ensure confidence is between 0 and 1 (or 0 and 100)."""
        if v < 0 or v > 100:
            raise ValueError('confidence must be between 0 and 100')
        return round(v, 2)

class Insights(BaseModel):
    adPercentage: float
    estimatedAdsPer10Posts: float
    topTopics: List[Topic]
    topicDiversityScore: float
    repetitionScore: float
    toneBreakdown: ToneBreakdown
    contentTypeBreakdown: ContentTypeBreakdown
    wellbeingSignals: WellbeingSignals
    politicalSignals: PoliticalSignals
    topPromotedProducts: List[Product]
    engagementDrivers: List[EngagementDriver]

    @field_validator('adPercentage', 'estimatedAdsPer10Posts')
    @classmethod
    def validate_insight_percentages(cls, v):
        """Ensure ad percentages are between 0 and 100."""
        if v < 0 or v > 100:
            raise ValueError('ad percentages must be between 0 and 100')
        return round(v, 2)

    @field_validator('topicDiversityScore', 'repetitionScore')
    @classmethod
    def validate_scores(cls, v):
        """Ensure diversity and repetition scores are between 0 and 1."""
        if v < 0 or v > 1:
            raise ValueError('diversity and repetition scores must be between 0 and 1')
        return round(v, 3)

class Meta(BaseModel):
    frameCountAnalyzed: int
    deletedRawVideo: bool
    processingTimeSeconds: float

    @field_validator('frameCountAnalyzed')
    @classmethod
    def validate_frame_count(cls, v):
        """Ensure frame count is non-negative."""
        if v < 0:
            raise ValueError('frameCountAnalyzed must be non-negative')
        return v

    @field_validator('processingTimeSeconds')
    @classmethod
    def validate_processing_time(cls, v):
        """Ensure processing time is non-negative."""
        if v < 0:
            raise ValueError('processingTimeSeconds must be non-negative')
        return round(v, 2)

class ScanResult(BaseModel):
    scanId: str
    userId: str
    platform: str
    scanDurationSeconds: float
    timestamp: datetime
    insights: Insights
    meta: Meta

    @field_validator('scanId', 'userId', 'platform')
    @classmethod
    def validate_required_strings(cls, v):
        """Ensure required string fields are not empty."""
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError('scanId, userId, and platform are required non-empty strings')
        return v.strip()

    @field_validator('scanDurationSeconds')
    @classmethod
    def validate_duration(cls, v):
        """Ensure scan duration is non-negative."""
        if v < 0:
            raise ValueError('scanDurationSeconds must be non-negative')
        return round(v, 2)
