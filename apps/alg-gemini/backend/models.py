from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Topic(BaseModel):
    topic: str
    percentage: float

class ToneBreakdown(BaseModel):
    positive: float
    neutral: float
    negative: float

class ContentTypeBreakdown(BaseModel):
    ads: float
    talking_head: float
    text_overlay: float
    product_promotions: float
    lifestyle_videos: float

class WellbeingSignals(BaseModel):
    body_image_focus: float
    diet_weight_loss_focus: float
    conflict_politics_focus: float

class PoliticalSignals(BaseModel):
    politicalContentShare: float
    politicalLeanScore: float
    politicalLeanLabel: str

class Product(BaseModel):
    name: str
    category: str
    approxFrequency: float

class EngagementDriver(BaseModel):
    label: str
    confidence: float

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

class Meta(BaseModel):
    frameCountAnalyzed: int
    deletedRawVideo: bool
    processingTimeSeconds: float

class ScanResult(BaseModel):
    scanId: str
    userId: str
    platform: str
    scanDurationSeconds: float
    timestamp: datetime
    insights: Insights
    meta: Meta
