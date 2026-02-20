# Current Phone Case Customizer Setup - Simple Explanation

## What Happens Now (Step by Step)

### 1. **User Opens Product Page**
- Shopify product page loads
- Product has variants (e.g., "iPhone 15 Red", "iPhone 15 Blue")
- Each variant has a product image (the phone case photo)

### 2. **Customizer Loads**
- React app starts
- Gets product image URL from Shopify: `product.images[0]`
- Example: `https://cdn.shopify.com/s/files/1/0123/4567/products/red-phone-case.jpg`

### 3. **The 4 Visual Layers (What User Sees)**

Think of it like transparent sheets stacked on top of each other:

```
┌─────────────────────────────────────┐
│  Layer 4: Auto-Generated Frame      │  ← Generated from product image
│  - Created by backend API           │     (z-index: 100)
│  - Camera cutouts, edges            │
├─────────────────────────────────────┤
│  Layer 3: Custom Frame (Optional)   │  ← Image with alt="frame"
│  - From product images              │     (z-index: 100)
│  - Detected by alt tag              │
├─────────────────────────────────────┤
│  Layer 2: User's Design (Middle)    │  ← User's images and text
│  - Images user uploads              │     (z-index: 50)
│  - Text user adds                   │
├─────────────────────────────────────┤
│  Layer 1: Background (Bottom)       │  ← Product image from Shopify
│  - Product image (600x1000)         │     (z-index: 1)
│  - The actual phone case photo      │
└─────────────────────────────────────┘
```

### 4. **Current Frame Detection Logic**

The system looks through ALL product images for one with `alt="frame"`:

```liquid
{% for image in product.images %}
  {% if image.alt == 'frame' %}
    Use this as custom frame (Layer 3)
  {% endif %}
{% endfor %}
```

**Important**: The frame image is:
- ✅ Part of the product images in Shopify
- ✅ Detected by checking `alt` attribute
- ✅ Hidden from product page display (CSS hides it)
- ✅ Used as an overlay layer in customizer

### 5. **Current Frame Generation**

Right now, there are TWO frame layers that can exist:

#### Layer 3: Custom Frame (Optional)
- **Source**: Product image with `alt="frame"`
- **Detection**: Liquid template scans all product images
- **Usage**: If found, displayed as custom-frame layer
- **Example**: Store owner uploads transparent PNG with alt="frame"

#### Layer 4: Auto-Generated Frame (Always)
- **Source**: Generated from product image (Layer 1)
- **Method**: Backend API call to `/apps/customizer/generate-frame`
- **Current Implementation**: JavaScript/Canvas processing
- **Problem**: Not very accurate, limited capabilities
- **This is what we want to improve with Python!**

### 5. **When User Changes Variant**

```
User clicks "Blue" variant
    ↓
Shopify updates product image URL
    ↓
React app detects change
    ↓
Updates background (Layer 1)
    ↓
Checks for alt="frame" image (Layer 3)
    ↓
Regenerates auto frame (Layer 4)
    ↓
User sees new phone case color with frames
```

---

## The Current Flow (Diagram)

```
┌──────────────┐
│   Shopify    │
│   Product    │
│   (Variant)  │
└──────┬───────┘
       │
       │ Product Images
       ↓
┌──────────────────────────────────────┐
│      Liquid Template (Server)        │
│                                      │
│  1. Loop through product.images      │
│  2. Find image with alt="frame"      │
│  3. Set custom_frame_url             │
│  4. Set product_image_url            │
└──────┬───────────────────────────────┘
       │
       │ Data Attributes
       ↓
┌──────────────────────────────────────┐
│         React Frontend               │
│                                      │
│  1. Get product image URL            │
│  2. Set as background (Layer 1)      │
│  3. Check for custom frame           │
│     - If alt="frame" exists          │
│     - Display as Layer 3             │
│  4. Generate auto frame (Layer 4)    │
│     - Currently: Backend API         │
│     - Uses canvas processing         │
│  5. User adds designs (Layer 2)      │
│  6. Display all layers stacked       │
└──────────────────────────────────────┘
```

---

## Key Points About Current System

### ✅ What Works Well:
1. **Dynamic**: Works with any Shopify product
2. **Flexible**: Supports custom frames via alt="frame"
3. **Auto-generation**: Creates frame from product image
4. **Variant switching**: Instant updates
5. **Smart detection**: Automatically finds frame images

### ❌ Current Limitations:
1. **Auto-frame quality**: Backend canvas generation is basic
2. **No transparency control**: Can't precisely cut camera holes
3. **Limited image processing**: Canvas API has limits
4. **No phone boundary detection**: Can't auto-detect phone edges
5. **Custom frame dependency**: Requires manual upload with alt tag

---

## The Frame Detection System

### How alt="frame" Works:

1. **In Shopify Admin**:
   - Store owner uploads product images
   - One image gets alt text set to "frame"
   - This image should be transparent PNG with cutouts

2. **In Liquid Template**:
   ```liquid
   {% for image in product.images %}
     {% if image.alt | downcase == 'frame' %}
       {% assign custom_frame_url = image.url %}
     {% endif %}
   {% endfor %}
   ```

3. **In CSS**:
   ```css
   img[alt="frame" i] {
     display: none !important; /* Hide from product page */
   }
   ```

4. **In React**:
   ```javascript
   {hasCustomFrame && customFrameUrl && (
     <div className="phone-case-frame custom-frame">
       <img src={customFrameUrl} alt="Custom phone case frame" />
     </div>
   )}
   ```

### Why This System Exists:

- **Flexibility**: Store owner can provide perfect frame if they have it
- **Fallback**: Auto-generation works if no custom frame exists
- **Both layers**: Can use both custom + auto-generated together
- **Easy management**: Just set alt tag in Shopify admin

---

## Where Product Images Come From

### In Liquid Template:
```liquid
{% if product.images[0] %}
  {% assign product_image_url = product.images[0] | image_url: width: 600 %}
{% endif %}
```

### In React:
```javascript
const productImageUrl = rootElement?.dataset?.productImageUrl || ''
```

### Result:
- URL like: `https://cdn.shopify.com/s/files/1/0123/4567/products/phone-case.jpg?width=600`
- This URL changes when user selects different variant
- No local storage - always fetched from Shopify CDN

---

## The Problem We're Solving

### Current Situation:
```
Product Image (solid) → Browser tries to make frame → Not great quality
```

### What We Want:
```
Product Image (solid) → Python script (phoneLayer) → Perfect frame with cutouts
```

### Why Python Script is Better:
1. **OpenCV**: Professional image processing library
2. **Edge Detection**: Accurately finds phone boundaries
3. **Transparency Control**: Precise camera cutout placement
4. **Scaling**: Handles different phone sizes automatically
5. **Quality**: Much better results than browser canvas

---

## Example Scenario

### Current System:
1. User selects "iPhone 15 Pro Red"
2. Shopify provides: `red-iphone-case.jpg` (solid image)
3. Browser tries to generate frame
4. Result: Basic outline, camera cutout might be off

### With phoneLayer Integration:
1. User selects "iPhone 15 Pro Red"
2. Shopify provides: `red-iphone-case.jpg` (solid image)
3. Backend calls Python script
4. Python detects phone edges, applies reference transparency
5. Result: Perfect frame with accurate camera cutouts

---

## Why We Need Runtime Processing

### Can't Pre-Process Because:
1. **Unknown products**: Store owner can add new products anytime
2. **Variant images**: Each variant might have different image
3. **Image updates**: Store owner can change product photos
4. **No local access**: Images are on Shopify CDN, not our server

### Must Process at Runtime:
1. User selects variant
2. Get product image URL from Shopify
3. Process it on-demand
4. Cache result for future requests
5. Return processed frame to frontend

---

## Summary in One Sentence

**Current**: Browser gets product image from Shopify and tries to make a frame using basic JavaScript.

**Goal**: Backend gets product image from Shopify, uses Python to create professional frame with accurate transparency, caches it, and sends to frontend.

---

## Questions This Raises

1. **Where to run Python?** → On our Node.js server (Render.com)
2. **How to handle slow processing?** → Cache results in database
3. **What if image changes?** → Cache key based on image URL
4. **How to show loading?** → Loading state while processing first time
5. **What about costs?** → Only process each unique image once

---

## Next: Understanding the Integration

Now that you understand the current setup, the integration plan makes more sense:

- We keep the same 4-layer structure
- We keep getting images from Shopify dynamically
- We just replace the "browser frame generation" with "Python API frame generation"
- Everything else stays the same

Does this make sense? Any questions about the current setup before we discuss the integration details?
