#!/usr/bin/env python3
"""
Extract frames from a screen recording for audit analysis.

Usage:
    python3 extract_frames.py --input video.mov --output-dir ./frames/ --fps 1

Dependencies: ffmpeg (should be available in most environments)
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_video_info(video_path: str) -> dict:
    """Get video metadata using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        video_path
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        info = json.loads(result.stdout)

        # Extract useful metadata
        video_stream = None
        for stream in info.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break

        if not video_stream:
            print("ERROR: No video stream found in file", file=sys.stderr)
            sys.exit(1)

        duration = float(info.get("format", {}).get("duration", 0))
        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))
        fps_str = video_stream.get("r_frame_rate", "30/1")

        # Parse fps fraction
        if "/" in fps_str:
            num, den = fps_str.split("/")
            native_fps = float(num) / float(den)
        else:
            native_fps = float(fps_str)

        return {
            "duration_seconds": duration,
            "width": width,
            "height": height,
            "native_fps": native_fps,
            "codec": video_stream.get("codec_name", "unknown"),
            "file_size_bytes": int(info.get("format", {}).get("size", 0))
        }
    except FileNotFoundError:
        print("ERROR: ffprobe not found. Please install ffmpeg.", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"ERROR: ffprobe failed: {e.stderr}", file=sys.stderr)
        sys.exit(1)


def extract_frames(video_path: str, output_dir: str, fps: float = 1.0,
                   max_dimension: int = 1080) -> dict:
    """
    Extract frames from video at specified fps.

    Args:
        video_path: Path to the video file
        output_dir: Directory to save extracted frames
        fps: Frames per second to extract (default: 1)
        max_dimension: Scale down frames if larger (preserves aspect ratio)

    Returns:
        dict with extraction metadata
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Get video info first
    video_info = get_video_info(video_path)
    expected_frames = int(video_info["duration_seconds"] * fps) + 1

    print(f"Video: {video_path}")
    print(f"Duration: {video_info['duration_seconds']:.1f}s")
    print(f"Resolution: {video_info['width']}x{video_info['height']}")
    print(f"Extracting at {fps} fps → ~{expected_frames} frames")
    print(f"Output: {output_dir}")

    # Build ffmpeg command
    # Scale down if needed (iPhone recordings can be very large)
    scale_filter = f"scale='min({max_dimension},iw)':min'({max_dimension},ih)':force_original_aspect_ratio=decrease"

    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vf", f"fps={fps}",
        "-q:v", "2",  # High quality JPEG
        "-start_number", "1",
        os.path.join(output_dir, "frame_%04d.png")
    ]

    print(f"\nRunning: {' '.join(cmd)}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"ERROR: ffmpeg failed: {e.stderr}", file=sys.stderr)
        sys.exit(1)

    # Count extracted frames
    frames = sorted([
        f for f in os.listdir(output_dir)
        if f.startswith("frame_") and f.endswith(".png")
    ])

    extraction_metadata = {
        "video_path": os.path.abspath(video_path),
        "output_dir": os.path.abspath(output_dir),
        "extraction_fps": fps,
        "frames_extracted": len(frames),
        "frame_files": frames,
        "video_info": video_info,
        "extracted_at": datetime.now().isoformat(),
    }

    # Save metadata
    metadata_path = os.path.join(output_dir, "extraction_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(extraction_metadata, f, indent=2)

    print(f"\n✓ Extracted {len(frames)} frames")
    print(f"✓ Metadata saved to {metadata_path}")

    return extraction_metadata


def main():
    parser = argparse.ArgumentParser(description="Extract frames from screen recording")
    parser.add_argument("--input", "-i", required=True, help="Path to video file")
    parser.add_argument("--output-dir", "-o", required=True, help="Output directory for frames")
    parser.add_argument("--fps", type=float, default=1.0,
                        help="Frames per second to extract (default: 1)")
    parser.add_argument("--max-dimension", type=int, default=1080,
                        help="Max pixel dimension (default: 1080)")

    args = parser.parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: Video file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    extract_frames(args.input, args.output_dir, args.fps, args.max_dimension)


if __name__ == "__main__":
    main()
