#!/usr/bin/env python3
"""Inspect reference images to understand their alpha structure."""

import cv2
import numpy as np
import sys
sys.path.insert(0, "phoneLayer")
from apply_phone_mask import extract_alpha_mask, detect_phone_bbox

def inspect_ref(test_num, refer_file):
    path = f"phoneLayer/tests/tests_apply_mask{test_num}/{refer_file}"
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"  ERROR: could not read {path}")
        return

    h, w = img.shape[:2]
    channels = img.shape[2] if len(img.shape) == 3 else 1
    print(f"\n=== Test {test_num} reference: {refer_file} ===")
    print(f"  Shape: {w}x{h}, channels={channels}")

    raw_alpha = img[:, :, 3]
    print(f"  Raw alpha: min={raw_alpha.min()}, max={raw_alpha.max()}, mean={raw_alpha.mean():.1f}")
    corner_avg = (int(raw_alpha[0,0]) + int(raw_alpha[0,w-1]) + int(raw_alpha[h-1,0]) + int(raw_alpha[h-1,w-1])) / 4
    center_val = int(raw_alpha[h//2, w//2])
    print(f"  Corner alpha avg: {corner_avg:.1f}, Center alpha: {center_val}")

    # After extract_alpha_mask normalization
    alpha = extract_alpha_mask(img)
    print(f"  Normalized alpha: min={alpha.min()}, max={alpha.max()}, mean={alpha.mean():.1f}")

    # Count zones in normalized alpha
    transparent = np.sum(alpha < 128)
    opaque = np.sum(alpha >= 128)
    total = h * w
    print(f"  Transparent (alpha<128): {transparent} ({100*transparent/total:.1f}%)")
    print(f"  Opaque (alpha>=128): {opaque} ({100*opaque/total:.1f}%)")

    if transparent > 0:
        trans_pixels = np.argwhere(alpha < 128)
        ry_min, rx_min = trans_pixels.min(axis=0)
        ry_max, rx_max = trans_pixels.max(axis=0)
        print(f"  Transparent zone: x=[{rx_min},{rx_max}] y=[{ry_min},{ry_max}]")
        print(f"  Transparent zone size: {rx_max-rx_min}x{ry_max-ry_min}")

    bbox = detect_phone_bbox(img)
    print(f"  Phone bbox: {bbox}")

    # What fraction of the phone bbox is transparent?
    phone_alpha = alpha[bbox.top:bbox.bottom, bbox.left:bbox.right]
    phone_trans = np.sum(phone_alpha < 128)
    phone_total = bbox.width * bbox.height
    print(f"  Transparent fraction within phone bbox: {100*phone_trans/phone_total:.1f}%")

tests = [
    (0, "refer.png"),
    (1, "refer.png"),
    (2, "refer.webp"),
    (3, "refer.webp"),
    (4, "refer.png"),
    (5, "refer.png"),
    (6, "refer.png"),
    (7, "refer.png"),
]

for t, f in tests:
    inspect_ref(t, f)
