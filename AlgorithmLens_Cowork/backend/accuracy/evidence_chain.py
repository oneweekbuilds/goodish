"""
Phase 5D1: Evidence Chain Enforcement for Ads claims.

Ensures every FINAL insight has valid evidence_ids that resolve to EvidenceItems.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from accuracy.schema import Insight, EvidenceItem, ClaimStatus


class EvidenceChainMetrics(BaseModel):
    """Metrics for evidence chain validation."""

    evidence_linking_rate: float  # (# FINAL insights with valid evidence_ids) / (# FINAL insights)
    missing_evidence_rate: float  # (# invalid evidence references) / max(1, total FINAL evidence references)
    orphan_evidence_rate: float  # (# evidence_items never referenced) / max(1, total evidence_items)
    metadata_completeness_rate: float = 1.0  # Fraction of referenced evidence with source + method_reliability
    validation_passed: bool  # True if evidence_linking_rate == 1.0 and missing_evidence_rate == 0.0


class EvidenceChainEnforcer:
    """
    Enforces evidence chain requirements for insights.
    
    Rules:
    1. FINAL insights must have >= 1 evidence_ids
    2. All evidence_ids must resolve to EvidenceItems
    3. Missing evidence causes downgrade to PRELIMINARY
    """
    
    def __init__(
        self,
        insights: List[Insight],
        evidence_items: List[EvidenceItem],
        tab_name: str = "ads",
        orphan_threshold: float = 0.20,
    ):
        """
        Initialize enforcer with insights and evidence items.
        
        Args:
            insights: List of Insight objects to validate
            evidence_items: List of EvidenceItem objects to validate against
        """
        self.insights = insights
        self.evidence_items = evidence_items
        
        # Build lookup by evidence_id
        self.evidence_lookup: Dict[str, EvidenceItem] = {
            item.evidence_id: item for item in evidence_items
        }
        self.tab_name = tab_name
        self.orphan_threshold = orphan_threshold
    
    def enforce(self) -> tuple[List[Insight], EvidenceChainMetrics]:
        """
        Enforce evidence chain requirements and compute metrics.
        
        Returns:
            Tuple of (updated_insights, metrics)
        """
        updated_insights = []
        final_insights = []
        final_with_evidence = 0
        total_final_evidence_refs = 0
        invalid_refs = 0
        missing_metadata_refs = 0
        
        # Process each insight
        for insight in self.insights:
            updated_insight = insight.model_copy(deep=True)
            
            if updated_insight.claim_status == "FINAL":
                final_insights.append(updated_insight)
                
                # Rule 1: FINAL must have >= 1 evidence_ids
                if len(updated_insight.evidence_ids) == 0:
                    # Downgrade to PRELIMINARY
                    updated_insight.claim_status = "PRELIMINARY"
                    if updated_insight.preliminary_upgrade_path is None:
                        updated_insight.preliminary_upgrade_path = "Add evidence_ids to upgrade to FINAL"
                    # Add note if available
                    if updated_insight.abstention_reason is None:
                        updated_insight.abstention_reason = "Missing evidence_ids for FINAL claim"
                else:
                    # Rule 2: All evidence_ids must exist
                    valid_refs = 0
                    for ev_id in updated_insight.evidence_ids:
                        total_final_evidence_refs += 1
                        if ev_id in self.evidence_lookup:
                            valid_refs += 1
                            ev_obj = self.evidence_lookup[ev_id]
                            if (ev_obj.source is None) or (ev_obj.method_reliability is None):
                                missing_metadata_refs += 1
                        else:
                            invalid_refs += 1
                    
                    if valid_refs == len(updated_insight.evidence_ids):
                        final_with_evidence += 1
                    else:
                        # Downgrade if any references are invalid
                        updated_insight.claim_status = "PRELIMINARY"
                        if updated_insight.preliminary_upgrade_path is None:
                            updated_insight.preliminary_upgrade_path = "Fix invalid evidence_ids to upgrade to FINAL"
                        if updated_insight.abstention_reason is None:
                            missing_ids = [ev_id for ev_id in updated_insight.evidence_ids if ev_id not in self.evidence_lookup]
                            updated_insight.abstention_reason = f"Invalid evidence_ids: {', '.join(missing_ids)}"
            
            updated_insights.append(updated_insight)
        
        # Compute metrics
        n_final = len(final_insights)
        if n_final > 0:
            evidence_linking_rate = final_with_evidence / n_final
        else:
            evidence_linking_rate = 1.0  # No FINAL insights means perfect rate
        
        if total_final_evidence_refs > 0:
            missing_evidence_rate = invalid_refs / total_final_evidence_refs
            metadata_completeness_rate = (
                (total_final_evidence_refs - missing_metadata_refs)
                / float(total_final_evidence_refs)
            )
        else:
            missing_evidence_rate = 0.0
            metadata_completeness_rate = 1.0
        
        # Compute orphan evidence rate
        referenced_ids = set()
        for insight in self.insights:
            referenced_ids.update(insight.evidence_ids)
        
        n_orphans = sum(1 for item in self.evidence_items if item.evidence_id not in referenced_ids)
        n_total_evidence = len(self.evidence_items)
        
        if n_total_evidence > 0:
            orphan_evidence_rate = n_orphans / n_total_evidence
        else:
            orphan_evidence_rate = 0.0
        
        # Validation passed if linking rate is 1.0 and missing rate is 0.0
        # Note: metadata_completeness is tracked but not part of evidence-chain validation
        # (it belongs to critic/contract validation)
        validation_passed = (
            evidence_linking_rate == 1.0
            and missing_evidence_rate == 0.0
            and orphan_evidence_rate <= self.orphan_threshold
        )
        
        metrics = EvidenceChainMetrics(
            evidence_linking_rate=evidence_linking_rate,
            missing_evidence_rate=missing_evidence_rate,
            orphan_evidence_rate=orphan_evidence_rate,
            metadata_completeness_rate=metadata_completeness_rate,
            validation_passed=validation_passed,
        )
        
        return updated_insights, metrics


def enforce_evidence_chain(
    insights: List[Insight],
    evidence_items: List[EvidenceItem],
    tab_name: str = "ads",
    orphan_threshold: float = 0.20,
) -> tuple[List[Insight], EvidenceChainMetrics]:
    """
    Convenience function to enforce evidence chain requirements.
    
    Args:
        insights: List of Insight objects
        evidence_items: List of EvidenceItem objects
    
    Returns:
        Tuple of (updated_insights, metrics)
    """
    enforcer = EvidenceChainEnforcer(
        insights,
        evidence_items,
        tab_name=tab_name,
        orphan_threshold=orphan_threshold,
    )
    return enforcer.enforce()

