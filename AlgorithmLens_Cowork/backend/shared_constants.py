"""
Shared constants for AlgorithmLens backend.

SYNC WARNING: These constants must stay in sync with the Chrome extension.
Extension mirror: alg-gemini-extension/src/shared/constants.js

When modifying platform lists or names, update BOTH files.
"""

# Platforms supported for extension scanning
SUPPORTED_SCAN_PLATFORMS = [
    'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit'
]

# All platforms accepted by the backend (superset of extension platforms)
ALL_ACCEPTED_PLATFORMS = {
    'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'x', 'linkedin', 'reddit'
}

# Platform name aliases (normalize to canonical name)
PLATFORM_ALIASES = {
    'x': 'twitter',
}

# Human-readable platform display names
PLATFORM_DISPLAY_NAMES = {
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'twitter': 'Twitter/X',
    'reddit': 'Reddit',
    'linkedin': 'LinkedIn',
}

# API version
API_VERSION = '1'

# Ad percentage in scan payloads: 0.0 to 1.0 (decimal)
# Database stores 0-100 for direct display
AD_PERCENTAGE_SCALE_PAYLOAD = 'decimal'  # 0.0 to 1.0
AD_PERCENTAGE_SCALE_DB = 'percentage'    # 0.0 to 100.0
