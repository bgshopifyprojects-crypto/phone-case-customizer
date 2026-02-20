import type { ActionFunctionArgs } from "react-router";
import { findTransparentImages } from "../../lib/python-bridge";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  // Frame detection endpoint for Python-based transparent frame detection
  try {
    const { productId, imageUrls, shop } = await request.json();
    
    if (!productId || !imageUrls || !Array.isArray(imageUrls)) {
      return Response.json({
        success: false,
        error: 'Missing required parameters: productId and imageUrls array'
      }, { status: 400 });
    }
    
    // Check cache first
    const cached = await db.productFrameCache.findUnique({
      where: { productId }
    });
    
    // If cached and checked within last 24 hours, return cached result
    if (cached && cached.frameDetectedAt) {
      const hoursSinceCheck = (Date.now() - cached.frameDetectedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCheck < 24) {
        return Response.json({
          success: true,
          found: cached.hasTransparentFrame,
          frameImageUrl: cached.frameImageUrl,
          transparencyPercent: cached.transparencyPercent,
          cached: true,
          cachedAt: cached.frameDetectedAt
        });
      }
    }
    
    // Run Python script to detect transparent images
    const results = await findTransparentImages(imageUrls, 25);
    
    // Get the image with highest transparency
    const bestMatch = results.length > 0 ? results[0] : null;
    
    // Save to cache
    await db.productFrameCache.upsert({
      where: { productId },
      create: {
        productId,
        shop: shop || 'unknown',
        hasTransparentFrame: !!bestMatch,
        frameImageUrl: bestMatch?.url || null,
        transparencyPercent: bestMatch?.transparencyPercent || 0,
        productImageUrls: JSON.stringify(imageUrls),
        frameDetectedAt: new Date(),
        lastCheckedAt: new Date()
      },
      update: {
        hasTransparentFrame: !!bestMatch,
        frameImageUrl: bestMatch?.url || null,
        transparencyPercent: bestMatch?.transparencyPercent || 0,
        productImageUrls: JSON.stringify(imageUrls),
        frameDetectedAt: new Date(),
        lastCheckedAt: new Date()
      }
    });
    
    return Response.json({
      success: true,
      found: !!bestMatch,
      frameImageUrl: bestMatch?.url || null,
      transparencyPercent: bestMatch?.transparencyPercent || 0,
      allResults: results,
      cached: false
    });
  } catch (error) {
    console.error('Frame detection error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
