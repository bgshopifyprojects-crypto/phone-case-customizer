# Custom Frame Feature

## Overview
Products with only one variant can now use a custom frame image instead of auto-generated frames.

## How It Works

### For Single-Variant Products:
1. The system checks if the product has exactly 1 variant
2. It looks through all product images for one with alt text = "frame" (case-insensitive)
3. If found, that image is used as the phone case frame
4. If not found, the system falls back to auto-generating a frame from the product image

### For Multi-Variant Products:
- Auto-frame generation continues to work as before
- Custom frame images are ignored

## Setup Instructions

To use a custom frame for a single-variant product:

1. Upload your frame image to the product in Shopify admin
2. Set the image's alt text to exactly: `frame` (case doesn't matter - "Frame", "FRAME", "frame" all work)
3. The customizer will automatically use this image as the frame

## Safety Features

The implementation is safe and includes fallbacks:
- ✅ If no frame image is found, auto-generation still works
- ✅ If the frame image fails to load, auto-generation is attempted
- ✅ Multi-variant products are unaffected
- ✅ Works with existing products without any changes needed

## Technical Details

### Files Modified:
1. `extensions/phone-case-customizer/blocks/phone-case-customizer.liquid`
   - Added logic to detect single-variant products
   - Searches for image with alt="frame"
   - Passes `data-custom-frame` attribute to React app

2. `phone-case-customizer/src/App.jsx`
   - Updated frame generation logic to check for custom frame flag
   - Uses custom frame if available, falls back to auto-generation

### Data Flow:
```
Liquid Template (checks variants & images)
    ↓
Sets data-custom-frame="true" if frame found
    ↓
React App reads flag
    ↓
Uses custom frame OR auto-generates
```

## Example Console Output

When a custom frame is found:
```
variants_count: 1
custom_frame_found: true
Using custom frame from product image: https://...
```

When auto-generation is used:
```
variants_count: 1
custom_frame_found: false
DEBUG: Generating frame from product image: https://...
Frame generated successfully
```
