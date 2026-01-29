import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * Public route to serve individual element images
 * GET /design-image/:designId/element/:index
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { designId, index } = params;
    
    if (!designId || index === undefined) {
      return new Response('Design ID and index required', { status: 400 });
    }
    
    const elementIndex = parseInt(index, 10);
    if (isNaN(elementIndex) || elementIndex < 0) {
      return new Response('Invalid element index', { status: 400 });
    }
    
    // Get design from database
    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { elementImages: true },
    });
    
    if (!design) {
      return new Response('Design not found', { status: 404 });
    }
    
    if (!design.elementImages) {
      return new Response('No element images found', { status: 404 });
    }
    
    // Parse element images JSON
    let elementDataUrls: string[];
    try {
      elementDataUrls = JSON.parse(design.elementImages);
    } catch (error) {
      return new Response('Invalid element images data', { status: 500 });
    }
    
    // Check if index is valid
    if (elementIndex >= elementDataUrls.length) {
      return new Response('Element index out of range', { status: 404 });
    }
    
    const elementDataUrl = elementDataUrls[elementIndex];
    
    // Extract base64 data from data URL
    if (!elementDataUrl.startsWith('data:image/png;base64,')) {
      return new Response('Invalid image format', { status: 500 });
    }
    
    const base64Data = elementDataUrl.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Return image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="element-${elementIndex}.png"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error serving element image:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
