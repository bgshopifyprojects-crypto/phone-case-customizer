import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * Public route to serve design images
 * GET /design-image/:designId
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { designId } = params;
    
    if (!designId) {
      return new Response('Design ID required', { status: 400 });
    }
    
    // Get design from database
    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { imageUrl: true },
    });
    
    if (!design) {
      return new Response('Design not found', { status: 404 });
    }
    
    // Extract base64 data from data URL
    if (!design.imageUrl.startsWith('data:image/png;base64,')) {
      return new Response('Invalid image format', { status: 500 });
    }
    
    const base64Data = design.imageUrl.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Return image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="main.png"',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error serving design image:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
