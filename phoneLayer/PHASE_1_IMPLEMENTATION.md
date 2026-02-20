# Phase 1: Preparation & Setup

## Goal
Set up Python environment and prepare for integration

## Timeline
Week 1 (5-7 days)

---

## Task 1.1: Move phoneLayer to Project Directory

### Current Structure:
```
C:\Users\erhan\Desktop\shopify\
  ├── phoneLayer/              ← Separate directory
  └── phone-case-customizer/   ← Main project
```

### Target Structure:
```
phone-case-customizer/
  ├── phoneLayer/              ← Move here
  │   ├── apply_phone_mask.py
  │   ├── find_transparent.py
  │   ├── requirements.txt
  │   └── tests/
  ├── app/
  ├── prisma/
  └── ...
```

### Steps:
```bash
# 1. Copy phoneLayer into project
cd C:\Users\erhan\Desktop\shopify\phone-case-customizer
xcopy /E /I ..\phoneLayer phoneLayer

# 2. Verify files copied
dir phoneLayer

# 3. Test scripts still work
cd phoneLayer
python find_transparent.py tests/test_find_transparents
python apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png
```

---

## Task 1.2: Update Render Configuration

### Option A: Using Dockerfile (Recommended)

Create `phone-case-customizer/Dockerfile`:

```dockerfile
# Use Node.js base image
FROM node:20-bullseye

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install Node dependencies
RUN npm ci

# Copy phoneLayer and install Python dependencies
COPY phoneLayer ./phoneLayer/
RUN pip3 install -r phoneLayer/requirements.txt

# Copy rest of application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build frontend
WORKDIR /app/phone-case-customizer
RUN npm ci && npm run build

# Back to root
WORKDIR /app

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Option B: Using render.yaml

Create `phone-case-customizer/render.yaml`:

```yaml
services:
  - type: web
    name: phone-case-customizer
    env: node
    region: oregon
    plan: starter
    buildCommand: |
      # Install Python
      apt-get update
      apt-get install -y python3 python3-pip libgl1-mesa-glx libglib2.0-0
      
      # Install Python dependencies
      pip3 install -r phoneLayer/requirements.txt
      
      # Install Node dependencies
      npm ci
      
      # Generate Prisma client
      npx prisma generate
      
      # Build frontend
      cd phone-case-customizer && npm ci && npm run build && cd ..
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: phone-case-db
          property: connectionString
```

---

## Task 1.3: Create Python Wrapper Module

Create `phone-case-customizer/lib/python-bridge.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

export interface TransparentImage {
  filename: string;
  url: string;
  transparencyPercent: number;
}

export interface FrameGenerationResult {
  frameUrl: string;
  debugUrl?: string;
}

/**
 * Find transparent images in a list of URLs
 */
export async function findTransparentImages(
  imageUrls: string[],
  threshold: number = 25
): Promise<TransparentImage[]> {
  const tempDir = join(process.cwd(), 'tmp', 'frame-detection', crypto.randomUUID());
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });
    
    // Download all images
    const downloadedFiles: { url: string; path: string; hash: string }[] = [];
    
    for (const url of imageUrls) {
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const filename = `${hash}.png`;
      const filepath = join(tempDir, filename);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to download ${url}: ${response.statusText}`);
          continue;
        }
        
        const buffer = await response.arrayBuffer();
        await writeFile(filepath, Buffer.from(buffer));
        
        downloadedFiles.push({ url, path: filepath, hash });
      } catch (error) {
        console.error(`Error downloading ${url}:`, error);
      }
    }
    
    if (downloadedFiles.length === 0) {
      return [];
    }
    
    // Run find_transparent.py
    const pythonScript = join(process.cwd(), 'phoneLayer', 'find_transparent.py');
    const { stdout } = await execAsync(
      `python3 "${pythonScript}" "${tempDir}" -t ${threshold}`
    );
    
    // Parse output
    const results: TransparentImage[] = [];
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(.+\.png): ([\d.]+)%/);
      if (match) {
        const filename = match[1];
        const percent = parseFloat(match[2]);
        const hash = filename.replace('.png', '');
        
        // Find original URL
        const file = downloadedFiles.find(f => f.hash === hash);
        if (file) {
          results.push({
            filename,
            url: file.url,
            transparencyPercent: percent
          });
        }
      }
    }
    
    // Sort by transparency (highest first)
    results.sort((a, b) => b.transparencyPercent - a.transparencyPercent);
    
    return results;
  } finally {
    // Cleanup temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }
}

/**
 * Generate frame using apply_phone_mask.py
 */
export async function generateFrame(
  referenceImageUrl: string,
  targetImageUrl: string,
  tolerance: number = 30
): Promise<FrameGenerationResult> {
  const tempDir = join(process.cwd(), 'tmp', 'frame-generation', crypto.randomUUID());
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });
    
    // Download reference image
    const referencePath = join(tempDir, 'reference.png');
    const refResponse = await fetch(referenceImageUrl);
    if (!refResponse.ok) {
      throw new Error(`Failed to download reference image: ${refResponse.statusText}`);
    }
    const refBuffer = await refResponse.arrayBuffer();
    await writeFile(referencePath, Buffer.from(refBuffer));
    
    // Download target image
    const targetPath = join(tempDir, 'target.png');
    const targetResponse = await fetch(targetImageUrl);
    if (!targetResponse.ok) {
      throw new Error(`Failed to download target image: ${targetResponse.statusText}`);
    }
    const targetBuffer = await targetResponse.arrayBuffer();
    await writeFile(targetPath, Buffer.from(targetBuffer));
    
    // Run apply_phone_mask.py
    const pythonScript = join(process.cwd(), 'phoneLayer', 'apply_phone_mask.py');
    await execAsync(
      `python3 "${pythonScript}" "${referencePath}" "${targetPath}" -t ${tolerance}`
    );
    
    // Read generated frame
    const outputPath = join(tempDir, 'target_layer.png');
    const frameBuffer = await readFile(outputPath);
    const base64Frame = frameBuffer.toString('base64');
    const frameDataUrl = `data:image/png;base64,${base64Frame}`;
    
    // Read debug image (optional)
    let debugDataUrl: string | undefined;
    try {
      const debugPath = join(tempDir, 'target_debug.png');
      const debugBuffer = await readFile(debugPath);
      const base64Debug = debugBuffer.toString('base64');
      debugDataUrl = `data:image/png;base64,${base64Debug}`;
    } catch (error) {
      // Debug image is optional
    }
    
    return {
      frameUrl: frameDataUrl,
      debugUrl: debugDataUrl
    };
  } finally {
    // Cleanup temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }
}

/**
 * Test Python environment
 */
export async function testPythonEnvironment(): Promise<{
  pythonAvailable: boolean;
  opencvAvailable: boolean;
  numpyAvailable: boolean;
  scriptsAvailable: boolean;
  error?: string;
}> {
  try {
    // Check Python
    await execAsync('python3 --version');
    
    // Check OpenCV
    await execAsync('python3 -c "import cv2; print(cv2.__version__)"');
    
    // Check NumPy
    await execAsync('python3 -c "import numpy; print(numpy.__version__)"');
    
    // Check scripts exist
    const findScript = join(process.cwd(), 'phoneLayer', 'find_transparent.py');
    const applyScript = join(process.cwd(), 'phoneLayer', 'apply_phone_mask.py');
    await readFile(findScript);
    await readFile(applyScript);
    
    return {
      pythonAvailable: true,
      opencvAvailable: true,
      numpyAvailable: true,
      scriptsAvailable: true
    };
  } catch (error) {
    return {
      pythonAvailable: false,
      opencvAvailable: false,
      numpyAvailable: false,
      scriptsAvailable: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

---

## Task 1.4: Create Test Endpoint

Create `phone-case-customizer/app/routes/api.test-python.tsx`:

```typescript
import { json } from "@remix-run/node";
import { testPythonEnvironment, findTransparentImages, generateFrame } from "~/lib/python-bridge";

export async function loader() {
  try {
    // Test Python environment
    const envTest = await testPythonEnvironment();
    
    if (!envTest.pythonAvailable) {
      return json({
        success: false,
        error: 'Python environment not available',
        details: envTest
      }, { status: 500 });
    }
    
    // Test with sample images (if available)
    const testImageUrls = [
      'https://cdn.shopify.com/s/files/1/0000/0000/products/test.png'
    ];
    
    return json({
      success: true,
      environment: envTest,
      message: 'Python environment is ready'
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
```

---

## Task 1.5: Update package.json

Add test scripts to `phone-case-customizer/package.json`:

```json
{
  "scripts": {
    "test:python": "node -e \"require('./lib/python-bridge').testPythonEnvironment().then(console.log)\"",
    "test:python:local": "cd phoneLayer && python find_transparent.py tests/test_find_transparents && python apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png"
  }
}
```

---

## Task 1.6: Local Testing

### Test Python Scripts Locally:

```bash
# 1. Navigate to project
cd C:\Users\erhan\Desktop\shopify\phone-case-customizer

# 2. Test find_transparent.py
cd phoneLayer
python find_transparent.py tests/test_find_transparents

# Expected output:
# Images with transparency > 25.0%:
# 
# 2-1_4a83603b-e076-4da0-9d4c-838f818e817d.png: 60.40%
# samsung-s24-sari-kilif-cerceve.webp: 60.37%
# 2-1_8ad3af95-2778-41db-ab9a-3aaf366b438d.png: 58.73%

# 3. Test apply_phone_mask.py
python apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png

# Expected output:
# Reference image: 600x1000
# Target image: 600x1000
# Detecting phone boundaries...
# Reference phone bbox: BoundingBox(...)
# Target phone bbox: BoundingBox(...)
# Scaling mask to fit target...
# Output saved to: tests/tests_apply_mask0\target_layer.png
# Debug visualization saved to: tests/tests_apply_mask0\target_debug.png

# 4. Verify output files created
dir tests\tests_apply_mask0\target_layer.png
dir tests\tests_apply_mask0\target_debug.png
```

---

## Task 1.7: Documentation

Create `phone-case-customizer/phoneLayer/README.md`:

```markdown
# PhoneLayer Integration

Python scripts for automatic frame detection and generation.

## Requirements

- Python 3.8+
- opencv-python >= 4.8.0
- numpy >= 1.24.0

## Installation

```bash
pip install -r requirements.txt
```

## Scripts

### find_transparent.py
Detects transparent images in a folder.

```bash
python find_transparent.py <folder> [-t threshold]
```

### apply_phone_mask.py
Applies transparency mask from reference to target image.

```bash
python apply_phone_mask.py <reference> <target> [-t tolerance]
```

## Integration

See `../lib/python-bridge.ts` for Node.js integration.

## Testing

```bash
# Test find_transparent.py
python find_transparent.py tests/test_find_transparents

# Test apply_phone_mask.py
python apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png
```
```

---

## Checklist

- [ ] Move phoneLayer to project directory
- [ ] Create Dockerfile or render.yaml
- [ ] Create python-bridge.ts wrapper
- [ ] Create test endpoint
- [ ] Update package.json with test scripts
- [ ] Test Python scripts locally
- [ ] Create documentation
- [ ] Commit changes to git

---

## Expected Deliverables

1. ✅ phoneLayer integrated into project
2. ✅ Python environment configured for Render
3. ✅ TypeScript wrapper for Python scripts
4. ✅ Test endpoint created
5. ✅ Local tests passing
6. ✅ Documentation complete

---

## Next Steps

After Phase 1 completion:
- Proceed to Phase 2 (Backend API Development)
- Create database schema
- Implement API endpoints
