#!/usr/bin/env python3
"""
Analyze transparency of WebP images using Pillow.
Reports: has_alpha, fully_transparent%, partially_transparent%, fully_opaque%, min_alpha, max_alpha
"""

import os
import sys

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: Pillow or numpy not installed. Run: pip install Pillow numpy")
    sys.exit(1)

IMAGES = [
    "phoneLayer/find-transparent-in-images/Apple_iPhone_17_Pro_Max_Kisiye_Ozel_Kilif_Tasarla_Seffaf_Silikon_Kilif-cerceve.webp",
    "phoneLayer/find-transparent-in-images/Magnet_Buton_Rozet_Cerceve (2).webp",
    "phoneLayer/find-transparent-in-images/hatali-magnet-trasparent.png",
]

SEP = "-" * 140

def analyze(path):
    fname = os.path.basename(path)
    if not os.path.exists(path):
        return {"filename": fname, "error": "File not found"}

    img = Image.open(path)
    mode = img.mode
    size = img.size

    has_alpha = "A" in mode or mode in ("RGBA", "LA", "PA")

    if has_alpha:
        img_rgba = img.convert("RGBA")
        alpha = np.array(img_rgba, dtype=np.uint8)[:, :, 3]
        total = alpha.size
        fully_transparent = int(np.sum(alpha == 0))
        fully_opaque = int(np.sum(alpha == 255))
        partially_transparent = total - fully_transparent - fully_opaque
        min_alpha = int(alpha.min())
        max_alpha = int(alpha.max())
        return {
            "filename": fname,
            "mode": mode,
            "size": size,
            "has_alpha": True,
            "total_pixels": total,
            "fully_transparent_pct": fully_transparent / total * 100,
            "partially_transparent_pct": partially_transparent / total * 100,
            "fully_opaque_pct": fully_opaque / total * 100,
            "min_alpha": min_alpha,
            "max_alpha": max_alpha,
        }
    else:
        return {
            "filename": fname,
            "mode": mode,
            "size": size,
            "has_alpha": False,
            "total_pixels": img.size[0] * img.size[1],
            "fully_transparent_pct": 0.0,
            "partially_transparent_pct": 0.0,
            "fully_opaque_pct": 100.0,
            "min_alpha": "N/A",
            "max_alpha": "N/A",
        }


results = [analyze(p) for p in IMAGES]

print()
print("=" * 140)
print("  TRANSPARENCY ANALYSIS REPORT")
print("=" * 140)
print(f"  {'#':<3} {'Filename':<65} {'Has Alpha':<10} {'Full Transp%':>13} {'Part Transp%':>13} {'Full Opaque%':>13} {'Min Alpha':>10} {'Max Alpha':>10}")
print(SEP)

for i, r in enumerate(results, 1):
    if "error" in r:
        print(f"  {i:<3} {r['filename']:<65} ERROR: {r['error']}")
        continue
    ft  = f"{r['fully_transparent_pct']:.4f}%"
    pt  = f"{r['partially_transparent_pct']:.4f}%"
    fo  = f"{r['fully_opaque_pct']:.4f}%"
    mn  = str(r['min_alpha'])
    mx  = str(r['max_alpha'])
    ha  = str(r['has_alpha'])
    print(f"  {i:<3} {r['filename']:<65} {ha:<10} {ft:>13} {pt:>13} {fo:>13} {mn:>10} {mx:>10}")
    print(f"       mode={r['mode']}, size={r['size']}, total_pixels={r['total_pixels']:,}")
    print()

print(SEP)
print()
print("LEGEND:")
print("  Full Transp%  = pixels with alpha == 0   (completely invisible)")
print("  Part Transp%  = pixels with 0 < alpha < 255 (semi-transparent / anti-aliased edges)")
print("  Full Opaque%  = pixels with alpha == 255 (completely visible)")
print("  Min/Max Alpha = range of alpha values found in the image")
print()
