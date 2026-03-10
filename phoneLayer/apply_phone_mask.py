#!/usr/bin/env python3
"""
Script to apply phone case transparency mask from a reference image to a target image.
Handles different phone dimensions by detecting phone boundaries and scaling the mask.

The script:
1. Detects phone boundaries in both reference and target images using edge detection
2. Uses majority voting for edge positions to handle button protrusions
3. Scales the transparency mask from reference to fit the target phone
4. Saves the result with '_layer.png' suffix and a debug visualization
"""

import argparse
import os
import sys
import cv2
import numpy as np
from dataclasses import dataclass


@dataclass
class BoundingBox:
    """Represents a bounding box with left, top, right, bottom coordinates."""
    left: int
    top: int
    right: int
    bottom: int
    
    @property
    def width(self) -> int:
        return self.right - self.left
    
    @property
    def height(self) -> int:
        return self.bottom - self.top
    
    def __repr__(self) -> str:
        return f"BoundingBox(l={self.left}, t={self.top}, r={self.right}, b={self.bottom}, w={self.width}, h={self.height})"


def get_background_color(image: np.ndarray) -> np.ndarray:
    """
    Get background color from the upper-left pixel.
    
    Args:
        image: Input image (BGR or BGRA)
        
    Returns:
        Background color as BGR array
    """
    # Get upper-left pixel, only BGR channels
    return image[0, 0, :3].copy()


def create_foreground_mask(image: np.ndarray, bg_color: np.ndarray, tolerance: int = 30) -> np.ndarray:
    """
    Create a binary mask where foreground (non-background) pixels are white.
    
    Args:
        image: Input image (BGR or BGRA)
        bg_color: Background color (BGR)
        tolerance: Color difference tolerance
        
    Returns:
        Binary mask (255 for foreground, 0 for background)
    """
    # Use only BGR channels
    bgr = image[:, :, :3]
    
    # Calculate absolute difference from background color
    diff = np.abs(bgr.astype(np.int16) - bg_color.astype(np.int16))
    max_diff = np.max(diff, axis=2)
    
    # Create mask: foreground where difference exceeds tolerance
    mask = (max_diff > tolerance).astype(np.uint8) * 255
    
    return mask


def find_edge_position_majority(mask: np.ndarray, axis: str, side: str, 
                                 percentile: float = 50) -> int:
    """
    Find edge position using majority voting (median of edge positions).
    
    Args:
        mask: Binary foreground mask
        axis: 'vertical' for left/right edges, 'horizontal' for top/bottom
        side: 'left', 'right', 'top', or 'bottom'
        percentile: Percentile to use (50 = median for majority)
        
    Returns:
        Edge position (x or y coordinate)
    """
    h, w = mask.shape
    positions = []
    
    if axis == 'vertical':
        # For each row, find the leftmost or rightmost foreground pixel
        for y in range(h):
            row = mask[y, :]
            fg_indices = np.where(row > 0)[0]
            if len(fg_indices) > 0:
                if side == 'left':
                    positions.append(fg_indices[0])
                else:  # right
                    positions.append(fg_indices[-1])
    else:  # horizontal
        # For each column, find the topmost or bottommost foreground pixel
        for x in range(w):
            col = mask[:, x]
            fg_indices = np.where(col > 0)[0]
            if len(fg_indices) > 0:
                if side == 'top':
                    positions.append(fg_indices[0])
                else:  # bottom
                    positions.append(fg_indices[-1])
    
    if not positions:
        # Fallback if no foreground found
        if side == 'left' or side == 'top':
            return 0
        elif side == 'right':
            return w - 1
        else:
            return h - 1
    
    # Use percentile (50 = median = majority)
    return int(np.percentile(positions, percentile))


def detect_phone_bbox(image: np.ndarray, tolerance: int = 30) -> BoundingBox:
    """
    Detect phone bounding box using majority voting for edges.
    
    Args:
        image: Input image (BGR or BGRA)
        tolerance: Color tolerance for background detection
        
    Returns:
        BoundingBox of the phone
    """
    bg_color = get_background_color(image)
    mask = create_foreground_mask(image, bg_color, tolerance)
    
    # Apply morphological operations to clean up the mask
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Find edges using majority voting
    left = find_edge_position_majority(mask, 'vertical', 'left')
    right = find_edge_position_majority(mask, 'vertical', 'right')
    top = find_edge_position_majority(mask, 'horizontal', 'top')
    bottom = find_edge_position_majority(mask, 'horizontal', 'bottom')
    
    return BoundingBox(left, top, right, bottom)


def extract_alpha_mask(image: np.ndarray) -> np.ndarray | None:
    """
    Extract alpha channel from image.
    
    Args:
        image: Input image (should be BGRA)
        
    Returns:
        Alpha channel as grayscale image, or None if no alpha
    """
    if len(image.shape) < 3 or image.shape[2] != 4:
        return None
    return image[:, :, 3].copy()


def scale_mask_to_bbox(mask: np.ndarray, src_bbox: BoundingBox, 
                       dst_bbox: BoundingBox, dst_shape: tuple) -> np.ndarray:
    """
    Scale and position mask from source bbox to destination bbox.
    
    The output mask keeps the entire image opaque (255) except where the 
    reference mask has transparency (e.g., camera cutouts). This preserves
    the background of the target image.
    
    Args:
        mask: Source alpha mask (full image size)
        src_bbox: Bounding box of phone in source image
        dst_bbox: Bounding box of phone in destination image
        dst_shape: Shape of destination image (height, width)
        
    Returns:
        Scaled mask matching destination image size
    """
    # Extract the mask region within source bbox
    src_mask_region = mask[src_bbox.top:src_bbox.bottom, src_bbox.left:src_bbox.right]
    
    # Scale to destination bbox size
    dst_width = dst_bbox.width
    dst_height = dst_bbox.height
    
    scaled_region = cv2.resize(src_mask_region, (dst_width, dst_height), 
                               interpolation=cv2.INTER_LINEAR)
    
    # Create full-size output mask (fully opaque - keeps entire target image visible)
    output_mask = np.full((dst_shape[0], dst_shape[1]), 255, dtype=np.uint8)
    
    # Place scaled region at destination bbox position
    # This applies transparency only where the reference mask has it (camera cutouts, etc.)
    output_mask[dst_bbox.top:dst_bbox.top + dst_height, 
                dst_bbox.left:dst_bbox.left + dst_width] = scaled_region
    
    return output_mask


def draw_debug_visualization(image: np.ndarray, bbox: BoundingBox, 
                             title: str, color: tuple = (0, 255, 0)) -> np.ndarray:
    """
    Draw bounding box on image for debugging.
    
    Args:
        image: Input image
        bbox: Bounding box to draw
        title: Title text to add
        color: BGR color for the rectangle
        
    Returns:
        Image with visualization
    """
    vis = image.copy()
    if vis.shape[2] == 4:
        vis = cv2.cvtColor(vis, cv2.COLOR_BGRA2BGR)
    
    # Draw rectangle
    cv2.rectangle(vis, (bbox.left, bbox.top), (bbox.right, bbox.bottom), color, 3)
    
    # Add title
    cv2.putText(vis, title, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    
    # Add dimensions
    dim_text = f"W:{bbox.width} H:{bbox.height}"
    cv2.putText(vis, dim_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    return vis


def apply_phone_mask(reference_path: str, target_path: str, 
                     tolerance: int = 30) -> tuple[str, str]:
    """
    Apply transparency mask from reference phone case image to target phone image.
    
    Args:
        reference_path: Path to reference image (transparent phone case)
        target_path: Path to target image (non-transparent phone)
        tolerance: Color tolerance for background detection
        
    Returns:
        Tuple of (output_path, debug_path)
    """
    # Read images
    reference = cv2.imread(reference_path, cv2.IMREAD_UNCHANGED)
    if reference is None:
        print(f"Error: Could not read reference image: {reference_path}", file=sys.stderr)
        sys.exit(1)
    
    target = cv2.imread(target_path, cv2.IMREAD_UNCHANGED)
    if target is None:
        print(f"Error: Could not read target image: {target_path}", file=sys.stderr)
        sys.exit(1)
    
    # Check reference has alpha channel
    alpha_mask = extract_alpha_mask(reference)
    if alpha_mask is None:
        print(f"Error: Reference image has no alpha channel: {reference_path}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Reference image: {reference.shape[1]}x{reference.shape[0]}")
    print(f"Target image: {target.shape[1]}x{target.shape[0]}")
    
    # Detect phone bounding boxes
    print("\nDetecting phone boundaries...")
    ref_bbox = detect_phone_bbox(reference, tolerance)
    target_bbox = detect_phone_bbox(target, tolerance)
    
    print(f"Reference phone bbox: {ref_bbox}")
    print(f"Target phone bbox: {target_bbox}")
    
    # Scale the mask
    print("\nScaling mask to fit target...")
    scaled_mask = scale_mask_to_bbox(alpha_mask, ref_bbox, target_bbox, target.shape[:2])
    
    # Ensure target has alpha channel
    if len(target.shape) < 3:
        target = cv2.cvtColor(target, cv2.COLOR_GRAY2BGRA)
    elif target.shape[2] == 3:
        target = cv2.cvtColor(target, cv2.COLOR_BGR2BGRA)
    
    # Apply the scaled mask
    target[:, :, 3] = scaled_mask
    
    # Generate output paths
    target_dir = os.path.dirname(target_path) or '.'
    target_basename = os.path.splitext(os.path.basename(target_path))[0]
    output_path = os.path.join(target_dir, f"{target_basename}_layer.png")
    debug_path = os.path.join(target_dir, f"{target_basename}_debug.png")
    
    # Save output
    cv2.imwrite(output_path, target)
    
    # Create and save debug visualization
    ref_vis = draw_debug_visualization(reference, ref_bbox, "Reference", (0, 255, 0))
    target_vis = draw_debug_visualization(cv2.imread(target_path), target_bbox, "Target", (0, 0, 255))
    
    # Resize for side-by-side comparison
    max_height = max(ref_vis.shape[0], target_vis.shape[0])
    
    # Scale reference to match height
    ref_scale = max_height / ref_vis.shape[0]
    ref_vis_resized = cv2.resize(ref_vis, None, fx=ref_scale, fy=ref_scale)
    
    # Scale target to match height
    target_scale = max_height / target_vis.shape[0]
    target_vis_resized = cv2.resize(target_vis, None, fx=target_scale, fy=target_scale)
    
    # Concatenate horizontally
    debug_image = np.hstack([ref_vis_resized, target_vis_resized])
    cv2.imwrite(debug_path, debug_image)
    
    return output_path, debug_path


def main():
    parser = argparse.ArgumentParser(
        description='Apply phone case transparency mask to target phone image'
    )
    parser.add_argument(
        'reference',
        help='Path to reference image (transparent phone case PNG)'
    )
    parser.add_argument(
        'target',
        help='Path to target image (non-transparent phone image)'
    )
    parser.add_argument(
        '-t', '--tolerance',
        type=int,
        default=30,
        help='Color tolerance for background detection (default: 30)'
    )
    
    args = parser.parse_args()
    
    # Validate paths
    if not os.path.isfile(args.reference):
        print(f"Error: Reference file not found: {args.reference}", file=sys.stderr)
        sys.exit(1)
    
    if not os.path.isfile(args.target):
        print(f"Error: Target file not found: {args.target}", file=sys.stderr)
        sys.exit(1)
    
    output_path, debug_path = apply_phone_mask(args.reference, args.target, args.tolerance)
    
    print(f"\nOutput saved to: {output_path}")
    print(f"Debug visualization saved to: {debug_path}")


if __name__ == '__main__':
    main()
