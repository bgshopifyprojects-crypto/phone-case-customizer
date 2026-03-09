#!/usr/bin/env python3
"""
Debug script v6: Look at the actual images visually.
Save composited versions to understand what "broken" looks like.
"""

import cv2
import numpy as np
import os
import sys

sys.path.insert(0, "phoneLayer")
from apply_phone_mask import detect_phone_bbox, scale_mask_to_bbox, extract_alpha_mask


def composite_on_checkerboard(image_bgra: np.ndarray, tile_size: int = 20) -> np.ndarray:
    """Composite BGRA image on checkerboard to visualize transparency."""
    h, w = image_bgra.shape[:2]
    checker = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(0, h, tile_size):
        for x in range(0, w, tile_size):
            tile_y = (y // tile_size) % 2
            tile_x = (x // tile_size) % 2
            color = 200 if (tile_y + tile_x) % 2 == 0 else 150
            checker[y:y+tile_size, x:x+tile_size] = color

    alpha = image_bgra[:, :, 3:4].astype(np.float32) / 255.0
    bgr = image_bgra[:, :, :3].astype(np.float32)
    result = bgr * alpha + checker.astype(np.float32) * (1 - alpha)
    return result.astype(np.uint8)


def analyze_test(test_name: str, test_dir: str, output_dir: str):
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")

    files = os.listdir(test_dir)
    refer_file = next((f for f in files if f.startswith("refer")), None)
    target_file = next((f for f in files if f == "target.png" or f == "target.webp"), None)

    refer_path = os.path.join(test_dir, refer_file)
    target_path = os.path.join(test_dir, target_file)

    reference = cv2.imread(refer_path, cv2.IMREAD_UNCHANGED)
    target = cv2.imread(target_path, cv2.IMREAD_UNCHANGED)

    # Save reference composited on checkerboard
    ref_comp = composite_on_checkerboard(reference)
    cv2.imwrite(os.path.join(output_dir, f"{test_name}_refer_composited.png"), ref_comp)

    # Save target as-is
    cv2.imwrite(os.path.join(output_dir, f"{test_name}_target.png"), target)

    # Load and save the output
    output_path = os.path.join(test_dir, "target_layer.png")
    if os.path.exists(output_path):
        output = cv2.imread(output_path, cv2.IMREAD_UNCHANGED)
        out_comp = composite_on_checkerboard(output)
        cv2.imwrite(os.path.join(output_dir, f"{test_name}_output_composited.png"), out_comp)

    # Print key stats
    ref_alpha = reference[:, :, 3]
    h_r, w_r = reference.shape[:2]
    h_t, w_t = target.shape[:2]

    ref_bbox = detect_phone_bbox(reference)
    target_bbox = detect_phone_bbox(target)

    print(f"  ref_bbox:    {ref_bbox}")
    print(f"  target_bbox: {target_bbox}")

    # The transparent zone in reference
    ref_trans = np.argwhere(ref_alpha == 0)
    ry_min, rx_min = ref_trans.min(axis=0)
    ry_max, rx_max = ref_trans.max(axis=0)
    print(f"  Reference transparent zone: x=[{rx_min},{rx_max}] y=[{ry_min},{ry_max}]")

    # What fraction of the reference PHONE (ref_bbox) is the transparent zone?
    rx_min_rel = rx_min - ref_bbox.left
    rx_max_rel = rx_max - ref_bbox.left
    ry_min_rel = ry_min - ref_bbox.top
    ry_max_rel = ry_max - ref_bbox.top
    print(f"  Transparent zone as fraction of ref_bbox:")
    print(f"    x=[{rx_min_rel/ref_bbox.width:.3f},{rx_max_rel/ref_bbox.width:.3f}]")
    print(f"    y=[{ry_min_rel/ref_bbox.height:.3f},{ry_max_rel/ref_bbox.height:.3f}]")

    # Where does this map to in the target?
    scale_x = target_bbox.width / ref_bbox.width
    scale_y = target_bbox.height / ref_bbox.height
    tx_min = target_bbox.left + int(rx_min_rel * scale_x)
    tx_max = target_bbox.left + int(rx_max_rel * scale_x)
    ty_min = target_bbox.top + int(ry_min_rel * scale_y)
    ty_max = target_bbox.top + int(ry_max_rel * scale_y)
    print(f"  Mapped transparent zone in target: x=[{tx_min},{tx_max}] y=[{ty_min},{ty_max}]")

    # What does the target look like at the frame area?
    # The frame should be between target_bbox edge and transparent zone
    frame_left_width = tx_min - target_bbox.left
    frame_right_width = target_bbox.right - tx_max
    frame_top_height = ty_min - target_bbox.top
    frame_bottom_height = target_bbox.bottom - ty_max
    print(f"  Frame widths: left={frame_left_width}, right={frame_right_width}, top={frame_top_height}, bottom={frame_bottom_height}")

    # Sample target at frame area
    mid_y = h_t // 2
    print(f"\n  Target pixels at left frame (row {mid_y}):")
    for x in range(target_bbox.left, tx_min, max(1, frame_left_width // 5)):
        if 0 <= x < w_t:
            print(f"    x={x}: BGR={target[mid_y, x, :3]}")

    # Sample target at transparent zone
    print(f"  Target pixels at transparent zone (row {mid_y}):")
    for x in range(tx_min, tx_min + 30, 5):
        if 0 <= x < w_t:
            print(f"    x={x}: BGR={target[mid_y, x, :3]}")

    # Check if the frame area in the target is actually the phone frame
    # (should be darker/different from the transparent zone)
    if frame_left_width > 0:
        frame_pixels = target[mid_y, target_bbox.left:tx_min, :3]
        zone_pixels = target[mid_y, tx_min:tx_max, :3]
        print(f"\n  Frame area mean color: {frame_pixels.mean(axis=0)}")
        print(f"  Transparent zone mean color: {zone_pixels.mean(axis=0)}")

        # Are they different?
        frame_mean = frame_pixels.mean()
        zone_mean = zone_pixels.mean()
        print(f"  Frame brightness: {frame_mean:.1f}, Zone brightness: {zone_mean:.1f}")
        if abs(frame_mean - zone_mean) < 20:
            print(f"  *** FRAME AND ZONE LOOK SIMILAR! The transparent zone may be in the wrong place")
        else:
            print(f"  Frame and zone are visually distinct (diff={abs(frame_mean-zone_mean):.1f})")


def main():
    output_dir = "phoneLayer/debug_output"
    os.makedirs(output_dir, exist_ok=True)

    tests = [
        ("test0_working", "phoneLayer/tests/tests_apply_mask0"),
        ("test5_broken", "phoneLayer/tests/tests_apply_mask5"),
        ("test7_broken", "phoneLayer/tests/tests_apply_mask7"),
        ("test8_broken", "phoneLayer/tests/tests_apply_mask8"),
    ]

    for name, path in tests:
        analyze_test(name, path, output_dir)

    print(f"\nComposited images saved to {output_dir}/")
    print("Check these images to understand the visual difference.")


if __name__ == "__main__":
    main()
