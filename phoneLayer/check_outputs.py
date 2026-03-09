#!/usr/bin/env python3
"""Check the quality of output for tests 0, 1, 2, 6 by examining the alpha mask applied."""

import cv2
import numpy as np
import sys
sys.path.insert(0, "phoneLayer")

def check_output(test_num, target_file):
    layer_path = f"phoneLayer/tests/tests_apply_mask{test_num}/target_layer.png"
    target_path = f"phoneLayer/tests/tests_apply_mask{test_num}/{target_file}"

    layer = cv2.imread(layer_path, cv2.IMREAD_UNCHANGED)
    target = cv2.imread(target_path, cv2.IMREAD_UNCHANGED)

    if layer is None:
        print(f"Test {test_num}: No output layer found")
        return

    h, w = layer.shape[:2]
    alpha = layer[:, :, 3]

    # Count transparent pixels (alpha < 128)
    transparent = np.sum(alpha < 128)
    semi = np.sum((alpha >= 1) & (alpha < 255))
    opaque = np.sum(alpha == 255)
    total = h * w

    print(f"\n=== Test {test_num} output ===")
    print(f"  Image size: {w}x{h}")
    print(f"  Transparent pixels (alpha<128): {transparent} ({100*transparent/total:.1f}%)")
    print(f"  Semi-transparent (1-254): {semi} ({100*semi/total:.1f}%)")
    print(f"  Fully opaque (255): {opaque} ({100*opaque/total:.1f}%)")
    print(f"  Alpha range: min={alpha.min()}, max={alpha.max()}")

    # Where is the transparent zone?
    if transparent > 0:
        trans_pixels = np.argwhere(alpha < 128)
        ry_min, rx_min = trans_pixels.min(axis=0)
        ry_max, rx_max = trans_pixels.max(axis=0)
        print(f"  Transparent zone bbox: x=[{rx_min},{rx_max}] y=[{ry_min},{ry_max}]")
        print(f"  Transparent zone size: {rx_max-rx_min}x{ry_max-ry_min}")
    else:
        print(f"  *** NO TRANSPARENT PIXELS — mask not applied correctly!")

    # Check corners — should be opaque (background preserved)
    print(f"  Corner alphas: TL={alpha[0,0]}, TR={alpha[0,w-1]}, BL={alpha[h-1,0]}, BR={alpha[h-1,w-1]}")

tests = [
    (0, "target.png"),
    (1, "target.png"),
    (2, "target.webp"),
    (3, "target.png"),
    (4, "target.png"),
    (5, "target.png"),
    (6, "target.webp"),
    (7, "target.png"),
]

for t, f in tests:
    check_output(t, f)
