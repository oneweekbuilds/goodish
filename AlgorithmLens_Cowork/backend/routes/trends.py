"""User trends and analytics endpoints."""
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Depends
from database import get_scans_by_user, is_user_plus
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["trends"])

TREND_THRESHOLD_PERCENTAGE_POINTS = 2


def _get_iso_week(date_str: str) -> str:
    """
    Convert an ISO datetime string to ISO week format (e.g., "2026-W07").

    Args:
        date_str: ISO format datetime string (e.g., "2026-02-14T10:30:00")

    Returns:
        ISO week string in format "YYYY-Www"
    """
    try:
        dt = datetime.fromisoformat(date_str)
        iso_calendar = dt.isocalendar()
        return f"{iso_calendar[0]}-W{iso_calendar[1]:02d}"
    except (ValueError, AttributeError):
        logger.warning(f"Failed to parse date: {date_str}")
        return None


def _calculate_weekly_trends(scans: List[Dict[str, Any]]) -> tuple:
    """
    Calculate week-over-week trends from a list of scans.

    Args:
        scans: List of scan records with created_at, ad_percentage, total_items, total_ads

    Returns:
        Tuple of (weekly_trends, first_scan_date, last_scan_date)
    """
    weekly_data = defaultdict(lambda: {
        "scans": 0,
        "ad_percentages": [],
        "total_items": [],
        "total_ads": []
    })

    dates = []

    for scan in scans:
        created_at = scan.get("created_at")
        if not created_at:
            continue

        week = _get_iso_week(created_at)
        if not week:
            continue

        dates.append(created_at)
        weekly_data[week]["scans"] += 1

        # Collect ad percentage (may be None/null)
        ad_pct = scan.get("ad_percentage")
        if ad_pct is not None:
            weekly_data[week]["ad_percentages"].append(ad_pct)

        # Collect total items and ads
        total_items = scan.get("total_items")
        if total_items is not None:
            weekly_data[week]["total_items"].append(total_items)

        total_ads = scan.get("total_ads")
        if total_ads is not None:
            weekly_data[week]["total_ads"].append(total_ads)

    # Build weekly trends array with aggregated data
    weekly_trends = []
    for week in sorted(weekly_data.keys()):
        data = weekly_data[week]

        avg_ad_pct = None
        if data["ad_percentages"]:
            avg_ad_pct = sum(data["ad_percentages"]) / len(data["ad_percentages"])

        avg_items = None
        if data["total_items"]:
            avg_items = sum(data["total_items"]) / len(data["total_items"])

        avg_ads = None
        if data["total_ads"]:
            avg_ads = sum(data["total_ads"]) / len(data["total_ads"])

        weekly_trends.append({
            "week": week,
            "scans": data["scans"],
            "avg_ad_percentage": round(avg_ad_pct, 1) if avg_ad_pct is not None else None,
            "avg_total_items": round(avg_items, 1) if avg_items is not None else None,
            "avg_total_ads": round(avg_ads, 1) if avg_ads is not None else None,
        })

    # Determine date range
    first_scan = min(dates) if dates else None
    last_scan = max(dates) if dates else None

    return weekly_trends, first_scan, last_scan


def _calculate_trend_direction(weekly_trends: List[Dict[str, Any]]) -> str:
    """
    Determine if ad percentage trend is increasing, decreasing, or stable.

    Compares the last 2 weeks' average ad percentages.
    If difference > TREND_THRESHOLD_PERCENTAGE_POINTS, marks as increasing/decreasing.
    Otherwise marks as stable.

    Args:
        weekly_trends: List of weekly trend dicts with avg_ad_percentage

    Returns:
        "increasing", "decreasing", or "stable"
    """
    # Filter weeks that have valid ad percentage data
    valid_weeks = [w for w in weekly_trends if w.get("avg_ad_percentage") is not None]

    if len(valid_weeks) < 2:
        return "stable"

    last_week = valid_weeks[-1]
    second_last_week = valid_weeks[-2]

    last_avg = last_week["avg_ad_percentage"]
    prev_avg = second_last_week["avg_ad_percentage"]

    difference = last_avg - prev_avg

    if difference > TREND_THRESHOLD_PERCENTAGE_POINTS:
        return "increasing"
    elif difference < -TREND_THRESHOLD_PERCENTAGE_POINTS:
        return "decreasing"
    else:
        return "stable"


@router.get("/user/trends")
def get_user_trends(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Get user's longitudinal trend analysis.

    Requires Plus subscription. Returns week-over-week trends for:
    - Ad percentage
    - Total items scanned
    - Number of scans per week

    Returns:
        {
            "total_scans": int,
            "date_range": {
                "first_scan": str (ISO datetime) | null,
                "last_scan": str (ISO datetime) | null
            },
            "weekly_trends": [
                {
                    "week": str (ISO week, e.g., "2026-W07"),
                    "scans": int,
                    "avg_ad_percentage": float | null,
                    "avg_total_items": float | null,
                    "avg_total_ads": float | null
                }
            ],
            "summary": {
                "avg_ad_percentage": float | null,
                "ad_percentage_trend": str ("increasing" | "decreasing" | "stable"),
                "total_scans": int,
                "scans_with_data": int
            }
        }
    """
    user_id = current_user["user_id"]

    # Check Plus subscription
    if not is_user_plus(user_id):
        raise HTTPException(
            status_code=403,
            detail="Trends analysis requires Plus subscription"
        )

    # Get all scans for this user
    scans = get_scans_by_user(user_id)

    # Calculate weekly trends
    weekly_trends, first_scan, last_scan = _calculate_weekly_trends(scans)

    # Calculate trend direction
    trend_direction = _calculate_trend_direction(weekly_trends)

    # Calculate summary stats
    ad_percentages = [s.get("ad_percentage") for s in scans if s.get("ad_percentage") is not None]
    avg_ad_pct = sum(ad_percentages) / len(ad_percentages) if ad_percentages else None
    scans_with_data = len(ad_percentages)

    return {
        "total_scans": len(scans),
        "date_range": {
            "first_scan": first_scan,
            "last_scan": last_scan
        },
        "weekly_trends": weekly_trends,
        "summary": {
            "avg_ad_percentage": round(avg_ad_pct, 1) if avg_ad_pct is not None else None,
            "ad_percentage_trend": trend_direction,
            "total_scans": len(scans),
            "scans_with_data": scans_with_data
        }
    }
