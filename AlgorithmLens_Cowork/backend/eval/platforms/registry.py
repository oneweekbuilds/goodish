"""
Platform registry for eval capture modules.

Adding a new platform:
1. Create a new directory under platforms/ (e.g., platforms/instagram/)
2. Implement capture.py with a capture_feed() function
3. Implement normalize.py with a normalize_to_unified_scan() function
4. Register it here with register_platform()
"""

from __future__ import annotations

from typing import Callable, Dict, Optional, Any
from dataclasses import dataclass


@dataclass
class PlatformModule:
    """Registration record for a platform capture module."""
    name: str
    capture_fn: Callable          # async fn(config) -> CaptureSnapshot
    normalize_fn: Callable        # fn(CaptureSnapshot) -> UnifiedScanResult dict
    enabled: bool = True
    description: str = ""
    default_url: str = ""


# Global registry
_platforms: Dict[str, PlatformModule] = {}


def register_platform(
    name: str,
    capture_fn: Callable,
    normalize_fn: Callable,
    enabled: bool = True,
    description: str = "",
    default_url: str = "",
) -> None:
    """Register a platform capture module."""
    _platforms[name.lower()] = PlatformModule(
        name=name.lower(),
        capture_fn=capture_fn,
        normalize_fn=normalize_fn,
        enabled=enabled,
        description=description,
        default_url=default_url,
    )


def get_platform(name: str) -> Optional[PlatformModule]:
    """Look up a registered platform by name."""
    return _platforms.get(name.lower())


def list_platforms(enabled_only: bool = True) -> list[str]:
    """List registered platform names."""
    if enabled_only:
        return [name for name, mod in _platforms.items() if mod.enabled]
    return list(_platforms.keys())


def is_platform_registered(name: str) -> bool:
    """Check if a platform is registered."""
    return name.lower() in _platforms
