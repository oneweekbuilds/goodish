"""
Phase 5D1: Test evidence chain enforcement.
"""

import pytest
import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from accuracy.schema import Insight, EvidenceItem, ClaimStatus
from accuracy.evidence_chain import EvidenceChainEnforcer, enforce_evidence_chain


class TestEvidenceChainEnforcement:
    """Test that evidence chain enforcement downgrades FINAL insights without evidence."""
    
    def test_final_insight_without_evidence_downgraded(self):
        """FINAL insight with no evidence_ids should be downgraded to PRELIMINARY."""
        # Create FINAL insight without evidence_ids
        insight = Insight(
            insight_id="test-insight-1",
            claim_type="aggregate_observation",
            claim_status="FINAL",
            evidence_ids=[]  # No evidence
        )
        
        evidence_items = []
        
        updated_insights, metrics = enforce_evidence_chain([insight], evidence_items)
        
        assert len(updated_insights) == 1
        assert updated_insights[0].claim_status == "PRELIMINARY"
        assert updated_insights[0].abstention_reason is not None
        assert "Missing evidence_ids" in updated_insights[0].abstention_reason
    
    def test_final_insight_with_invalid_evidence_downgraded(self):
        """FINAL insight with invalid evidence_ids should be downgraded."""
        insight = Insight(
            insight_id="test-insight-2",
            claim_type="aggregate_observation",
            claim_status="FINAL",
            evidence_ids=["ev-nonexistent-001"]  # Invalid evidence_id
        )
        
        evidence_items = []  # No evidence items
        
        updated_insights, metrics = enforce_evidence_chain([insight], evidence_items)
        
        assert len(updated_insights) == 1
        assert updated_insights[0].claim_status == "PRELIMINARY"
        assert "Invalid evidence_ids" in updated_insights[0].abstention_reason
    
    def test_final_insight_with_valid_evidence_remains_final(self):
        """FINAL insight with valid evidence_ids should remain FINAL."""
        evidence_item = EvidenceItem(
            evidence_id="ev-ads-platform-001",
            signal_type="platform_labeled_ad",
            source="platform_label"
        )
        
        insight = Insight(
            insight_id="test-insight-3",
            claim_type="aggregate_observation",
            claim_status="FINAL",
            evidence_ids=["ev-ads-platform-001"]
        )
        
        updated_insights, metrics = enforce_evidence_chain([insight], [evidence_item])
        
        assert len(updated_insights) == 1
        assert updated_insights[0].claim_status == "FINAL"
        assert updated_insights[0].evidence_ids == ["ev-ads-platform-001"]
    
    def test_evidence_linking_rate_after_enforcement(self):
        """After enforcement, evidence_linking_rate should be 1.0 (all FINAL have evidence or were downgraded)."""
        # Create FINAL insight without evidence (will be downgraded)
        insight1 = Insight(
            insight_id="test-1",
            claim_type="test",
            claim_status="FINAL",
            evidence_ids=[]
        )
        
        # Create FINAL insight with valid evidence
        evidence_item = EvidenceItem(
            evidence_id="ev-valid-001",
            source="test"
        )
        insight2 = Insight(
            insight_id="test-2",
            claim_type="test",
            claim_status="FINAL",
            evidence_ids=["ev-valid-001"]
        )
        
        updated_insights, metrics = enforce_evidence_chain(
            [insight1, insight2],
            [evidence_item]
        )
        
        # After enforcement, only insight2 should be FINAL (with evidence)
        # insight1 was downgraded, so linking rate = 1/1 = 1.0
        assert metrics.evidence_linking_rate == 1.0
        assert metrics.missing_evidence_rate == 0.0
    
    def test_missing_evidence_rate_zero_after_enforcement(self):
        """After enforcement, missing_evidence_rate should be 0.0 (invalid refs cause downgrade)."""
        insight = Insight(
            insight_id="test-1",
            claim_type="test",
            claim_status="FINAL",
            evidence_ids=["ev-invalid-001"]  # Invalid
        )
        
        evidence_items = []  # No evidence
        
        updated_insights, metrics = enforce_evidence_chain([insight], evidence_items)
        
        # Insight was downgraded, so no FINAL insights remain with invalid refs
        assert metrics.missing_evidence_rate == 0.0
        assert metrics.evidence_linking_rate == 1.0  # No FINAL insights = perfect rate


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

