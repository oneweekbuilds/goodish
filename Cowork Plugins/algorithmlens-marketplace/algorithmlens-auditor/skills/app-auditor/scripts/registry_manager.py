#!/usr/bin/env python3
"""
Issue Registry Manager for AlgorithmLens App Auditor.

Manages the issue registry, generates scorecards, validates status transitions,
and enforces the anti-hallucination contract.

Usage:
    python3 registry_manager.py --registry issue_registry.json --action scorecard
    python3 registry_manager.py --registry issue_registry.json --action validate
    python3 registry_manager.py --registry issue_registry.json --action transition --issue-id UI-001 --new-status FIX_ATTEMPTED --reason "Fixed padding" --evidence ""
    python3 registry_manager.py --registry issue_registry.json --action report --output report.md
"""

import argparse
import json
import os
import sys
from datetime import datetime
from collections import Counter


# Valid statuses and allowed transitions
VALID_STATUSES = {"OPEN", "FIX_ATTEMPTED", "CODE_VERIFIED", "VERIFIED", "FIX_FAILED", "REGRESSED", "DEFERRED"}

ALLOWED_TRANSITIONS = {
    "OPEN": {"FIX_ATTEMPTED", "DEFERRED"},
    "FIX_ATTEMPTED": {"CODE_VERIFIED", "VERIFIED", "FIX_FAILED", "FIX_ATTEMPTED"},
    "CODE_VERIFIED": {"VERIFIED", "FIX_FAILED"},  # Promoted or failed on visual check
    "FIX_FAILED": {"FIX_ATTEMPTED", "DEFERRED"},  # Must re-attempt, can't skip to VERIFIED
    "VERIFIED": {"REGRESSED"},  # Can only regress
    "REGRESSED": {"FIX_ATTEMPTED", "DEFERRED"},  # Treated like OPEN
    "DEFERRED": {"OPEN"},  # Can be un-deferred
}

# Transitions that REQUIRE frame evidence from a NEW recording
EVIDENCE_REQUIRED_TRANSITIONS = {
    ("FIX_ATTEMPTED", "VERIFIED"),
    ("CODE_VERIFIED", "VERIFIED"),
    ("FIX_ATTEMPTED", "FIX_FAILED"),
    ("CODE_VERIFIED", "FIX_FAILED"),
    ("VERIFIED", "REGRESSED"),
}

# Transitions that require CODE evidence (build pass, test pass, etc.)
CODE_EVIDENCE_REQUIRED_TRANSITIONS = {
    ("FIX_ATTEMPTED", "CODE_VERIFIED"),
}

VERIFICATION_TIERS = {"code_verifiable", "visual_required", "hybrid"}

CATEGORIES = {
    "UI": "UI/Visual",
    "ACC": "Accuracy",
    "FUNC": "Functionality",
    "PERF": "Performance",
    "LIVE": "Live Broadcast",
    "SUB": "Subscription",
}

SEVERITY_ORDER = ["critical", "high", "medium", "low"]


def load_registry(path: str) -> dict:
    """Load the issue registry from JSON."""
    if not os.path.isfile(path):
        return {"issues": [], "metadata": {"created_at": datetime.now().isoformat()}}
    with open(path) as f:
        return json.load(f)


def save_registry(registry: dict, path: str):
    """Save the issue registry to JSON."""
    registry["metadata"]["last_updated"] = datetime.now().isoformat()
    with open(path, "w") as f:
        json.dump(registry, f, indent=2)
    print(f"Registry saved to {path}")


def validate_transition(current_status: str, new_status: str, evidence: str = "") -> tuple[bool, str]:
    """
    Validate a status transition against the rules.
    Returns (is_valid, error_message).
    """
    if new_status not in VALID_STATUSES:
        return False, f"Invalid status: {new_status}. Valid: {VALID_STATUSES}"

    if current_status and current_status not in VALID_STATUSES:
        return False, f"Current status invalid: {current_status}"

    if current_status and new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        return False, (
            f"Transition {current_status} → {new_status} not allowed. "
            f"Allowed from {current_status}: {ALLOWED_TRANSITIONS[current_status]}"
        )

    # Check evidence requirement
    if (current_status, new_status) in EVIDENCE_REQUIRED_TRANSITIONS:
        if not evidence or evidence.strip() == "":
            return False, (
                f"Transition {current_status} → {new_status} REQUIRES frame evidence "
                f"from a new recording. This is a core anti-hallucination rule. "
                f"You cannot mark an issue as {new_status} without visual proof."
            )

    if (current_status, new_status) in CODE_EVIDENCE_REQUIRED_TRANSITIONS:
        if not evidence or evidence.strip() == "":
            return False, (
                f"Transition {current_status} → {new_status} REQUIRES code evidence "
                f"(build pass, test pass, code-path trace). Provide a description of "
                f"the automated check that confirmed this fix."
            )

    return True, ""


def generate_scorecard(registry: dict, recording_number: int = None) -> str:
    """Generate a text scorecard from the registry."""
    issues = registry.get("issues", [])

    if not issues:
        return "No issues in registry."

    # Count statuses
    status_counts = Counter(i["status"] for i in issues)
    total = len(issues)
    deferred = status_counts.get("DEFERRED", 0)
    active_total = total - deferred

    # Count by category and severity
    category_counts = {}
    for issue in issues:
        cat = issue.get("category", "UNKNOWN")
        sev = issue.get("severity", "unknown")
        status = issue.get("status", "UNKNOWN")
        if cat not in category_counts:
            category_counts[cat] = {"total": 0, "severities": Counter(), "statuses": Counter()}
        category_counts[cat]["total"] += 1
        category_counts[cat]["severities"][sev] += 1
        category_counts[cat]["statuses"][status] += 1

    # Build scorecard
    verified = status_counts.get("VERIFIED", 0)
    completion = (verified / active_total * 100) if active_total > 0 else 0

    # Status bar helper
    def bar(count, total, width=20):
        filled = int(count / total * width) if total > 0 else 0
        return "█" * filled + "░" * (width - filled)

    title = f"ALGORITHMLENS AUDIT SCORECARD"
    if recording_number:
        title += f" — Recording #{recording_number}"

    lines = [
        "═" * 58,
        f"  {title}",
        "═" * 58,
        f"  Total Issues:         {total:>4}",
    ]

    if deferred > 0:
        lines.append(f"  Active (non-deferred): {active_total:>4}")

    lines.append("  " + "─" * 54)

    # Status breakdown
    status_display = [
        ("OPEN", "🔴"),
        ("FIX_ATTEMPTED", "🟡"),
        ("CODE_VERIFIED", "🔵"),
        ("VERIFIED", "🟢"),
        ("FIX_FAILED", "❌"),
        ("REGRESSED", "🔄"),
        ("DEFERRED", "⏸️"),
    ]

    for status, emoji in status_display:
        count = status_counts.get(status, 0)
        if count > 0 or status in ("OPEN", "VERIFIED"):  # Always show these
            pct = count / total * 100 if total > 0 else 0
            lines.append(
                f"  {emoji} {status:<18} {count:>3}  {bar(count, total)} {pct:>5.1f}%"
            )

    lines.append("  " + "─" * 54)

    # Tier breakdown
    tier_counts = Counter(i.get("verification_tier", "unknown") for i in issues)
    if any(t in tier_counts for t in VERIFICATION_TIERS):
        lines.append("  By Verification Tier:")
        for tier, label in [
            ("code_verifiable", "Tier 1 (code-verifiable)"),
            ("visual_required", "Tier 2 (visual required)"),
            ("hybrid", "Tier 3 (hybrid)"),
        ]:
            cnt = tier_counts.get(tier, 0)
            if cnt > 0:
                tier_issues = [i for i in issues if i.get("verification_tier") == tier]
                cv = sum(1 for i in tier_issues if i["status"] == "CODE_VERIFIED")
                v = sum(1 for i in tier_issues if i["status"] == "VERIFIED")
                lines.append(f"    {label:<30} {cnt:>3}  [{v} verified, {cv} code-verified]")
        lines.append("  " + "─" * 54)

    lines.append("  By Category:")

    for cat_code in ["UI", "ACC", "FUNC", "PERF", "LIVE", "SUB"]:
        if cat_code in category_counts:
            cat = category_counts[cat_code]
            cat_name = CATEGORIES.get(cat_code, cat_code)
            sev_parts = []
            for sev in SEVERITY_ORDER:
                cnt = cat["severities"].get(sev, 0)
                if cnt > 0:
                    sev_parts.append(f"{cnt} {sev[:4]}")
            sev_str = ", ".join(sev_parts)

            verified_in_cat = cat["statuses"].get("VERIFIED", 0)
            lines.append(
                f"    {cat_name:<18} {cat['total']:>3}  ({sev_str})  "
                f"[{verified_in_cat}/{cat['total']} verified]"
            )

    lines.extend([
        "  " + "─" * 54,
        f"  Completion: {completion:.1f}% verified"
        + (f" ({deferred} deferred)" if deferred > 0 else ""),
    ])

    # Recording readiness
    t1_issues = [i for i in issues if i.get("verification_tier") == "code_verifiable"]
    t1_cv = sum(1 for i in t1_issues if i["status"] in ("CODE_VERIFIED", "VERIFIED"))
    t1_total_pending = sum(1 for i in t1_issues if i["status"] in ("OPEN", "FIX_ATTEMPTED"))
    visual_pending = sum(1 for i in issues
                         if i.get("status") in ("FIX_ATTEMPTED", "CODE_VERIFIED")
                         and i.get("verification_tier") != "code_verifiable")

    if t1_total_pending > 0:
        lines.append(f"  Recording readiness: NOT READY ({t1_total_pending} Tier 1 issues need code-verification first)")
    elif visual_pending > 0:
        lines.append(f"  Recording readiness: READY ({visual_pending} items need visual verification)")
    else:
        lines.append(f"  Recording readiness: NO RECORDING NEEDED")

    lines.append("═" * 58)

    return "\n".join(lines)


def generate_report(registry: dict, output_path: str):
    """Generate a full Markdown audit report."""
    issues = registry.get("issues", [])

    lines = [
        "# AlgorithmLens iOS App Audit Report",
        "",
        f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
        "",
        "## Summary",
        "",
        "```",
        generate_scorecard(registry),
        "```",
        "",
        "## Issues by Category",
        "",
    ]

    for cat_code in ["UI", "ACC", "FUNC", "PERF", "LIVE", "SUB"]:
        cat_name = CATEGORIES.get(cat_code, cat_code)
        cat_issues = [i for i in issues if i.get("category") == cat_code]
        if not cat_issues:
            continue

        lines.append(f"### {cat_name} ({len(cat_issues)} issues)")
        lines.append("")

        # Sort by severity
        cat_issues.sort(key=lambda x: SEVERITY_ORDER.index(x.get("severity", "low"))
                        if x.get("severity", "low") in SEVERITY_ORDER else 99)

        for issue in cat_issues:
            status_emoji = {
                "OPEN": "🔴",
                "FIX_ATTEMPTED": "🟡",
                "CODE_VERIFIED": "🔵",
                "VERIFIED": "🟢",
                "FIX_FAILED": "❌",
                "REGRESSED": "🔄",
                "DEFERRED": "⏸️",
            }.get(issue["status"], "❓")

            lines.append(
                f"#### {status_emoji} {issue['id']}: {issue['title']} "
                f"[{issue['severity'].upper()}]"
            )
            lines.append("")
            lines.append(f"**Status:** {issue['status']}")
            lines.append("")
            lines.append(f"**Description:** {issue['description']}")
            lines.append("")

            # Pass/fail criteria
            pf = issue.get("pass_fail_criteria", {})
            if pf:
                lines.append(f"**Pass/Fail Criteria:** {pf.get('description', 'N/A')}")
                lines.append(f"- Expected: {pf.get('expected_state', 'N/A')}")
                lines.append(f"- Current: {pf.get('current_state', 'N/A')}")
                lines.append("")

            # Fix attempts
            for attempt in issue.get("fix_attempts", []):
                lines.append(
                    f"**Fix Attempt #{attempt['attempt_number']}** "
                    f"({attempt.get('timestamp', 'N/A')})"
                )
                lines.append(f"- Files: {', '.join(attempt.get('files_changed', []))}")
                lines.append(f"- Change: {attempt.get('description', 'N/A')}")
                lines.append(f"- Confidence: {attempt.get('confidence', 'N/A')}")
                lines.append("")

            lines.append("---")
            lines.append("")

    with open(output_path, "w") as f:
        f.write("\n".join(lines))

    print(f"Report saved to {output_path}")


def do_transition(registry: dict, issue_id: str, new_status: str,
                  reason: str, evidence: str) -> bool:
    """Perform a status transition on an issue."""
    for issue in registry.get("issues", []):
        if issue["id"] == issue_id:
            current = issue["status"]
            is_valid, error = validate_transition(current, new_status, evidence)

            if not is_valid:
                print(f"BLOCKED: {error}", file=sys.stderr)
                return False

            # Record transition
            issue["status"] = new_status
            issue.setdefault("status_history", []).append({
                "from": current,
                "to": new_status,
                "timestamp": datetime.now().isoformat(),
                "reason": reason,
                "evidence": evidence,
            })

            if new_status == "VERIFIED":
                issue["verification_evidence"] = evidence

            print(f"✓ {issue_id}: {current} → {new_status}")
            return True

    print(f"ERROR: Issue {issue_id} not found", file=sys.stderr)
    return False


def validate_registry(registry: dict):
    """Check registry for integrity issues."""
    issues = registry.get("issues", [])
    errors = []
    warnings = []

    ids_seen = set()
    for issue in issues:
        # Check for duplicate IDs
        iid = issue.get("id", "MISSING")
        if iid in ids_seen:
            errors.append(f"Duplicate ID: {iid}")
        ids_seen.add(iid)

        # Check required fields
        for field in ["id", "category", "severity", "title", "description",
                      "status", "pass_fail_criteria", "discovery_evidence"]:
            if field not in issue:
                errors.append(f"{iid}: Missing required field '{field}'")

        # Check status validity
        if issue.get("status") not in VALID_STATUSES:
            errors.append(f"{iid}: Invalid status '{issue.get('status')}'")

        # Check for VERIFIED without evidence
        if issue.get("status") == "VERIFIED" and not issue.get("verification_evidence"):
            errors.append(
                f"{iid}: Status is VERIFIED but no verification_evidence. "
                f"This violates the anti-hallucination contract."
            )

        # Check pass/fail criteria completeness
        pf = issue.get("pass_fail_criteria", {})
        if pf and not pf.get("description"):
            warnings.append(f"{iid}: pass_fail_criteria has no description")

    if errors:
        print(f"\n{'='*50}")
        print(f"  VALIDATION ERRORS: {len(errors)}")
        print(f"{'='*50}")
        for e in errors:
            print(f"  ❌ {e}")

    if warnings:
        print(f"\n{'='*50}")
        print(f"  WARNINGS: {len(warnings)}")
        print(f"{'='*50}")
        for w in warnings:
            print(f"  ⚠️  {w}")

    if not errors and not warnings:
        print("✓ Registry is valid. No issues found.")

    return len(errors) == 0


def main():
    parser = argparse.ArgumentParser(description="AlgorithmLens Issue Registry Manager")
    parser.add_argument("--registry", "-r", required=True, help="Path to issue_registry.json")
    parser.add_argument("--action", "-a", required=True,
                        choices=["scorecard", "validate", "transition", "report"],
                        help="Action to perform")
    parser.add_argument("--issue-id", help="Issue ID (for transition)")
    parser.add_argument("--new-status", help="New status (for transition)")
    parser.add_argument("--reason", help="Reason for transition")
    parser.add_argument("--evidence", default="", help="Frame evidence (for transition)")
    parser.add_argument("--output", help="Output path (for report)")
    parser.add_argument("--recording", type=int, help="Recording number (for scorecard)")

    args = parser.parse_args()

    registry = load_registry(args.registry)

    if args.action == "scorecard":
        print(generate_scorecard(registry, args.recording))

    elif args.action == "validate":
        validate_registry(registry)

    elif args.action == "transition":
        if not all([args.issue_id, args.new_status, args.reason]):
            print("ERROR: transition requires --issue-id, --new-status, --reason",
                  file=sys.stderr)
            sys.exit(1)
        if do_transition(registry, args.issue_id, args.new_status,
                         args.reason, args.evidence):
            save_registry(registry, args.registry)
            print("\n" + generate_scorecard(registry, args.recording))

    elif args.action == "report":
        output = args.output or "audit-report.md"
        generate_report(registry, output)


if __name__ == "__main__":
    main()
