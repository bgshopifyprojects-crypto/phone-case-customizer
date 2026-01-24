import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * Public route to serve empty phone case images
 * GET /design-image/:designId/empty
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
      select: { emptyCaseUrl: true },
    });
    
    if (!design || !design.emptyCaseUrl) {
      return new Response('Empty case image not found', { status: 404 });
    }
    
    // Extract base64 data from data URL
    if (!design.emptyCaseUrl.startsWith('data:image/png;base64,')) {
      return new Response('Invalid image format', { status: 500 });
    }
    
    const base64Data = design.emptyCaseUrl.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Return image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="image1.png"',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error serving empty case image:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
