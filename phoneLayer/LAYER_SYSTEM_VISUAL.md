# Visual Layer System - Complete Breakdown

## The 4-Layer Stack (Top to Bottom)

```
╔═══════════════════════════════════════════════════════════╗
║  LAYER 4: AUTO-GENERATED FRAME (Always Present)          ║
║  ─────────────────────────────────────────────────────    ║
║  Source: Generated from product image                     ║
║  Method: Backend API → Canvas processing (current)        ║
║  Purpose: Phone outline, camera cutouts                   ║
║  Z-Index: 100                                             ║
║  Status: THIS IS WHAT WE WANT TO IMPROVE WITH PYTHON!     ║
╚═══════════════════════════════════════════════════════════╝
                          ↓ (stacked on top)
╔═══════════════════════════════════════════════════════════╗
║  LAYER 3: CUSTOM FRAME (Optional)                         ║
║  ─────────────────────────────────────────────────────    ║
║  Source: Product image with alt="frame"                   ║
║  Detection: Liquid template scans product.images          ║
║  Purpose: Store owner's custom transparent overlay        ║
║  Z-Index: 100                                             ║
║  Status: Works well, but requires manual upload           ║
╚═══════════════════════════════════════════════════════════╝
                          ↓ (stacked on top)
╔═══════════════════════════════════════════════════════════╗
║  LAYER 2: USER DESIGNS (Dynamic)                          ║
║  ─────────────────────────────────────────────────────    ║
║  Source: User uploads & text input                        ║
║  Area: 320x640 design space                               ║
║  Purpose: User's custom images and text                   ║
║  Z-Index: 50                                              ║
║  Status: Works perfectly                                  ║
╚═══════════════════════════════════════════════════════════╝
                          ↓ (stacked on top)
╔═══════════════════════════════════════════════════════════╗
║  LAYER 1: BACKGROUND (Base)                               ║
║  ─────────────────────────────────────────────────────    ║
║  Source: Product image from Shopify                       ║
║  Size: 600x1000                                           ║
║  Purpose: The actual phone case photo                     ║
║  Z-Index: 1                                               ║
║  Status: Works perfectly                                  ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Real Example: iPhone 15 Red Case

### Product Setup in Shopify:

```
Product: "iPhone 15 Case"
Variant: "Red"

Images:
  1. red-phone-case.jpg (600x1000) ← Main product photo
  2. frame-overlay.png (600x1000, alt="frame") ← Custom frame
  3. lifestyle-photo.jpg ← Other product photo
```

### What Happens:

```
┌─────────────────────────────────────────────────────┐
│ 1. Liquid Template Processes                        │
│    ✓ Finds red-phone-case.jpg → Layer 1            │
│    ✓ Finds frame-overlay.png (alt="frame") → Layer 3│
│    ✓ Passes URLs to React                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. React App Loads                                  │
│    ✓ Sets background: red-phone-case.jpg           │
│    ✓ Displays custom frame: frame-overlay.png      │
│    ✓ Calls API to generate auto frame              │
│    ✓ Waits for user to add designs                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. Backend API (Current)                            │
│    ✓ Receives: red-phone-case.jpg URL              │
│    ✓ Downloads image                                │
│    ✓ Uses canvas to detect edges (basic)           │
│    ✓ Creates frame with transparency                │
│    ✓ Returns base64 or URL                         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. User Sees Final Result                           │
│    Layer 1: Red phone case background               │
│    Layer 2: (empty, waiting for user)               │
│    Layer 3: Custom frame overlay                    │
│    Layer 4: Auto-generated frame                    │
└─────────────────────────────────────────────────────┘
```

---

## The alt="frame" Detection Flow

### Step-by-Step:

```
1. Store Owner in Shopify Admin
   ↓
   Uploads frame-overlay.png
   ↓
   Sets alt text to "frame"
   ↓
   Saves product

2. Customer Views Product Page
   ↓
   Liquid template runs on server
   ↓
   Loops through product.images
   ↓
   Finds image where alt == "frame"
   ↓
   Sets custom_frame_url variable
   ↓
   Passes to React via data attribute

3. React App Receives Data
   ↓
   Reads data-custom-frame-url
   ↓
   Reads data-has-custom-frame="true"
   ↓
   Displays custom frame layer

4. CSS Hides Frame from Product Page
   ↓
   img[alt="frame"] { display: none; }
   ↓
   Frame image doesn't show in gallery
   ↓
   Only used in customizer
```

---

## Current vs Desired State

### CURRENT (Layer 4 - Auto Frame):

```
Product Image (solid)
    ↓
Backend API receives URL
    ↓
Downloads image
    ↓
Canvas processing (JavaScript)
    ↓
Basic edge detection
    ↓
Creates frame (not very accurate)
    ↓
Returns to frontend
```

**Problems:**
- ❌ Edge detection is basic
- ❌ Camera cutouts are approximate
- ❌ Can't handle complex shapes
- ❌ Limited by canvas API

### DESIRED (Layer 4 - Auto Frame with Python):

```
Product Image (solid)
    ↓
Backend API receives URL
    ↓
Downloads image
    ↓
Python script (OpenCV)
    ↓
Professional edge detection
    ↓
Accurate phone boundary detection
    ↓
Precise transparency application
    ↓
Cache result in database
    ↓
Returns to frontend
```

**Benefits:**
- ✅ Professional edge detection
- ✅ Accurate camera cutouts
- ✅ Handles complex shapes
- ✅ Uses reference frame for precision
- ✅ Cached for performance

---

## Integration Strategy Summary

### What Changes:
- **Layer 4 generation**: Replace canvas with Python

### What Stays the Same:
- **Layer 1**: Product image (unchanged)
- **Layer 2**: User designs (unchanged)
- **Layer 3**: Custom frame detection (unchanged)
- **Layer 4 display**: Same React component (unchanged)

### The Only Change:
```
OLD: Backend API → Canvas → Basic frame
NEW: Backend API → Python → Professional frame
```

---

## Why Both Layer 3 AND Layer 4?

### Use Cases:

**Scenario 1: Store owner has perfect frame**
- Layer 3: Custom frame (alt="frame") ✓
- Layer 4: Auto-generated (backup/enhancement) ✓
- Result: Best of both worlds

**Scenario 2: Store owner has no frame**
- Layer 3: None
- Layer 4: Auto-generated (Python) ✓
- Result: Still looks professional

**Scenario 3: New product added**
- Layer 3: None (not uploaded yet)
- Layer 4: Auto-generated immediately ✓
- Result: Works out of the box

### Why Keep Both:
1. **Flexibility**: Store owner can override auto-generation
2. **Fallback**: Auto-generation always works
3. **Quality**: Custom frame can be perfect, auto is good
4. **Speed**: Custom frame is instant, auto is cached
5. **Compatibility**: Existing products keep working

---

## Questions Answered

**Q: Do we need Layer 3 if we have good Layer 4?**
A: Yes! Layer 3 lets store owners provide perfect frames. Layer 4 is the fallback/enhancement.

**Q: Can we use Python for Layer 3 too?**
A: No need. Layer 3 is already perfect (uploaded by store owner).

**Q: What if both layers exist?**
A: Both display! They can complement each other.

**Q: How does Python know what reference frame to use?**
A: We can use Layer 3 (if exists) as reference, or a default reference frame.

**Q: Will this break existing products?**
A: No! We're only improving Layer 4 generation. Everything else stays the same.
