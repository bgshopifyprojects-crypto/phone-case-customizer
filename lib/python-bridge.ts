import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

// Detect the correct Python command for the platform
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

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
      `${PYTHON_CMD} "${pythonScript}" "${tempDir}" -t ${threshold}`
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
      `${PYTHON_CMD} "${pythonScript}" "${referencePath}" "${targetPath}" -t ${tolerance}`
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
    await execAsync(`${PYTHON_CMD} --version`);
    
    // Check OpenCV
    await execAsync(`${PYTHON_CMD} -c "import cv2; print(cv2.__version__)"`);
    
    // Check NumPy
    await execAsync(`${PYTHON_CMD} -c "import numpy; print(numpy.__version__)"`);
    
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
