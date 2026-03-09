#!/usr/bin/env python3
"""Inspect target images for tests 0, 1, 2, 6 to understand why bbox detection fails."""

import cv2
import numpy as np
import sys
sys.path.insert(0, "phoneLayer")
from apply_phone_mask import get_background_color, create_foreground_mask, _build_mask_from_canny, detect_phone_bbox

def inspect(test_num, target_file):
    path = f"phoneLayer/tests/tests_apply_mask{test_num}/{target_file}"
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"  ERROR: could not read {path}")
        return
    h, w = img.shape[:2]
    channels = img.shape[2] if len(img.shape) == 3 else 1
    print(f"\n=== Test {test_num}: {target_file} ===")
    print(f"  Shape: {w}x{h}, channels={channels}")
    print(f"  Upper-left pixel: {img[0,0]}")
    print(f"  Upper-right pixel: {img[0,w-1]}")
    print(f"  Lower-left pixel: {img[h-1,0]}")
    print(f"  Lower-right pixel: {img[h-1,w-1]}")
    print(f"  Center pixel: {img[h//2,w//2]}")

    if channels == 4:
        alpha = img[:,:,3]
        print(f"  Alpha: min={alpha.min()}, max={alpha.max()}, mean={alpha.mean():.1f}")
        print(f"  Corner alpha avg: {(int(alpha[0,0])+int(alpha[0,w-1])+int(alpha[h-1,0])+int(alpha[h-1,w-1]))/4:.1f}")
        print(f"  Center alpha: {alpha[h//2,w//2]}")
    else:
        bg = get_background_color(img)
        print(f"  Background color (BGR): {bg}")
        mask_bgr = create_foreground_mask(img, bg, tolerance=30)
        fg_ratio = np.sum(mask_bgr > 0) / (h * w)
        print(f"  BGR mask fg_ratio (tol=30): {fg_ratio:.3f}")
        mask_bgr10 = create_foreground_mask(img, bg, tolerance=10)
        fg_ratio10 = np.sum(mask_bgr10 > 0) / (h * w)
        print(f"  BGR mask fg_ratio (tol=10): {fg_ratio10:.3f}")
        mask_canny = _build_mask_from_canny(img)
        fg_canny = np.sum(mask_canny > 0) / (h * w)
        print(f"  Canny mask fg_ratio: {fg_canny:.3f}")

    bbox = detect_phone_bbox(img, tolerance=30)
    print(f"  Detected bbox: {bbox}")

tests = [
    (0, "target.png"),
    (1, "target.png"),
    (2, "target.webp"),
    (6, "target.webp"),
]

for t, f in tests:
    inspect(t, f)
