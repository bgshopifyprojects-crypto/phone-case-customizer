#!/usr/bin/env python3
"""
Script to find images with significant transparent pixels in a folder.
Prints filenames where the largest connected non-opaque region exceeds the
threshold percentage of total pixels.

Non-opaque is defined as alpha < 240, which captures:
  - Fully transparent pixels (alpha == 0)
  - Semi-transparent / anti-aliased border pixels (0 < alpha < 240)

Using the largest connected component (rather than raw pixel count) avoids
false positives from scattered noise pixels while correctly detecting frame
images whose borders are rendered with semi-transparency.
"""

import argparse
import os
import sys
from typing import Optional
import cv2
import numpy as np


SUPPORTED_EXTENSIONS = {'.png', '.webp', '.tiff', '.tif', '.bmp', '.gif'}

# Pixels with alpha below this value are considered "non-opaque"
ALPHA_OPAQUE_THRESHOLD = 240


def get_transparency_percentage(image_path: str) -> Optional[float]:
    """
    Calculate the percentage of the image covered by the largest connected
    region of non-opaque pixels (alpha < ALPHA_OPAQUE_THRESHOLD).

    Using the largest connected component prevents scattered noise pixels from
    inflating the score while still detecting frame images that use
    semi-transparency for their borders.

    Args:
        image_path: Path to the image file

    Returns:
        Percentage (0-100) of total pixels in the largest connected non-opaque
        region, or None if the image has no alpha channel.
    """
    # Read image with alpha channel (IMREAD_UNCHANGED preserves alpha)
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    if img is None:
        print(f"Warning: Could not read image: {image_path}", file=sys.stderr)
        return None

    # Check if image has alpha channel (4 channels: BGRA)
    if len(img.shape) < 3 or img.shape[2] != 4:
        return None  # No alpha channel

    # Extract alpha channel
    alpha_channel = img[:, :, 3]
    total_pixels = alpha_channel.size

    # Build binary mask: 255 where pixel is non-opaque (alpha < threshold)
    non_opaque_mask = np.where(alpha_channel < ALPHA_OPAQUE_THRESHOLD, 255, 0).astype(np.uint8)

    # If no non-opaque pixels at all, return 0
    if non_opaque_mask.max() == 0:
        return 0.0

    # Find connected components in the non-opaque mask
    num_labels, _, stats, _ = cv2.connectedComponentsWithStats(non_opaque_mask, connectivity=8)

    if num_labels <= 1:
        # Only background label — no non-opaque regions found
        return 0.0

    # stats[label, cv2.CC_STAT_AREA] gives pixel count per component.
    # Label 0 is background (opaque pixels); skip it.
    component_areas = stats[1:, cv2.CC_STAT_AREA]  # exclude background label
    largest_component_area = int(component_areas.max())

    return (largest_component_area / total_pixels) * 100


def find_transparent_images(folder_path: str, threshold: float = 4.0) -> list[tuple[str, float]]:
    """
    Find all images in folder with transparency above threshold.
    
    Args:
        folder_path: Path to folder containing images
        threshold: Minimum percentage of transparent pixels to report
        
    Returns:
        List of tuples (filename, transparency_percentage)
    """
    results = []
    
    if not os.path.isdir(folder_path):
        print(f"Error: '{folder_path}' is not a valid directory", file=sys.stderr)
        sys.exit(1)
    
    for filename in os.listdir(folder_path):
        # Check file extension
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            continue
        
        filepath = os.path.join(folder_path, filename)
        
        if not os.path.isfile(filepath):
            continue
        
        percentage = get_transparency_percentage(filepath)
        
        if percentage is not None and percentage > threshold:
            results.append((filename, percentage))
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description='Find images with significant transparent pixels (>4%% by default)'
    )
    parser.add_argument(
        'folder',
        help='Path to folder containing images'
    )
    parser.add_argument(
        '-t', '--threshold',
        type=float,
        default=4.0,
        help='Transparency threshold percentage (default: 4.0)'
    )
    
    args = parser.parse_args()
    
    results = find_transparent_images(args.folder, args.threshold)
    
    if not results:
        print(f"No images found with transparency > {args.threshold}%")
        return
    
    # Sort by transparency percentage (descending)
    results.sort(key=lambda x: x[1], reverse=True)
    
    print(f"Images with transparency > {args.threshold}%:\n")
    for filename, percentage in results:
        print(f"{filename}: {percentage:.2f}%")


if __name__ == '__main__':
    main()
