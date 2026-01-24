import { createCanvas, loadImage, Canvas } from 'canvas';

export interface DesignImage {
  id: string | number;
  src: string; // base64 data URL
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface DesignText {
  id: string | number;
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
}

export interface DesignLayer {
  id: string | number;
  type: 'image' | 'text';
}

export interface DesignData {
  images: DesignImage[];
  texts: DesignText[];
  layers: DesignLayer[];
}

/**
 * Generate a PNG image from design data
 * @param designData - The design data containing images, texts, and layers
 * @returns PNG buffer at 600x1000 resolution
 */
export async function generateDesignImage(designData: DesignData): Promise<Buffer> {
  // Frontend dimensions (React customizer)
  const frontendWidth = 320;
  const frontendHeight = 640;
  
  // Backend output dimensions
  const finalWidth = 600;
  const finalHeight = 1000;
  
  // Phone screen dimensions: 500x1000 (centered in 600x1000 frame)
  const screenWidth = 500;
  const screenHeight = 1000;
  const screenOffsetX = (finalWidth - screenWidth) / 2; // 50px
  
  // Calculate scale factors to convert frontend coordinates to backend coordinates
  const scaleX = screenWidth / frontendWidth;   // 500 / 320 = 1.5625
  const scaleY = screenHeight / frontendHeight; // 1000 / 640 = 1.5625
  
  // Create canvas for phone screen
  const screenCanvas = createCanvas(screenWidth, screenHeight);
  const screenCtx = screenCanvas.getContext('2d');
  
  // Draw background color
  screenCtx.fillStyle = '#ff8c69';
  screenCtx.fillRect(0, 0, screenWidth, screenHeight);
  
  // Draw layers in order
  for (const layer of designData.layers) {
    if (layer.type === 'image') {
      const img = designData.images.find(i => i.id === layer.id);
      if (img) {
        await drawImage(screenCtx, img, scaleX, scaleY);
      }
    } else if (layer.type === 'text') {
      const text = designData.texts.find(t => t.id === layer.id);
      if (text) {
        drawText(screenCtx, text, scaleX, scaleY);
      }
    }
  }
  
  // Create final canvas with frame
  const finalCanvas = createCanvas(finalWidth, finalHeight);
  const finalCtx = finalCanvas.getContext('2d');
  
  // Draw the screen canvas onto final canvas (centered)
  finalCtx.drawImage(screenCanvas, screenOffsetX, 0);
  
  // TODO: Draw phone frame overlay
  // For now, we'll skip the frame as we don't have the image file accessible
  
  // Return PNG buffer
  return finalCanvas.toBuffer('image/png');
}

/**
 * Draw an image on the canvas with transformations
 */
async function drawImage(ctx: any, img: DesignImage, scaleX: number, scaleY: number): Promise<void> {
  try {
    // Load image from base64 data URL
    const image = await loadImage(img.src);
    
    // Save context state
    ctx.save();
    
    // Scale coordinates from frontend (320x640) to backend (500x1000)
    const scaledX = img.x * scaleX;
    const scaledY = img.y * scaleY;
    
    // Apply transformations
    ctx.translate(scaledX, scaledY);
    ctx.rotate((img.rotation * Math.PI) / 180);
    
    // Scale the image itself (user's scale * coordinate scale)
    const totalScale = img.scale * scaleX; // Use scaleX since it's the same as scaleY
    ctx.scale(totalScale, totalScale);
    
    // Frontend image wrapper is 200x200px, scale to backend dimensions
    const frontendImageSize = 200;
    const backendImageSize = frontendImageSize * scaleX; // 200 * 1.5625 = 312.5px
    
    // Calculate how to fit the actual image into the 200x200 box (object-fit: contain)
    const imageAspect = image.width / image.height;
    let drawWidth = backendImageSize;
    let drawHeight = backendImageSize;
    
    if (imageAspect > 1) {
      // Image is wider than tall
      drawHeight = backendImageSize / imageAspect;
    } else {
      // Image is taller than wide
      drawWidth = backendImageSize * imageAspect;
    }
    
    // Draw image centered at origin (matching frontend behavior)
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    // Restore context state
    ctx.restore();
  } catch (error) {
    console.error('Error drawing image:', error);
    // Continue rendering other elements even if one fails
  }
}

/**
 * Draw text on the canvas with transformations
 */
function drawText(ctx: any, text: DesignText, scaleX: number, scaleY: number): void {
  try {
    // Save context state
    ctx.save();
    
    // Scale coordinates from frontend (320x640) to backend (500x1000)
    const scaledX = text.x * scaleX;
    const scaledY = text.y * scaleY;
    
    // Apply transformations
    ctx.translate(scaledX, scaledY);
    ctx.rotate((text.rotation * Math.PI) / 180);
    
    // Scale the text (user's scale * coordinate scale)
    const totalScale = text.scale * scaleX; // Use scaleX since it's the same as scaleY
    ctx.scale(totalScale, totalScale);
    
    // Set text properties (font size also needs to be scaled)
    const fontStyle = text.fontStyle === 'italic' ? 'italic' : 'normal';
    const fontWeight = text.fontWeight || 'normal';
    const scaledFontSize = text.fontSize; // Font size is already in the scaled context
    ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${text.fontFamily}`;
    ctx.fillStyle = text.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text centered at origin
    ctx.fillText(text.content, 0, 0);
    
    // Restore context state
    ctx.restore();
  } catch (error) {
    console.error('Error drawing text:', error);
    // Continue rendering other elements even if one fails
  }
}


/**
 * Store image in database and return a URL to serve it
 * For now, we'll store base64 and serve via our own route
 * TODO: Implement proper Shopify Files staged upload for production
 * @param imageBuffer - PNG buffer to upload
 * @param shop - Shop domain
 * @param admin - Shopify admin API client
 * @returns URL to serve the image (will be set after database save)
 */
export async function uploadToShopifyFiles(
  imageBuffer: Buffer,
  shop: string,
  admin: any
): Promise<string> {
  try {
    // Convert buffer to base64 for storage
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    // Return the data URL - it will be stored in the database
    // The save-design route will replace this with a public URL
    return dataUrl;
    
  } catch (error) {
    console.error('Error preparing image:', error);
    throw new Error(`Failed to prepare image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

