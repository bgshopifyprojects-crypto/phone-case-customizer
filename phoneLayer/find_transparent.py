#!/usr/bin/env python3
"""
Script to find images with significant transparent pixels in a folder.
Prints filenames where transparent pixels exceed 25% of total pixels.
"""

import argparse
import os
import sys
import cv2
import numpy as np


SUPPORTED_EXTENSIONS = {'.png', '.webp', '.tiff', '.tif', '.bmp', '.gif'}


def get_transparency_percentage(image_path: str) -> float | None:
    """
    Calculate the percentage of transparent pixels in an image.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Percentage of transparent pixels (0-100), or None if image has no alpha channel
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
    
    # Count transparent pixels (alpha = 0)
    total_pixels = alpha_channel.size
    transparent_pixels = np.sum(alpha_channel == 0)
    
    return (transparent_pixels / total_pixels) * 100


def find_transparent_images(folder_path: str, threshold: float = 25.0) -> list[tuple[str, float]]:
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
        description='Find images with significant transparent pixels (>5%% by default)'
    )
    parser.add_argument(
        'folder',
        help='Path to folder containing images'
    )
    parser.add_argument(
        '-t', '--threshold',
        type=float,
        default=5.0,
        help='Transparency threshold percentage (default: 5.0)'
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
