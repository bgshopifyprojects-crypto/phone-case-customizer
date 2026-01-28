# Performance Issue - Root Cause Identified

## Problem
Download, Print, Preview, and Cart operations taking 28-45 seconds instead of 2-3 seconds.

## Root Cause
A **broken image on the Shopify product page** is causing html2canvas to hang:

```
GET https://phone-case-test-2.myshopify.com/panel/panel/class/INNOVAEditor/assets/Lansman_Kilif_Aciklama.webp 404 (Not Found)
```

### Why This Happens
1. html2canvas scans the ENTIRE page for resources (images, fonts, etc.)
2. It tries to load this broken image from somewhere on the product page
3. The 404 response takes 28-45 seconds to timeout
4. This happens EVERY time you capture (download, print, preview, cart)

## The Broken Image
- **URL**: `/panel/panel/class/INNOVAEditor/assets/Lansman_Kilif_Aciklama.webp`
- **Source**: Likely from "INNOVAEditor" app or custom code
- **Location**: Somewhere on the Shopify product page (NOT in the customizer)

## Solutions Attempted

### ❌ Failed Attempts
1. `imageTimeout: 5000` - html2canvas ignores this for 404s
2. `ignoreElements` - Breaks html2canvas ("Unable to find element in cloned iframe")
3. `windowWidth/windowHeight` - html2canvas still scans entire page
4. Hiding broken images with `display: none` - html2canvas loads them before we can hide them
5. `onclone` callback - Runs AFTER images are already loaded

### ✅ What Would Work
1. **Remove the broken image from Shopify page** (BEST solution)
2. **Use direct Canvas rendering** instead of html2canvas (requires rewrite)
3. **Server-side image generation** (move to backend)

## Recommended Action

### Immediate Fix: Find and Remove Broken Image

Check these locations in your Shopify admin:

1. **Theme Editor**
   - Go to Online Store > Themes > Customize
   - Check product page template
   - Look for any image blocks or custom HTML

2. **Apps**
   - Check if you have "INNOVAEditor" or similar app installed
   - Disable/uninstall if not needed

3. **Theme Code**
   - Go to Online Store > Themes > Actions > Edit code
   - Search for "Lansman_Kilif_Aciklama" or "INNOVAEditor"
   - Remove or fix the broken image reference

4. **Product Metafields**
   - Check product metafields for custom images
   - Remove any broken references

### Alternative: Reduce Scale Factor

While fixing the broken image, you can temporarily improve performance by reducing quality:

```javascript
html2canvas(phoneScreen, {
  scale: 1,  // Change from 2 to 1 (50% reduction in processing time)
  // ... other options
})
```

This would bring 28s down to ~14s (still slow, but better).

## Long-term Solution

Consider replacing html2canvas with direct canvas rendering:
- Render design elements directly to canvas
- No DOM scanning needed
- Much faster (< 1 second)
- More control over output

This would require rewriting the capture logic but would solve the performance issue permanently.

## Current Status

**html2canvas time**: 28-45 seconds (due to broken image)
**Other operations**: < 1 second (background, frame, export all fast)
**Bottleneck**: 100% html2canvas waiting for 404 response

The customizer itself is fine - it's the Shopify page that has the issue.
