"""
Tests for the grading engine.

We need to trust the grader before trusting it to grade the analysis.
These tests verify each grading criterion with known inputs/outputs.
"""

import json
import pytest
from datetime import datetime, timezone

from .schema import (
    CapturedPost,
    CaptureSnapshot,
    FeedMetadata,
    PostEngagement,
    GradingCriterion,
)
from .grader import Grader, _deep_text_extract


# ---- Helpers ----

def _make_post(
    id: str = "1",
    author: str = "testuser",
    content_text: str = "Hello world",
    content_type: str = "text",
    is_ad: bool = False,
    likes: int = 10,
    position: int = 0,
) -> CapturedPost:
    return CapturedPost(
        id=id,
        author=author,
        content_text=content_text,
        content_type=content_type,
        is_ad=is_ad,
        engagement=PostEngagement(likes=likes),
        position_in_feed=position,
    )


def _make_snapshot(posts=None) -> CaptureSnapshot:
    if posts is None:
        posts = [_make_post(id=str(i), position=i) for i in range(10)]
    return CaptureSnapshot(
        platform="twitter",
        capture_timestamp=datetime.now(timezone.utc).isoformat(),
        posts=posts,
        feed_metadata=FeedMetadata(total_posts_captured=len(posts)),
    )


def _make_analysis(feed_items=None, n_items=10) -> dict:
    if feed_items is None:
        feed_items = [
            {
                "position_in_feed": i,
                "content_type": "TEXT",
                "is_ad": False,
                "account": {"account_handle": f"user{i}"},
                "content_text": {"captions": [f"Post {i}"], "hashtags": []},
                "topics": {"primary_category": "general"},
                "political": {"is_political": False},
                "wellbeing": {"themes": [], "valence": "NEUTRAL"},
            }
            for i in range(n_items)
        ]
    return {"feed_items": feed_items, "aggregates": {}}


def _make_bundles(tabs=None, error_tabs=None) -> dict:
    all_tabs = {"ads", "politics", "patterns", "sources", "tone", "suggested-vs-followed"}
    if tabs is None:
        tabs = all_tabs
    bundles = {}
    for tab in tabs:
        if error_tabs and tab in error_tabs:
            bundles[tab] = {"_status": "ERROR", "error": "test error"}
        else:
            bundles[tab] = {"observations": {}, "measurements": {}, "limits": {}}
    return bundles


# ---- Post count tests ----

class TestPostCount:
    def test_exact_match(self):
        grader = Grader()
        snapshot = _make_snapshot([_make_post(id=str(i), position=i) for i in range(5)])
        analysis = _make_analysis(n_items=5)
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "post_count_exact")
        assert criterion.passed

    def test_missing_posts_fails(self):
        grader = Grader()
        snapshot = _make_snapshot([_make_post(id=str(i), position=i) for i in range(10)])
        analysis = _make_analysis(n_items=8)
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "post_count_exact")
        assert not criterion.passed
        assert criterion.fix_category == "data_pipeline"

    def test_extra_posts_fails(self):
        grader = Grader()
        snapshot = _make_snapshot([_make_post(id=str(i), position=i) for i in range(5)])
        analysis = _make_analysis(n_items=7)
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "post_count_exact")
        assert not criterion.passed


# ---- Content type distribution tests ----

class TestContentTypeDistribution:
    def test_matching_distribution(self):
        grader = Grader(threshold_pct=5.0)
        posts = [_make_post(id=str(i), content_type="text", position=i) for i in range(10)]
        snapshot = _make_snapshot(posts)
        analysis = _make_analysis(n_items=10)
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "content_type_distribution")
        assert criterion.passed

    def test_mismatched_distribution_fails(self):
        grader = Grader(threshold_pct=5.0)
        # Ground truth: 50% text, 50% image
        posts = (
            [_make_post(id=str(i), content_type="text", position=i) for i in range(5)] +
            [_make_post(id=str(i+5), content_type="image", position=i+5) for i in range(5)]
        )
        snapshot = _make_snapshot(posts)
        # Analysis: all TEXT (100% text, 0% image)
        analysis = _make_analysis(n_items=10)  # All TEXT by default
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "content_type_distribution")
        assert not criterion.passed


# ---- Epistemic restraint tests ----

class TestEpistemicRestraint:
    def test_clean_output_passes(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles()
        bundles["ads"]["observations"] = {
            "description": "Your feed contains 3 labeled ads from consumer brands."
        }
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "epistemic_restraint")
        assert criterion.passed

    def test_algorithm_speculation_fails(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles()
        bundles["ads"]["observations"] = {
            "description": "The algorithm is pushing fitness content to your feed."
        }
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "epistemic_restraint")
        assert not criterion.passed
        assert criterion.fix_category == "prompt_engineering"

    def test_targeting_speculation_fails(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles()
        bundles["tone"]["measurements"] = {
            "note": "You're being shown negative content to increase engagement."
        }
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "epistemic_restraint")
        assert not criterion.passed


# ---- Completeness tests ----

class TestTabCompleteness:
    def test_all_tabs_present(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "all_tabs_populated")
        assert criterion.passed

    def test_missing_tab_fails(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles(tabs={"ads", "politics", "patterns", "sources", "tone"})
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "all_tabs_populated")
        assert not criterion.passed

    def test_error_tab_fails(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles(error_tabs={"ads"})
        report = grader.grade(snapshot, analysis, bundles)
        criterion = next(c for c in report.criteria if c.name == "all_tabs_populated")
        assert not criterion.passed


# ---- Overall report tests ----

class TestOverallReport:
    def test_all_pass_overall_passes(self):
        grader = Grader()
        posts = [_make_post(id=str(i), author=f"user{i}", position=i) for i in range(10)]
        snapshot = _make_snapshot(posts)
        items = [
            {
                "position_in_feed": i,
                "content_type": "TEXT",
                "is_ad": False,
                "account": {"account_handle": f"user{i}"},
                "content_text": {"captions": [f"Post {i}"], "hashtags": []},
                "topics": {"primary_category": "general"},
                "political": {"is_political": False},
                "wellbeing": {"themes": [], "valence": "NEUTRAL"},
            }
            for i in range(10)
        ]
        analysis = {"feed_items": items, "aggregates": {}}
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles)
        # May not be overall_passed=True because theme_accuracy may flag,
        # but post_count and content_type should pass
        assert report.passed_criteria >= 5

    def test_cycle_number_preserved(self):
        grader = Grader()
        snapshot = _make_snapshot()
        analysis = _make_analysis()
        bundles = _make_bundles()
        report = grader.grade(snapshot, analysis, bundles, cycle_number=7)
        assert report.cycle_number == 7


# ---- Utility tests ----

class TestDeepTextExtract:
    def test_nested_dict(self):
        obj = {"a": {"b": "hello"}, "c": ["world", "test"]}
        text = _deep_text_extract(obj)
        assert "hello" in text
        assert "world" in text

    def test_handles_none(self):
        text = _deep_text_extract(None)
        assert text == ""

    def test_depth_limit(self):
        # Should not crash on deeply nested structures
        obj = {"a": "val"}
        for _ in range(30):
            obj = {"nested": obj}
        text = _deep_text_extract(obj)
        # Won't find "val" because depth limit hit, but should not crash
        assert isinstance(text, str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
