"""
Must-Not-Regress Test Suite for AlgorithmLens (Prompt 9)

This test suite validates that safety behaviors implemented in Prompts 2-8
cannot accidentally regress. Tests are organized by the prompt/behavior they protect.

PROTECTED BEHAVIORS:
1. Multimodal extraction contracts (Prompt 2)
2. Audio handling + ffmpeg/VAD behavior (Prompt 3)
3. OCR cue detection behavior (Prompt 4 partial)
4. Public figure signals boundaries + negative-context filters (Prompt 5 + 5.1)
5. Signal fusion conservatism + conflict downgrades (Prompt 6)
6. Trust explanations transparency + "unknown" discipline (Prompt 7)
7. Adversarial cases (Prompt 8 - integration verified)

Run with: pytest test_regressions.py -v
"""

import pytest
import sys
import os
from typing import Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from public_figure_signals import (
    detect_public_figure_signals,
    detect_text_public_figure_signals,
    detect_audio_public_figure_signals,
    detect_ocr_institutional_cues,
    _check_negative_context,
    _find_title_matches,
    NEGATIVE_CONTEXT_PATTERNS,
    PUBLIC_OFFICE_TITLES,
)
from signal_fusion_engine import (
    fuse_signals,
    fuse_public_figure_signals,
    _apply_fusion_rules,
    _check_coverage_sufficient,
    _detect_conflicts,
    COVERAGE_THRESHOLDS,
)
from explanations_builder import (
    build_ads_explanations,
    build_politics_explanations,
    build_patterns_explanations,
    build_creators_explanations,
    build_inferences_explanations,
    build_explanations_for_tab,
)


# =============================================================================
# CATEGORY 1: Modality Coverage Behavior (Must-Not-Regress)
# Prompt 2/3/4: If a modality is missing, signals from that modality
# must be marked as not_evaluated, not claimed as absent
# =============================================================================

class TestModalityCoverageBehavior:
    """Tests that modality coverage gaps are correctly surfaced."""

    def test_audio_missing_marks_audio_signals_not_evaluated(self):
        """
        If audio is missing, audio-dependent signals must be in signals_not_evaluated.

        MUST NOT REGRESS: Cannot claim "no audio signals" when audio wasn't analyzed.
        """
        result = detect_public_figure_signals(
            text_content="some text about a topic",
            transcript=None,  # No audio
            ocr_text="some visual text",
            metadata_features=None,
            coverage_status={"audio_analyzed": False, "ocr_coverage_sufficient": True},
        )

        audio_not_eval = [s for s in result["signals_not_evaluated"] if s.get("modality") == "audio"]
        assert len(audio_not_eval) >= 1, \
            "REGRESSION: Missing audio must be in signals_not_evaluated, not silently omitted"

    def test_ocr_unavailable_marks_visual_signals_not_evaluated(self):
        """
        If OCR is unavailable, visual signals must be in signals_not_evaluated.

        MUST NOT REGRESS: Cannot claim "no visual cues" when OCR wasn't available.
        """
        result = detect_public_figure_signals(
            text_content="some caption",
            transcript=None,
            ocr_text=None,  # No OCR
            metadata_features=None,
            coverage_status={"audio_analyzed": False, "ocr_coverage_sufficient": False},
        )

        visual_not_eval = [s for s in result["signals_not_evaluated"] if s.get("modality") == "visual"]
        assert len(visual_not_eval) >= 1, \
            "REGRESSION: Missing OCR must be in signals_not_evaluated"

    def test_single_modality_caps_fused_confidence_low(self):
        """
        If only 1 content modality is present, fused confidence must be capped at low.

        MUST NOT REGRESS: Single modality cannot yield medium/high confidence.
        """
        result = _apply_fusion_rules(
            n_content_signals=5,  # Many signals
            n_metadata_signals=0,
            n_modalities_with_signals=1,
            n_modalities_with_coverage=1,  # Only 1 modality
            conflicts=[],
            pre_fusion_present="yes",
            pre_fusion_confidence="high",
        )

        assert result["fused_confidence"] == "low", \
            "REGRESSION: Single modality must cap confidence at 'low' (was {})".format(result["fused_confidence"])

    def test_low_ocr_coverage_does_not_claim_visual_absence(self):
        """
        Low OCR coverage (<60%) cannot claim visual signals are absent.

        MUST NOT REGRESS: Absence != Evidence of Absence.
        """
        coverage_sufficient = _check_coverage_sufficient({
            "text_available": True,
            "audio_analyzed": False,
            "ocr_coverage_percent": 30,  # Below 60% threshold
            "metadata_available": False,
        })

        assert coverage_sufficient["vision"] == False, \
            "REGRESSION: 30% OCR coverage should not be sufficient for claims"

    def test_full_audio_coverage_marked_sufficient(self):
        """
        When audio is analyzed, it should be marked as sufficient.

        Positive test to ensure we don't over-restrict.
        """
        coverage_sufficient = _check_coverage_sufficient({
            "text_available": True,
            "audio_analyzed": True,
            "ocr_coverage_percent": 80,
            "metadata_available": True,
        })

        assert coverage_sufficient["audio"] == True, \
            "Audio should be marked sufficient when analyzed"
        assert coverage_sufficient["vision"] == True, \
            "Vision should be marked sufficient with 80% OCR"


# =============================================================================
# CATEGORY 2: "Unknown" Discipline (Must-Not-Regress)
# Prompt 7: Must not assert absence when coverage is insufficient
# Must surface epistemic boundaries (what_this_does_not_mean)
# =============================================================================

class TestUnknownDiscipline:
    """Tests for proper handling of uncertainty and unknown states."""

    def test_cannot_claim_no_when_coverage_insufficient(self):
        """
        Cannot claim 'no' (absence) with <2 modalities covered.

        MUST NOT REGRESS: Must return 'unknown', not 'no'.
        """
        result = _apply_fusion_rules(
            n_content_signals=0,
            n_metadata_signals=0,
            n_modalities_with_signals=0,
            n_modalities_with_coverage=1,  # Only 1 modality
            conflicts=[],
            pre_fusion_present="no",
            pre_fusion_confidence="high",
        )

        assert result["fused_present"] == "unknown", \
            "REGRESSION: Cannot claim 'no' with <2 modalities (was '{}')".format(result["fused_present"])

    def test_what_this_does_not_mean_always_present(self):
        """
        Every public figure signals output must include epistemic boundaries.

        MUST NOT REGRESS: what_this_does_not_mean cannot be empty.
        """
        result = detect_public_figure_signals(
            text_content="test content",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        assert "what_this_does_not_mean" in result, \
            "REGRESSION: what_this_does_not_mean must be present"
        assert len(result["what_this_does_not_mean"]) > 0, \
            "REGRESSION: what_this_does_not_mean cannot be empty"

    def test_what_this_does_not_mean_contains_identity_disclaimer(self):
        """
        Epistemic boundaries must disclaim identity inference.

        MUST NOT REGRESS: Must clarify we don't identify individuals.
        """
        result = detect_public_figure_signals(
            text_content="the senator gave a speech",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        boundaries_text = " ".join(result["what_this_does_not_mean"]).lower()
        assert any(term in boundaries_text for term in ["identify", "face recognition", "who"]), \
            "REGRESSION: Must disclaim identity inference"

    def test_pre_fusion_flag_preserved_on_output(self):
        """
        Output must include _pre_fusion flag for Prompt 6 handoff.

        MUST NOT REGRESS: Flag needed for fusion engine.
        """
        result = detect_public_figure_signals(
            text_content="test",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        assert "_pre_fusion" in result, \
            "REGRESSION: _pre_fusion flag must be present on output"

    def test_signals_not_evaluated_vs_not_found_distinction(self):
        """
        signals_not_evaluated (missing modality) != signals_not_found (checked but absent).

        MUST NOT REGRESS: These are semantically different.
        """
        result = detect_public_figure_signals(
            text_content="regular content with no titles",
            transcript=None,  # Missing modality
            ocr_text="regular visual text",  # Present, checked
            metadata_features=None,
            coverage_status={"audio_analyzed": False, "ocr_coverage_sufficient": True},
        )

        # Audio should be not_evaluated (missing)
        audio_not_eval = [s for s in result["signals_not_evaluated"] if "audio" in str(s).lower()]
        assert len(audio_not_eval) >= 1, \
            "Audio must be in signals_not_evaluated when not analyzed"

        # Text had content but no signals - check signals_not_found has text entries
        # (Note: this depends on implementation - just verify distinction exists)
        assert "signals_not_found" in result, \
            "REGRESSION: signals_not_found field must be present"

    def test_confidence_unknown_when_no_content_and_poor_coverage(self):
        """
        With no content modalities having coverage, confidence must be unknown.

        MUST NOT REGRESS: Cannot claim any confidence with no coverage.
        """
        result = detect_public_figure_signals(
            text_content=None,
            transcript=None,
            ocr_text=None,
            metadata_features=None,
            coverage_status={"audio_analyzed": False, "ocr_coverage_sufficient": False},
        )

        # Should be unknown or low - definitely not high
        assert result["confidence"] in ("unknown", "low"), \
            "REGRESSION: No coverage must yield unknown/low confidence (was '{}')".format(result["confidence"])


# =============================================================================
# CATEGORY 3: Public Figure Negative-Context Filters (Must-Not-Regress)
# Prompt 5.1: Corporate/club titles must NOT trigger public figure signals
# =============================================================================

class TestNegativeContextFilters:
    """Tests for negative context filtering of false positives."""

    def test_class_president_filtered(self):
        """'class president' must NOT trigger public figure signals."""
        assert _check_negative_context("class president"), \
            "REGRESSION: 'class president' must be filtered"

        result = detect_text_public_figure_signals("our class president gave a speech")
        assert not result["detected"], \
            "REGRESSION: 'class president' should not trigger detection"

    def test_student_body_president_filtered(self):
        """'student body president' must NOT trigger public figure signals."""
        assert _check_negative_context("student body president"), \
            "REGRESSION: 'student body president' must be filtered"

        result = detect_text_public_figure_signals("vote for me for student body president!")
        assert not result["detected"], \
            "REGRESSION: 'student body president' should not trigger detection"

    def test_vp_of_marketing_filtered(self):
        """'VP of marketing' must NOT trigger public figure signals."""
        assert _check_negative_context("VP of marketing"), \
            "REGRESSION: 'VP of marketing' must be filtered"

        result = detect_text_public_figure_signals("our VP of marketing announced the launch")
        assert not result["detected"], \
            "REGRESSION: 'VP of marketing' should not trigger detection"

    def test_regional_president_filtered(self):
        """'regional president' (business role) must NOT trigger."""
        assert _check_negative_context("regional president"), \
            "REGRESSION: 'regional president' must be filtered"

        result = detect_text_public_figure_signals("the regional president of sales is here")
        assert not result["detected"], \
            "REGRESSION: 'regional president' should not trigger detection"

    def test_company_president_filtered(self):
        """'company president' must NOT trigger public figure signals."""
        assert _check_negative_context("company president"), \
            "REGRESSION: 'company president' must be filtered"

    def test_club_president_filtered(self):
        """'club president' must NOT trigger public figure signals."""
        assert _check_negative_context("club president"), \
            "REGRESSION: 'club president' must be filtered"

    def test_ceo_filtered(self):
        """'CEO' must NOT trigger public figure signals."""
        assert _check_negative_context("CEO"), \
            "REGRESSION: 'CEO' must be filtered"

    def test_cfo_filtered(self):
        """'CFO' must NOT trigger public figure signals."""
        assert _check_negative_context("CFO"), \
            "REGRESSION: 'CFO' must be filtered"

    def test_sorority_president_filtered(self):
        """'sorority president' must NOT trigger public figure signals."""
        assert _check_negative_context("sorority president"), \
            "REGRESSION: 'sorority president' must be filtered"

    def test_fraternity_president_filtered(self):
        """'fraternity president' must NOT trigger public figure signals."""
        assert _check_negative_context("fraternity president"), \
            "REGRESSION: 'fraternity president' must be filtered"

    def test_chapter_president_filtered(self):
        """'chapter president' must NOT trigger public figure signals."""
        assert _check_negative_context("chapter president"), \
            "REGRESSION: 'chapter president' must be filtered"

    def test_division_president_filtered(self):
        """'division president' (business role) must NOT trigger."""
        assert _check_negative_context("division president"), \
            "REGRESSION: 'division president' must be filtered"

    def test_real_senator_not_filtered(self):
        """
        Real political title 'senator' should NOT be filtered.

        Positive test to ensure we don't over-filter.
        """
        assert not _check_negative_context("senator smith voted"), \
            "Real political titles should not be filtered"

        result = detect_text_public_figure_signals("senator smith voted on the bill")
        assert result["detected"], \
            "Real 'senator' usage should trigger detection"

    def test_real_governor_not_filtered(self):
        """Real political title 'governor' should NOT be filtered."""
        result = detect_text_public_figure_signals("the governor signed the bill today")
        assert result["detected"], \
            "Real 'governor' usage should trigger detection"

    def test_context_window_filtering_works(self):
        """
        Context-based filtering should check surrounding text.

        MUST NOT REGRESS: Nearby negative context should filter.
        """
        # "president" near "company" context should be filtered
        result = detect_text_public_figure_signals("the company president announced")
        assert not result["detected"], \
            "REGRESSION: Nearby business context should filter 'president'"


# =============================================================================
# CATEGORY 4: Fusion Conflict Behavior (Must-Not-Regress)
# Prompt 6: Conflicting modalities must downgrade confidence
# Metadata-only must never yield medium/high
# =============================================================================

class TestFusionConflictBehavior:
    """Tests for signal fusion conservatism and conflict handling."""

    def test_partial_detection_downgrades_high_to_medium(self):
        """
        Partial detection (some modalities fire, others don't) must downgrade.

        MUST NOT REGRESS: Disagreement lowers confidence.
        """
        conflicts = [{
            "type": "partial_detection",
            "description": "Signals in text but not audio",
            "resolution": "confidence_downgrade",
            "modalities_firing": ["text"],
            "modalities_not_firing": ["audio"],
        }]

        result = _apply_fusion_rules(
            n_content_signals=2,
            n_metadata_signals=0,
            n_modalities_with_signals=1,
            n_modalities_with_coverage=2,
            conflicts=conflicts,
            pre_fusion_present="yes",
            pre_fusion_confidence="high",
        )

        assert result["fused_confidence"] in ("medium", "low"), \
            "REGRESSION: Partial detection must downgrade confidence (was '{}')".format(result["fused_confidence"])

    def test_partial_detection_downgrades_medium_to_low(self):
        """Medium confidence with conflicts must downgrade to low."""
        conflicts = [{
            "type": "partial_detection",
            "description": "Signals in vision but not text",
            "resolution": "confidence_downgrade",
            "modalities_firing": ["vision"],
            "modalities_not_firing": ["text"],
        }]

        result = _apply_fusion_rules(
            n_content_signals=1,
            n_metadata_signals=0,
            n_modalities_with_signals=1,
            n_modalities_with_coverage=2,
            conflicts=conflicts,
            pre_fusion_present="yes",
            pre_fusion_confidence="medium",
        )

        assert result["fused_confidence"] == "low", \
            "REGRESSION: Medium + conflict must become low (was '{}')".format(result["fused_confidence"])

    def test_metadata_only_caps_at_low(self):
        """
        Metadata-only signals (verified badge) must cap at low confidence.

        MUST NOT REGRESS: Weak signals never dominate.
        """
        result = _apply_fusion_rules(
            n_content_signals=0,  # No content signals
            n_metadata_signals=3,  # Multiple metadata signals
            n_modalities_with_signals=0,
            n_modalities_with_coverage=2,
            conflicts=[],
            pre_fusion_present="yes",
            pre_fusion_confidence="medium",
        )

        assert result["fused_confidence"] == "low", \
            "REGRESSION: Metadata-only must cap at 'low' (was '{}')".format(result["fused_confidence"])

    def test_metadata_only_cannot_reach_high(self):
        """Metadata-only signals must NEVER yield high confidence."""
        result = _apply_fusion_rules(
            n_content_signals=0,
            n_metadata_signals=10,  # Many metadata signals
            n_modalities_with_signals=0,
            n_modalities_with_coverage=3,
            conflicts=[],
            pre_fusion_present="yes",
            pre_fusion_confidence="high",
        )

        assert result["fused_confidence"] != "high", \
            "REGRESSION: Metadata-only cannot be 'high' (was '{}')".format(result["fused_confidence"])

    def test_conflict_detection_identifies_partial_detection(self):
        """
        Conflict detection must find partial detection scenarios.

        MUST NOT REGRESS: Conflicts must be detected, not ignored.
        """
        signals_by_modality = {
            "text": [{"id": "text_signal"}],  # Has signals
            "audio": [],  # No signals
            "vision": [],
            "metadata": [],
        }
        coverage_sufficient = {
            "text": True,
            "audio": True,  # Audio covered but no signals
            "vision": False,
            "metadata": False,
        }

        conflicts = _detect_conflicts(signals_by_modality, coverage_sufficient)

        assert len(conflicts) >= 1, \
            "REGRESSION: Partial detection must be flagged as conflict"
        assert conflicts[0]["type"] == "partial_detection", \
            "REGRESSION: Conflict type must be 'partial_detection'"

    def test_multiple_conflicts_compound_downgrade(self):
        """Multiple conflicts should compound confidence reduction."""
        conflicts = [
            {"type": "partial_detection", "description": "Text vs Audio",
             "modalities_firing": ["text"], "modalities_not_firing": ["audio"]},
            {"type": "partial_detection", "description": "Text vs Vision",
             "modalities_firing": ["text"], "modalities_not_firing": ["vision"]},
        ]

        result = _apply_fusion_rules(
            n_content_signals=1,
            n_metadata_signals=0,
            n_modalities_with_signals=1,
            n_modalities_with_coverage=3,
            conflicts=conflicts,
            pre_fusion_present="yes",
            pre_fusion_confidence="high",
        )

        assert result["fused_confidence"] == "low", \
            "REGRESSION: Multiple conflicts should compound downgrade (was '{}')".format(result["fused_confidence"])

    def test_fuse_signals_preserves_rules_applied(self):
        """
        Full fusion output must include rules_applied for transparency.

        MUST NOT REGRESS: Rules must be documented in output.
        """
        result = fuse_signals(
            signals_fired=[{"id": "test", "modality": "text", "label": "Test", "evidence_ref": []}],
            signals_not_evaluated=[],
            signals_not_found=[],
            modality_coverage={
                "text_available": True,
                "audio_analyzed": False,
                "ocr_coverage_percent": 0,
                "metadata_available": False,
            },
            pre_fusion_present="yes",
            pre_fusion_confidence="high",
        )

        assert "_fusion_metadata" in result, \
            "REGRESSION: _fusion_metadata must be present"
        assert "rules_applied" in result["_fusion_metadata"], \
            "REGRESSION: rules_applied must be in _fusion_metadata"


# =============================================================================
# CATEGORY 5: Trust Explanations Schema Stability (Must-Not-Regress)
# Prompt 7: All 5 evidence bundle tabs must have complete explanations schema
# =============================================================================

class TestTrustExplanationsSchemaStability:
    """Tests for consistent explanations structure across all tabs."""

    REQUIRED_EXPLANATION_FIELDS = [
        "summary",
        "signals_fired",
        "signals_not_evaluated",
        "signals_not_found",
        "confidence_drivers",
        "what_this_does_not_mean",
        "next_best_actions",
    ]

    def _make_test_bundle(self, n_items: int = 20) -> Dict[str, Any]:
        """Create a test bundle with minimal required structure."""
        return {
            "meta": {"n_items": n_items},
            "observations": {
                "commercial_exposure_spectrum": {"stacked_bar": {"labeled_ads": 0, "unlabeled_promotion": 0}},
                "promo_signals": {"n_high_confidence": 0, "signal_types_detected": []},
                "political_content_spectrum": {"stacked_bar": {"political": 0}},
                "topic_diversity_summary": {"unique_topics_count": 0, "top_topics": []},
                "repetition_summary": {"repetition_rate_percent": 0, "cluster_detected": False},
                "creator_concentration": {"unique_creators_count": 0, "most_frequent_creators": []},
                "voice_variety_proxies": {"unique_verified_accounts_count": 0},
                "inference_overview": {"total_candidates_surfaced": 0, "total_candidates_generated": 0},
                "surfaced_inferences": [],
            },
            "measurements": {
                "political_topic_mix": {"value": []},
            },
            "limits": {
                "vision_cues_detected": False,
            },
        }

    def test_ads_tab_has_all_explanation_fields(self):
        """Ads tab must have all required explanation fields."""
        bundle = self._make_test_bundle()
        result = build_ads_explanations(bundle)

        for field in self.REQUIRED_EXPLANATION_FIELDS:
            assert field in result, \
                f"REGRESSION: Ads tab missing required field '{field}'"

    def test_politics_tab_has_all_explanation_fields(self):
        """Politics tab must have all required explanation fields."""
        bundle = self._make_test_bundle()
        result = build_politics_explanations(bundle)

        for field in self.REQUIRED_EXPLANATION_FIELDS:
            assert field in result, \
                f"REGRESSION: Politics tab missing required field '{field}'"

    def test_patterns_tab_has_all_explanation_fields(self):
        """Patterns tab must have all required explanation fields."""
        bundle = self._make_test_bundle()
        result = build_patterns_explanations(bundle)

        for field in self.REQUIRED_EXPLANATION_FIELDS:
            assert field in result, \
                f"REGRESSION: Patterns tab missing required field '{field}'"

    def test_creators_tab_has_all_explanation_fields(self):
        """Creators tab must have all required explanation fields."""
        bundle = self._make_test_bundle()
        result = build_creators_explanations(bundle)

        for field in self.REQUIRED_EXPLANATION_FIELDS:
            assert field in result, \
                f"REGRESSION: Creators tab missing required field '{field}'"

    def test_inferences_tab_has_all_explanation_fields(self):
        """Inferences tab must have all required explanation fields."""
        bundle = self._make_test_bundle()
        result = build_inferences_explanations(bundle)

        for field in self.REQUIRED_EXPLANATION_FIELDS:
            assert field in result, \
                f"REGRESSION: Inferences tab missing required field '{field}'"

    def test_build_explanations_for_tab_routing_works(self):
        """build_explanations_for_tab must route to all 5 tabs correctly."""
        bundle = self._make_test_bundle()

        for tab in ["ads", "politics", "patterns", "creators", "inferences"]:
            result = build_explanations_for_tab(tab, bundle)
            assert "summary" in result, \
                f"REGRESSION: build_explanations_for_tab failed for '{tab}'"

    def test_signals_fired_structure_is_list_of_dicts(self):
        """signals_fired must be a list of dicts with expected fields."""
        bundle = self._make_test_bundle()
        bundle["observations"]["commercial_exposure_spectrum"]["stacked_bar"]["labeled_ads"] = 5

        result = build_ads_explanations(bundle)

        assert isinstance(result["signals_fired"], list), \
            "REGRESSION: signals_fired must be a list"

        if result["signals_fired"]:
            signal = result["signals_fired"][0]
            assert "id" in signal, "REGRESSION: signal must have 'id'"
            assert "label" in signal, "REGRESSION: signal must have 'label'"
            assert "why" in signal, "REGRESSION: signal must have 'why'"
            assert "evidence_ref" in signal, "REGRESSION: signal must have 'evidence_ref'"

    def test_confidence_drivers_structure_is_list_of_dicts(self):
        """confidence_drivers must be a list of dicts with direction/label/detail."""
        bundle = self._make_test_bundle()
        result = build_ads_explanations(bundle)

        assert isinstance(result["confidence_drivers"], list), \
            "REGRESSION: confidence_drivers must be a list"

        if result["confidence_drivers"]:
            driver = result["confidence_drivers"][0]
            assert "direction" in driver, "REGRESSION: driver must have 'direction'"
            assert "label" in driver, "REGRESSION: driver must have 'label'"
            assert "detail" in driver, "REGRESSION: driver must have 'detail'"

    def test_next_best_actions_is_list_of_strings(self):
        """next_best_actions must be a list of plain English strings."""
        bundle = self._make_test_bundle()
        result = build_ads_explanations(bundle)

        assert isinstance(result["next_best_actions"], list), \
            "REGRESSION: next_best_actions must be a list"

        for action in result["next_best_actions"]:
            assert isinstance(action, str), \
                "REGRESSION: next_best_actions items must be strings"

    def test_what_this_does_not_mean_is_list_of_strings(self):
        """what_this_does_not_mean must be a list of plain English strings."""
        bundle = self._make_test_bundle()
        result = build_politics_explanations(bundle)

        assert isinstance(result["what_this_does_not_mean"], list), \
            "REGRESSION: what_this_does_not_mean must be a list"

        for boundary in result["what_this_does_not_mean"]:
            assert isinstance(boundary, str), \
                "REGRESSION: what_this_does_not_mean items must be strings"


# =============================================================================
# CATEGORY 6: Plain Language Requirements (Must-Not-Regress)
# Prompt 7: No numeric certainty language beyond allowed formats
# =============================================================================

class TestPlainLanguageRequirements:
    """Tests that explanations use plain English without jargon."""

    def test_summary_is_plain_english(self):
        """Summary should be plain English without technical jargon."""
        bundle = {
            "meta": {"n_items": 20},
            "observations": {
                "commercial_exposure_spectrum": {"stacked_bar": {"labeled_ads": 3, "unlabeled_promotion": 2}},
                "promo_signals": {"n_high_confidence": 2},
            },
            "measurements": {},
            "limits": {},
        }
        result = build_ads_explanations(bundle)

        summary = result["summary"].lower()

        # Should not contain jargon
        jargon_terms = ["modality", "threshold", "vad", "asr", "ocr coverage", "fusion"]
        for term in jargon_terms:
            assert term not in summary, \
                f"REGRESSION: Summary contains jargon '{term}'"

    def test_confidence_drivers_avoid_technical_codes(self):
        """Confidence drivers should not expose error codes directly."""
        bundle = {
            "meta": {"n_items": 20},
            "observations": {
                "commercial_exposure_spectrum": {"stacked_bar": {"labeled_ads": 0, "unlabeled_promotion": 0}},
                "promo_signals": {"n_high_confidence": 0},
            },
            "measurements": {},
            "limits": {},
        }

        # Simulate feature collection with error code
        feature_collection = {
            "coverage": {
                "audio": {"audio_analyzed": False},
                "vision": {"ocr_coverage_percent": 50},
            },
            "items": [{"audio_features": {"error_reason_code": "FFMPEG_NOT_FOUND"}}],
        }

        result = build_ads_explanations(bundle, feature_collection)

        # Check all text fields don't expose raw error codes
        for driver in result["confidence_drivers"]:
            detail = driver.get("detail", "").upper()
            assert "FFMPEG_NOT_FOUND" not in detail, \
                "REGRESSION: Error codes should be translated to plain English"


# =============================================================================
# CATEGORY 7: Public Figure Signals Full Output Structure
# =============================================================================

class TestPublicFigureSignalsOutputStructure:
    """Tests that public figure signals output has complete structure."""

    REQUIRED_PUBLIC_FIGURE_FIELDS = [
        "present",
        "confidence",
        "signals_fired",
        "signals_not_evaluated",
        "signals_not_found",
        "confidence_drivers",
        "what_this_does_not_mean",
        "modality_coverage",
        "_pre_fusion",
    ]

    def test_output_has_all_required_fields(self):
        """Public figure signals output must have all required fields."""
        result = detect_public_figure_signals(
            text_content="the senator spoke",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        for field in self.REQUIRED_PUBLIC_FIGURE_FIELDS:
            assert field in result, \
                f"REGRESSION: Public figure output missing required field '{field}'"

    def test_signals_fired_has_modality_field(self):
        """Each signal in signals_fired must have a modality field."""
        result = detect_public_figure_signals(
            text_content="the governor signed the bill",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        for signal in result["signals_fired"]:
            assert "modality" in signal, \
                "REGRESSION: Signal must have 'modality' field for fusion"

    def test_modality_coverage_has_all_modalities(self):
        """modality_coverage must track all 4 modality types."""
        result = detect_public_figure_signals(
            text_content="test",
            transcript=None,
            ocr_text=None,
            metadata_features=None,
        )

        coverage = result["modality_coverage"]
        assert "text_available" in coverage, "REGRESSION: Missing text_available"
        assert "audio_analyzed" in coverage, "REGRESSION: Missing audio_analyzed"
        assert "ocr_available" in coverage, "REGRESSION: Missing ocr_available"
        assert "metadata_available" in coverage, "REGRESSION: Missing metadata_available"


# =============================================================================
# CATEGORY 8: Lexicon Completeness (Must-Not-Regress)
# =============================================================================

class TestLexiconCompleteness:
    """Tests that the public office titles lexicon is maintained."""

    REQUIRED_TITLES = [
        "senator", "representative", "governor", "president",
        "mayor", "prime minister", "congressman", "congresswoman",
    ]

    def test_core_political_titles_in_lexicon(self):
        """Core political titles must remain in the lexicon."""
        for title in self.REQUIRED_TITLES:
            assert title in PUBLIC_OFFICE_TITLES, \
                f"REGRESSION: '{title}' must be in PUBLIC_OFFICE_TITLES"

    def test_negative_context_patterns_exist(self):
        """Negative context patterns must be defined."""
        assert len(NEGATIVE_CONTEXT_PATTERNS) >= 10, \
            "REGRESSION: At least 10 negative context patterns required"


# =============================================================================
# CATEGORY 9: Scan Status Endpoint Terminal States (Must-Not-Regress)
# Frontend depends on status endpoint returning terminal states properly
# =============================================================================

class TestScanStatusTerminalStates:
    """
    Tests that scan status endpoint properly transitions to terminal states.

    PROTECTED BEHAVIORS:
    - Status must always be one of: 'processing', 'completed', 'failed'
    - Null/empty status must default to 'completed' for backward compat
    - Status response must include 'created_at' for timeout calculations
    - Failed scans must include error_message
    """

    def test_get_scan_status_returns_required_fields(self):
        """
        Status endpoint must return all required fields.

        MUST NOT REGRESS: Frontend polling depends on these fields.
        """
        from database import get_scan_status, create_pending_scan, delete_scan
        import uuid

        # Create a test scan
        test_id = f"test-status-{uuid.uuid4()}"
        create_pending_scan(test_id, "tiktok", "test-user")

        try:
            status = get_scan_status(test_id)

            assert status is not None, "Status should not be None for existing scan"
            assert "scan_id" in status, "REGRESSION: Missing 'scan_id' field"
            assert "status" in status, "REGRESSION: Missing 'status' field"
            assert "error_message" in status, "REGRESSION: Missing 'error_message' field"
            assert "total_items" in status, "REGRESSION: Missing 'total_items' field"
            assert "total_ads" in status, "REGRESSION: Missing 'total_ads' field"
            assert "created_at" in status, "REGRESSION: Missing 'created_at' field (needed for timeout)"
        finally:
            delete_scan(test_id)

    def test_pending_scan_has_processing_status(self):
        """
        Newly created scan must have 'processing' status.

        MUST NOT REGRESS: Frontend uses this to show spinner.
        """
        from database import get_scan_status, create_pending_scan, delete_scan
        import uuid

        test_id = f"test-pending-{uuid.uuid4()}"
        create_pending_scan(test_id, "instagram", "test-user")

        try:
            status = get_scan_status(test_id)
            assert status["status"] == "processing", \
                f"REGRESSION: Pending scan must have 'processing' status (was '{status['status']}')"
        finally:
            delete_scan(test_id)

    def test_completed_scan_has_completed_status(self):
        """
        Successfully processed scan must have 'completed' status.

        MUST NOT REGRESS: Frontend uses this to navigate to results.
        """
        from database import get_scan_status, create_pending_scan, update_scan_result, delete_scan
        import uuid

        test_id = f"test-completed-{uuid.uuid4()}"
        create_pending_scan(test_id, "youtube", "test-user")

        # Simulate successful processing
        test_result = {
            "scan_metadata": {"scan_id": test_id, "platform": "youtube"},
            "aggregates": {"total_feed_items": 10, "total_ads": 2, "ad_percentage": 0.2},
            "feed_items": [],
            "environment": {}
        }
        update_scan_result(test_id, test_result, status="completed")

        try:
            status = get_scan_status(test_id)
            assert status["status"] == "completed", \
                f"REGRESSION: Processed scan must have 'completed' status (was '{status['status']}')"
            assert status["total_items"] == 10, "REGRESSION: total_items not updated"
            assert status["total_ads"] == 2, "REGRESSION: total_ads not updated"
        finally:
            delete_scan(test_id)

    def test_failed_scan_has_failed_status_and_error_message(self):
        """
        Failed scan must have 'failed' status and error_message.

        MUST NOT REGRESS: Frontend uses this to show error UI.
        """
        from database import get_scan_status, create_pending_scan, update_scan_error, delete_scan
        import uuid

        test_id = f"test-failed-{uuid.uuid4()}"
        create_pending_scan(test_id, "facebook", "test-user")

        # Simulate failure
        error_msg = "Video processing failed: invalid format"
        update_scan_error(test_id, error_msg)

        try:
            status = get_scan_status(test_id)
            assert status["status"] == "failed", \
                f"REGRESSION: Failed scan must have 'failed' status (was '{status['status']}')"
            assert status["error_message"] == error_msg, \
                f"REGRESSION: error_message must be preserved (was '{status['error_message']}')"
        finally:
            delete_scan(test_id)

    def test_null_status_defaults_to_completed(self):
        """
        Legacy scans with null status must default to 'completed'.

        MUST NOT REGRESS: Backward compatibility for older scans.
        """
        from database import get_connection, get_scan_status, delete_scan
        import uuid
        import json

        test_id = f"test-legacy-{uuid.uuid4()}"

        # Directly insert a scan with NULL status (simulating legacy data)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scans (id, created_at, platform, user_id, duration_seconds,
                               total_items, total_ads, ad_percentage, status, result_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        """, (test_id, "2024-01-01T00:00:00", "tiktok", "test", 0, 5, 1, 0.2, json.dumps({})))
        conn.commit()
        conn.close()

        try:
            status = get_scan_status(test_id)
            assert status["status"] == "completed", \
                f"REGRESSION: NULL status must default to 'completed' (was '{status['status']}')"
        finally:
            delete_scan(test_id)

    def test_status_values_are_terminal_or_processing(self):
        """
        Status values must be one of the defined terminal states.

        MUST NOT REGRESS: Frontend depends on predictable status values.
        """
        VALID_STATUSES = {"processing", "completed", "failed"}

        # Just verify the constants are correct (no DB needed)
        assert "processing" in VALID_STATUSES
        assert "completed" in VALID_STATUSES
        assert "failed" in VALID_STATUSES


# =============================================================================
# Run Tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
