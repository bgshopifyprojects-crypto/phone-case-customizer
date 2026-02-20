# Migration Plan: Old System → New System

## Overview

**Goal**: Replace alt="frame" detection and basic canvas generation with Python-based automatic detection and professional frame generation.

**Timeline**: 4-6 weeks

**Risk Level**: Low (backward compatible, graceful degradation)

---

## Current System vs New System

### Current System:
```
1. Liquid template checks for alt="frame"
2. If found: Use as Layer 3 (custom frame)
3. Backend API generates Layer 4 (auto frame) using canvas
4. Both layers displayed
```

### New System:
```
1. Backend API scans all product images (find_transparent.py)
2. If transparent image found: Use as reference
3. Backend API generates frame (apply_phone_mask.py) using Python
4. One frame layer displayed (or none if no transparent image)
```

---

## Migration Phases

### Phase 1: Preparation (Week 1)
**Goal**: Set up Python environment and test scripts

#### Tasks:
1. ✅ Set up Python on Render.com
2. ✅ Install dependencies (opencv-python, numpy)
3. ✅ Test Python scripts locally
4. ✅ Create test suite
5. ✅ Document API contracts

#### Deliverables:
- Python environment ready
- Scripts tested and working
- API documentation complete

---

### Phase 2: Backend API Development (Week 2-3)
**Goal**: Create new API endpoints without breaking existing system

#### Tasks:

**2.1: Database Schema**
```prisma
// Add to prisma/schema.prisma
model ProductFrameCache {
  id                  String   @id @default(cuid())
  productId           String   @unique
  shop                String
  
  // Frame detection (find_transparent.py)
  hasTransparentFrame Boolean  @default(false)
  frameImageUrl       String?  @db.Text
  transparencyPercent Float?
  
  // Frame generation (apply_phone_mask.py)
  generatedFrameUrl   String?  @db.Text
  processingStatus    String   @default("pending") // pending, processing, completed, failed
  errorMessage        String?
  
  // Metadata
  productImageUrls    String   @db.Text // JSON array
  frameDetectedAt     DateTime?
  frameGeneratedAt    DateTime?
  lastCheckedAt       DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([productId])
  @@index([shop])
  @@index([hasTransparentFrame])
  @@index([processingStatus])
}
```

**2.2: Create API Endpoints**

File: `app/routes/api.detect-frame.tsx`
```typescript
import { json } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const execAsync = promisify(exec);

export async function action({ request }) {
  const { productId, imageUrls } = await request.json();
  
  // Check cache first
  const cached = await db.productFrameCache.findUnique({
    where: { productId }
  });
  
  if (cached && cached.frameDetectedAt) {
    return json({
      found: cached.hasTransparentFrame,
      frameImageUrl: cached.frameImageUrl,
      transparencyPercent: cached.transparencyPercent,
      cached: true
    });
  }
  
  // Download images to temp directory
  const tempDir = join(process.cwd(), 'tmp', 'frame-detection');
  await mkdir(tempDir, { recursive: true });
  
  // Download all images
  for (const url of imageUrls) {
    const filename = crypto.createHash('md5').update(url).digest('hex') + '.png';
    const filepath = join(tempDir, filename);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
  }
  
  // Run find_transparent.py
  const pythonScript = join(process.cwd(), '../phoneLayer/find_transparent.py');
  const { stdout } = await execAsync(`python "${pythonScript}" "${tempDir}" -t 25`);
  
  // Parse output
  const lines = stdout.split('\n');
  const results = [];
  for (const line of lines) {
    const match = line.match(/(.+): ([\d.]+)%/);
    if (match) {
      results.push({
        filename: match[1],
        percent: parseFloat(match[2])
      });
    }
  }
  
  // Get highest transparency image
  const bestMatch = results.sort((a, b) => b.percent - a.percent)[0];
  
  // Find original URL
  let frameImageUrl = null;
  if (bestMatch) {
    const hash = bestMatch.filename.replace('.png', '');
    frameImageUrl = imageUrls.find(url => 
      crypto.createHash('md5').update(url).digest('hex') === hash
    );
  }
  
  // Save to cache
  await db.productFrameCache.upsert({
    where: { productId },
    create: {
      productId,
      shop: request.headers.get('shopify-shop'),
      hasTransparentFrame: !!bestMatch,
      frameImageUrl,
      transparencyPercent: bestMatch?.percent || 0,
      productImageUrls: JSON.stringify(imageUrls),
      frameDetectedAt: new Date()
    },
    update: {
      hasTransparentFrame: !!bestMatch,
      frameImageUrl,
      transparencyPercent: bestMatch?.percent || 0,
      frameDetectedAt: new Date()
    }
  });
  
  // Cleanup temp files
  await rm(tempDir, { recursive: true });
  
  return json({
    found: !!bestMatch,
    frameImageUrl,
    transparencyPercent: bestMatch?.percent || 0,
    cached: false
  });
}
```

File: `app/routes/api.generate-frame.tsx`
```typescript
export async function action({ request }) {
  const { productId, referenceFrameUrl, targetImageUrl } = await request.json();
  
  // Check cache
  const cached = await db.productFrameCache.findUnique({
    where: { productId }
  });
  
  if (cached?.generatedFrameUrl && cached.frameGeneratedAt) {
    return json({
      frameUrl: cached.generatedFrameUrl,
      cached: true
    });
  }
  
  // Update status to processing
  await db.productFrameCache.update({
    where: { productId },
    data: { processingStatus: 'processing' }
  });
  
  try {
    const tempDir = join(process.cwd(), 'tmp', 'frame-generation');
    await mkdir(tempDir, { recursive: true });
    
    // Download reference frame (if provided)
    let referencePath;
    if (referenceFrameUrl) {
      referencePath = join(tempDir, 'reference.png');
      const refResponse = await fetch(referenceFrameUrl);
      const refBuffer = await refResponse.arrayBuffer();
      await writeFile(referencePath, Buffer.from(refBuffer));
    } else {
      // Use default reference
      referencePath = join(process.cwd(), 'public', 'default-frame.png');
    }
    
    // Download target image
    const targetPath = join(tempDir, 'target.png');
    const targetResponse = await fetch(targetImageUrl);
    const targetBuffer = await targetResponse.arrayBuffer();
    await writeFile(targetPath, Buffer.from(targetBuffer));
    
    // Run apply_phone_mask.py
    const pythonScript = join(process.cwd(), '../phoneLayer/apply_phone_mask.py');
    await execAsync(`python "${pythonScript}" "${referencePath}" "${targetPath}"`);
    
    // Read generated frame
    const outputPath = join(tempDir, 'target_layer.png');
    const frameBuffer = await readFile(outputPath);
    const base64Frame = frameBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Frame}`;
    
    // Save to cache
    await db.productFrameCache.update({
      where: { productId },
      data: {
        generatedFrameUrl: dataUrl,
        processingStatus: 'completed',
        frameGeneratedAt: new Date()
      }
    });
    
    // Cleanup
    await rm(tempDir, { recursive: true });
    
    return json({
      frameUrl: dataUrl,
      cached: false
    });
  } catch (error) {
    // Save error
    await db.productFrameCache.update({
      where: { productId },
      data: {
        processingStatus: 'failed',
        errorMessage: error.message
      }
    });
    
    throw error;
  }
}
```

**2.3: Run Database Migration**
```bash
cd phone-case-customizer
npx prisma migrate dev --name add_frame_cache
npx prisma generate
```

#### Deliverables:
- Database schema updated
- API endpoints created
- Python scripts integrated
- Error handling implemented

---

### Phase 3: Frontend Integration (Week 3-4)
**Goal**: Update frontend to use new APIs while maintaining backward compatibility

#### Tasks:

**3.1: Update Frame Loading Logic**

File: `phone-case-customizer/phone-case-customizer/src/App.jsx`

```javascript
// Replace current auto-frame generation
useEffect(() => {
  async function loadFrame() {
    if (!productImageUrl) {
      setAutoGeneratedFrameUrl(null);
      setIsFrameLoading(false);
      return;
    }
    
    // Check cache first
    if (frameCache.current[productImageUrl]) {
      setAutoGeneratedFrameUrl(frameCache.current[productImageUrl]);
      setIsFrameLoading(false);
      return;
    }
    
    setIsFrameLoading(true);
    
    try {
      // Step 1: Detect transparent frame
      const detectResponse = await fetch('/api/detect-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentVariantId,
          imageUrls: [productImageUrl] // Add all product images here
        })
      });
      
      const detectData = await detectResponse.json();
      console.log('Frame detection:', detectData);
      
      // Step 2: Generate frame (if transparent image found, use as reference)
      const generateResponse = await fetch('/api/generate-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentVariantId,
          referenceFrameUrl: detectData.frameImageUrl, // null if not found
          targetImageUrl: productImageUrl
        })
      });
      
      const generateData = await generateResponse.json();
      console.log('Frame generation:', generateData);
      
      // Cache and display
      if (generateData.frameUrl) {
        frameCache.current[productImageUrl] = generateData.frameUrl;
        setAutoGeneratedFrameUrl(generateData.frameUrl);
      } else {
        // No frame available - customizer works without it
        setAutoGeneratedFrameUrl(null);
      }
    } catch (error) {
      console.error('Frame processing error:', error);
      // Graceful degradation - customizer works without frame
      setAutoGeneratedFrameUrl(null);
    } finally {
      setIsFrameLoading(false);
    }
  }
  
  loadFrame();
}, [productImageUrl, currentVariantId]);
```

**3.2: Update Liquid Template**

File: `extensions/phone-case-customizer/blocks/phone-case-customizer.liquid`

```liquid
{% comment %}
  OLD: Check for alt="frame"
  NEW: Backend will detect transparent images automatically
{% endcomment %}

{% comment %} Remove this block:
{% for image in product.images %}
  {% assign alt_lower = image.alt | downcase %}
  {% if alt_lower == 'frame' %}
    {% assign custom_frame_url = image | image_url: width: 600 %}
    {% assign has_custom_frame = true %}
    {% break %}
  {% endif %}
{% endfor %}
{% endcomment %}

{% comment %} Collect all product images for backend processing {% endcomment %}
{% assign product_image_urls = '' %}
{% for image in product.images %}
  {% assign image_url = image | image_url: width: 600 %}
  {% if forloop.first %}
    {% assign product_image_urls = image_url %}
  {% else %}
    {% assign product_image_urls = product_image_urls | append: ',' | append: image_url %}
  {% endif %}
{% endfor %}

<div id="phone-case-root" 
     data-phone-case-url="{{ background_url }}"
     data-product-image-url="{{ product_image_url }}"
     data-product-image-urls="{{ product_image_urls }}"
     data-variant-id="{{ product.selected_or_first_available_variant.id }}"
     ...
></div>
```

#### Deliverables:
- Frontend updated to use new APIs
- Backward compatibility maintained
- Graceful degradation implemented

---

### Phase 4: Testing (Week 4-5)
**Goal**: Comprehensive testing before production deployment

#### Test Cases:

**4.1: Products with alt="frame" (Backward Compatibility)**
```
Input: Product with image alt="frame"
Expected: 
  - Old system: Uses alt="frame" image
  - New system: Detects transparent image, generates frame
Result: Should work with both systems
```

**4.2: Products with Transparent Image (No alt tag)**
```
Input: Product with transparent PNG (no alt tag)
Expected:
  - Old system: No frame detected
  - New system: Detects transparent image, generates frame
Result: New system provides better experience
```

**4.3: Products without Transparent Image**
```
Input: Product with only solid images
Expected:
  - Old system: Basic canvas frame
  - New system: No frame layer, customizer still works
Result: Both work, new system is cleaner
```

**4.4: Variant Switching**
```
Input: Switch between variants
Expected:
  - Frame updates correctly
  - No flickering
  - Cached frames load instantly
Result: Smooth experience
```

**4.5: Performance Testing**
```
Test: First load vs cached load
Expected:
  - First load: 2-5 seconds (processing)
  - Cached load: <100ms (database lookup)
Result: Acceptable performance
```

#### Deliverables:
- All test cases passing
- Performance benchmarks met
- Bug fixes completed

---

### Phase 5: Deployment (Week 5)
**Goal**: Deploy to production with rollback plan

#### Deployment Steps:

**5.1: Staging Deployment**
```bash
# 1. Deploy to staging
git checkout -b feature/python-frame-generation
git push origin feature/python-frame-generation

# 2. Deploy to Render staging
# (Render auto-deploys from branch)

# 3. Test on staging
# - Test with real products
# - Test variant switching
# - Test performance
```

**5.2: Production Deployment**
```bash
# 1. Merge to main
git checkout main
git merge feature/python-frame-generation
git push origin main

# 2. Render auto-deploys to production

# 3. Monitor logs
# - Check for Python errors
# - Monitor API response times
# - Watch error rates
```

**5.3: Rollback Plan**
```bash
# If issues occur:
git revert HEAD
git push origin main

# Render will auto-deploy previous version
```

#### Deliverables:
- Production deployment successful
- Monitoring in place
- Rollback plan tested

---

### Phase 6: Monitoring & Optimization (Week 6+)
**Goal**: Monitor performance and optimize

#### Monitoring:

**6.1: Metrics to Track**
```
- Frame detection rate (% of products with transparent images)
- Frame generation success rate
- Average processing time
- Cache hit rate
- Error rate
- User engagement (with vs without frames)
```

**6.2: Optimization Opportunities**
```
- CDN upload for generated frames
- Background processing queue
- Batch processing for existing products
- Admin panel for manual override
```

#### Deliverables:
- Monitoring dashboard
- Performance reports
- Optimization roadmap

---

## Backward Compatibility Strategy

### During Migration:

**Keep Both Systems Running**
```javascript
// Feature flag
const USE_NEW_FRAME_SYSTEM = process.env.USE_NEW_FRAME_SYSTEM === 'true';

if (USE_NEW_FRAME_SYSTEM) {
  // New Python-based system
  await detectAndGenerateFrame();
} else {
  // Old canvas-based system
  await generateFrameOldWay();
}
```

### After Migration:

**Gradual Rollout**
```
Week 1: 10% of traffic → new system
Week 2: 25% of traffic → new system
Week 3: 50% of traffic → new system
Week 4: 100% of traffic → new system
```

---

## Risk Mitigation

### Risk 1: Python Processing Slow
**Mitigation**: 
- Cache aggressively
- Process in background
- Show loading state

### Risk 2: Python Script Fails
**Mitigation**:
- Graceful degradation (no frame)
- Error logging
- Fallback to old system

### Risk 3: High Server Load
**Mitigation**:
- Rate limiting
- Queue system
- CDN for processed images

### Risk 4: Breaking Existing Products
**Mitigation**:
- Backward compatibility
- Feature flag
- Gradual rollout

---

## Success Criteria

✅ All existing products continue to work
✅ New products automatically detect frames
✅ Frame generation quality improved
✅ No increase in error rate
✅ Performance acceptable (<5s first load, <100ms cached)
✅ Store owners satisfied with results

---

## Timeline Summary

```
Week 1: Preparation & Setup
Week 2-3: Backend Development
Week 3-4: Frontend Integration
Week 4-5: Testing
Week 5: Deployment
Week 6+: Monitoring & Optimization
```

**Total: 4-6 weeks**

---

## Next Steps

1. Review and approve migration plan
2. Set up Python environment on Render
3. Create feature branch
4. Start Phase 1 (Preparation)

Ready to proceed?
