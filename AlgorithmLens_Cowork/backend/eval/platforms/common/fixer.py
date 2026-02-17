"""
Fix orchestration engine.

For each failing criterion in a grading report, this module identifies
the responsible code or prompt and either:
- Auto-fixes prompt engineering issues (text changes)
- Suggests fixes for code issues (logged for human review)

V1 Strategy:
- Auto-fix: prompt_engineering issues only
- Suggest-only: parsing_bug, analysis_logic, data_pipeline issues
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .schema import FixRecord, GradingReport, GradingCriterion

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Fixer:
    """
    Orchestrates fixes based on grading report failures.

    Args:
        auto_fix_prompts: Whether to automatically fix prompt engineering issues
        dry_run: If True, log what would be changed but don't modify files
    """

    def __init__(self, auto_fix_prompts: bool = True, dry_run: bool = False):
        self.auto_fix_prompts = auto_fix_prompts
        self.dry_run = dry_run
        self.fixes_applied: List[FixRecord] = []

    def fix_failures(
        self, report: GradingReport, cycle_number: int
    ) -> List[FixRecord]:
        """
        Attempt to fix all failing criteria from a grading report.

        Returns list of FixRecords (applied or suggested).
        """
        fixes = []

        for criterion in report.criteria:
            if criterion.passed:
                continue

            fix = self._fix_criterion(criterion, cycle_number)
            if fix:
                fixes.append(fix)
                self.fixes_applied.append(fix)

        return fixes

    def _fix_criterion(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> Optional[FixRecord]:
        """Attempt to fix a single failing criterion."""
        category = criterion.fix_category or "unknown"

        if category == "prompt_engineering":
            return self._fix_prompt_issue(criterion, cycle_number)
        elif category == "data_pipeline":
            return self._suggest_pipeline_fix(criterion, cycle_number)
        elif category == "analysis_logic":
            return self._suggest_analysis_fix(criterion, cycle_number)
        elif category == "parsing_bug":
            return self._suggest_parsing_fix(criterion, cycle_number)
        else:
            return FixRecord(
                cycle_number=cycle_number,
                criterion_name=criterion.name,
                fix_category=category,
                description=f"Unknown fix category '{category}': {criterion.error_description}",
                auto_fixed=False,
            )

    def _fix_prompt_issue(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> FixRecord:
        """
        Auto-fix prompt engineering issues.

        Currently handles:
        - Epistemic restraint violations: adds stronger guardrails to Gemini prompt
        """
        if criterion.name == "epistemic_restraint":
            return self._fix_epistemic_restraint(criterion, cycle_number)

        # Generic prompt fix suggestion
        return FixRecord(
            cycle_number=cycle_number,
            criterion_name=criterion.name,
            fix_category="prompt_engineering",
            description=f"Prompt issue detected: {criterion.error_description}. "
                       f"Review Gemini prompts in gemini_analyzer.py.",
            file_changed="backend/gemini_analyzer.py",
            auto_fixed=False,
        )

    def _fix_epistemic_restraint(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> FixRecord:
        """
        Fix epistemic restraint violations by strengthening the Gemini prompt.

        This is one of the few auto-fixable categories because it's always
        a prompt wording issue.
        """
        gemini_path = BACKEND_ROOT / "gemini_analyzer.py"

        if not gemini_path.exists():
            return FixRecord(
                cycle_number=cycle_number,
                criterion_name=criterion.name,
                fix_category="prompt_engineering",
                description="Cannot find gemini_analyzer.py to fix epistemic restraint",
                auto_fixed=False,
            )

        if self.dry_run or not self.auto_fix_prompts:
            return FixRecord(
                cycle_number=cycle_number,
                criterion_name=criterion.name,
                fix_category="prompt_engineering",
                description=f"Epistemic restraint violation detected. "
                           f"Recommend adding stronger guardrails to ANALYSIS_PROMPT in gemini_analyzer.py. "
                           f"Details: {criterion.error_description}",
                file_changed="backend/gemini_analyzer.py",
                auto_fixed=False,
            )

        # Read current prompt
        content = gemini_path.read_text(encoding="utf-8")

        # Check if our epistemic guardrail is already present
        guardrail = "CRITICAL: Never speculate about algorithmic intent"
        if guardrail in content:
            return FixRecord(
                cycle_number=cycle_number,
                criterion_name=criterion.name,
                fix_category="prompt_engineering",
                description="Epistemic guardrail already present in prompt. "
                           "Violation may be in evidence bundle builders instead. "
                           f"Details: {criterion.error_description}",
                file_changed="backend/gemini_analyzer.py",
                auto_fixed=False,
            )

        # Add epistemic guardrail to the prompt
        epistemic_addition = (
            "\n\nCRITICAL: Never speculate about algorithmic intent. "
            "Do NOT say things like 'the algorithm is showing you this because...' or "
            "'this was promoted/boosted/pushed by the algorithm'. "
            "Describe what IS in the content, never WHY it appears in the feed. "
            "Your job is classification of observable content only.\n"
        )

        # Insert before the "Rules:" section
        if "Rules:" in content:
            content = content.replace(
                "Rules:",
                epistemic_addition + "Rules:",
                1,
            )
            gemini_path.write_text(content, encoding="utf-8")

            return FixRecord(
                cycle_number=cycle_number,
                criterion_name=criterion.name,
                fix_category="prompt_engineering",
                description="Added epistemic restraint guardrail to ANALYSIS_PROMPT",
                file_changed="backend/gemini_analyzer.py",
                change_summary="Inserted 'CRITICAL: Never speculate about algorithmic intent' block before Rules section",
                auto_fixed=True,
            )

        return FixRecord(
            cycle_number=cycle_number,
            criterion_name=criterion.name,
            fix_category="prompt_engineering",
            description="Could not locate 'Rules:' section in prompt to insert guardrail. Manual fix needed.",
            file_changed="backend/gemini_analyzer.py",
            auto_fixed=False,
        )

    def _suggest_pipeline_fix(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> FixRecord:
        """Suggest a fix for data pipeline issues."""
        suggestions = {
            "post_count_exact": "Check normalize.py — posts may be dropped during conversion to UnifiedScanResult",
            "content_type_distribution": "Check normalize.py _map_content_type() — content types may not be mapping correctly",
            "engagement_ranges": "Engagement data not preserved in UnifiedScanResult — consider adding engagement fields",
            "source_diversity": "Author handles may not be normalizing correctly in normalize.py",
            "no_missing_posts": "Posts are being lost between capture and analysis — check normalize.py iteration",
            "no_phantom_posts": "Extra posts appearing in analysis — check for duplicate feed item generation",
            "all_tabs_populated": "One or more evidence bundle builders are failing — check import paths and data format",
        }

        suggestion = suggestions.get(
            criterion.name,
            f"Data pipeline issue: {criterion.error_description}"
        )

        return FixRecord(
            cycle_number=cycle_number,
            criterion_name=criterion.name,
            fix_category="data_pipeline",
            description=suggestion,
            auto_fixed=False,
        )

    def _suggest_analysis_fix(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> FixRecord:
        """Suggest a fix for analysis logic issues."""
        return FixRecord(
            cycle_number=cycle_number,
            criterion_name=criterion.name,
            fix_category="analysis_logic",
            description=f"Analysis logic issue in {criterion.name}: {criterion.error_description}. "
                       f"Review the relevant evidence bundle builder.",
            auto_fixed=False,
        )

    def _suggest_parsing_fix(
        self, criterion: GradingCriterion, cycle_number: int
    ) -> FixRecord:
        """Suggest a fix for parsing bugs."""
        return FixRecord(
            cycle_number=cycle_number,
            criterion_name=criterion.name,
            fix_category="parsing_bug",
            description=f"Parsing issue: {criterion.error_description}. "
                       f"Check Twitter selectors in platforms/twitter/selectors.py.",
            file_changed="backend/eval/platforms/twitter/selectors.py",
            auto_fixed=False,
        )
