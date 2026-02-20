# PhoneLayer Integration Plan for phone-case-customizer

## Current Architecture Analysis

### 4-Layer Rendering System:
1. **Layer 1 (Background)**: `phoneCaseUrl` - Product image from Shopify (600x1000)
2. **Layer 2 (Design Area)**: User's custom images and text (320x640 → scaled to 500x1000)
3. **Layer 3 (Custom Frame)**: Optional admin-uploaded frame with transparency
4. **Layer 4 (Auto-Generated Frame)**: Dynamically generated from product image

### Key Findings:
- Product images come from Shopify variants dynamically (`product.images[0]`)
- Images can change when user selects different variants
- No local storage of product images - all fetched at runtime
- Current auto-frame generation uses canvas manipulation (client-side)
- Frame generation is cached per product image URL

---

## Integration Strategy: Runtime API with Caching

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - User selects variant                                      │
│  - Gets product image URL from Shopify                       │
│  - Requests processed frame from backend                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Python)                  │
│                                                              │
│  1. Check cache (database) for processed image              │
│  2. If not cached:                                           │
│     a. Download product image from Shopify CDN              │
│     b. Call Python script (apply_phone_mask.py)             │
│     c. Generate transparency-applied version                │
│     d. Upload to Shopify assets or CDN                      │
│     e. Cache URL in database                                │
│  3. Return processed image URL                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend API Endpoint (Node.js)

**File**: `phone-case-customizer/app/routes/api.process-phone-frame.tsx`

```typescript
import { json } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const execAsync = promisify(exec);

export async function action({ request }) {
  const { productImageUrl, referenceFrameUrl } = await request.json();
  
  // 1. Generate cache key from product image URL
  const cacheKey = crypto.createHash('md5').update(productImageUrl).digest('hex');
  
  // 2. Check database cache
  const cached = await db.frameCache.findUnique({
    where: { cacheKey }
  });
  
  if (cached && cached.processedUrl) {
    return json({ frameUrl: cached.processedUrl, cached: true });
  }
  
  // 3. Download product image
  const tempDir = join(process.cwd(), 'tmp');
  const targetPath = join(tempDir, `target_${cacheKey}.png`);
  const outputPath = join(tempDir, `target_${cacheKey}_layer.png`);
  
  const imageResponse = await fetch(productImageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  await writeFile(targetPath, Buffer.from(imageBuffer));
  
  // 4. Run Python script
  const pythonScript = join(process.cwd(), '../phoneLayer/apply_phone_mask.py');
  const referenceImage = referenceFrameUrl || join(process.cwd(), 'public/default-phone-frame.png');
  
  await execAsync(`python "${pythonScript}" "${referenceImage}" "${targetPath}"`);
  
  // 5. Read processed image
  const processedBuffer = await readFile(outputPath);
  const base64Image = processedBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;
  
  // 6. Cache in database
  await db.frameCache.create({
    data: {
      cacheKey,
      productImageUrl,
      processedUrl: dataUrl,
      createdAt: new Date()
    }
  });
  
  // 7. Cleanup temp files
  await unlink(targetPath);
  await unlink(outputPath);
  
  return json({ frameUrl: dataUrl, cached: false });
}
```

### Phase 2: Database Schema Update

**File**: `phone-case-customizer/prisma/schema.prisma`

```prisma
model FrameCache {
  id               String   @id @default(cuid())
  cacheKey         String   @unique
  productImageUrl  String
  processedUrl     String   @db.Text // Store base64 or CDN URL
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@index([cacheKey])
  @@index([createdAt])
}
```

### Phase 3: Frontend Integration

**File**: `phone-case-customizer/phone-case-customizer/src/App.jsx`

Update the auto-frame generation logic:

```javascript
// Replace current auto-frame generation with API call
useEffect(() => {
  if (productImageUrl) {
    // Check local cache first
    if (frameCache.current[productImageUrl]) {
      setAutoGeneratedFrameUrl(frameCache.current[productImageUrl]);
      setIsFrameLoading(false);
      return;
    }
    
    setIsFrameLoading(true);
    
    // Call backend API
    fetch('/api/process-phone-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productImageUrl,
        referenceFrameUrl: customFrameUrl || null
      })
    })
    .then(res => res.json())
    .then(data => {
      frameCache.current[productImageUrl] = data.frameUrl;
      setAutoGeneratedFrameUrl(data.frameUrl);
      setIsFrameLoading(false);
      console.log('Frame processed:', data.cached ? 'from cache' : 'newly generated');
    })
    .catch(error => {
      console.error('Frame processing failed:', error);
      setIsFrameLoading(false);
    });
  }
}, [productImageUrl, customFrameUrl]);
```

### Phase 4: Python Environment Setup on Render

**File**: `phone-case-customizer/render.yaml` (or Dockerfile)

```yaml
services:
  - type: web
    name: phone-case-customizer
    env: node
    buildCommand: |
      # Install Node dependencies
      npm install
      
      # Install Python and dependencies
      apt-get update
      apt-get install -y python3 python3-pip
      pip3 install -r ../phoneLayer/requirements.txt
      
      # Build frontend
      cd phone-case-customizer && npm run build
    startCommand: npm start
```

Or in Dockerfile:

```dockerfile
FROM node:20

# Install Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy phoneLayer
COPY phoneLayer /app/phoneLayer
RUN pip3 install -r /app/phoneLayer/requirements.txt

# Copy and build app
COPY phone-case-customizer /app
WORKDIR /app
RUN npm install
RUN cd phone-case-customizer && npm run build

CMD ["npm", "start"]
```

---

## Optimization Strategies

### 1. **Caching Layers**
- **Level 1**: In-memory cache (frameCache.current) - instant
- **Level 2**: Database cache - fast (~50ms)
- **Level 3**: Process new image - slow (~2-5 seconds)

### 2. **Background Processing**
- Process frames asynchronously
- Show loading state while processing
- Use placeholder frame during processing

### 3. **CDN Upload (Optional)**
Instead of storing base64 in database:
- Upload processed images to Shopify Files or external CDN
- Store CDN URL in database
- Reduces database size
- Faster delivery

### 4. **Batch Processing**
- Admin panel to pre-process all product images
- Run during off-peak hours
- Reduces runtime processing

---

## Reference Frame Management

### Option A: Single Default Reference
- Store one default phone frame with transparency
- Use for all products
- Simple, fast

### Option B: Per-Product Reference
- Admin can upload custom reference per product
- Store in product metafields
- More flexible, more complex

### Option C: Auto-Detect
- Use `find_transparent.py` to detect if product image already has transparency
- Skip processing if transparency exists
- Fallback to default reference if needed

---

## Migration Path

### Week 1: Setup
1. Add Python to deployment environment
2. Create API endpoint
3. Add database schema
4. Test locally

### Week 2: Integration
1. Update frontend to call API
2. Implement caching
3. Add loading states
4. Test with real product images

### Week 3: Optimization
1. Add CDN upload
2. Implement background processing
3. Create admin panel for batch processing
4. Performance testing

### Week 4: Deployment
1. Deploy to staging
2. Test with production data
3. Monitor performance
4. Deploy to production

---

## Cost Considerations

### Processing Time
- First request per product: 2-5 seconds
- Cached requests: <100ms
- Average: ~500ms (with 80% cache hit rate)

### Storage
- Base64 in database: ~800KB per frame
- CDN storage: ~200KB per frame (PNG compressed)
- 100 products = 20MB (CDN) or 80MB (database)

### Compute
- Python processing: CPU-intensive
- Consider dedicated worker service for high volume
- Render.com: Use at least Standard plan for Python support

---

## Testing Strategy

### Unit Tests
- Test Python script with various image sizes
- Test API endpoint with mock images
- Test caching logic

### Integration Tests
- Test full flow: product image → API → processed frame
- Test variant changes
- Test cache invalidation

### Performance Tests
- Measure processing time
- Test concurrent requests
- Monitor memory usage

---

## Rollback Plan

If issues occur:
1. Feature flag to disable Python processing
2. Fallback to current client-side frame generation
3. Database migration rollback script
4. Keep old code in separate branch

---

## Next Steps

1. **Immediate**: Test Python script with actual Shopify product images
2. **Short-term**: Create API endpoint and test locally
3. **Medium-term**: Deploy to staging with Python support
4. **Long-term**: Optimize with CDN and batch processing

---

## Questions to Answer

1. Do you want to store processed frames as base64 or upload to CDN?
2. Should we support per-product reference frames or use one default?
3. What's your Render.com plan? (Need Python support)
4. Do you want admin panel to pre-process images?
5. Should we implement background job queue for processing?
