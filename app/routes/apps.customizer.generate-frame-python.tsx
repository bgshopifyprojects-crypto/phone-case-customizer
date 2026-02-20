import type { ActionFunctionArgs } from "react-router";
import { generateFrame } from "../../lib/python-bridge";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { productId, referenceFrameUrl, targetImageUrl, tolerance } = await request.json();
    
    if (!productId || !targetImageUrl) {
      return Response.json({
        success: false,
        error: 'Missing required parameters: productId and targetImageUrl'
      }, { status: 400 });
    }
    
    // Check cache first
    const cached = await db.productFrameCache.findUnique({
      where: { productId }
    });
    
    // If frame already generated and cached, return it
    if (cached?.generatedFrameUrl && cached.processingStatus === 'completed') {
      return Response.json({
        success: true,
        frameUrl: cached.generatedFrameUrl,
        cached: true,
        generatedAt: cached.frameGeneratedAt
      });
    }
    
    // If no reference frame URL provided, check if we have one in cache
    let frameReference = referenceFrameUrl;
    if (!frameReference && cached?.frameImageUrl) {
      frameReference = cached.frameImageUrl;
    }
    
    // If still no reference frame, return graceful degradation (no frame)
    if (!frameReference) {
      return Response.json({
        success: true,
        frameUrl: null,
        message: 'No transparent frame image available - customizer will work without frame layer',
        cached: false
      });
    }
    
    // Update status to processing
    await db.productFrameCache.update({
      where: { productId },
      data: { 
        processingStatus: 'processing',
        lastCheckedAt: new Date()
      }
    });
    
    try {
      // Generate frame using Python script
      const result = await generateFrame(
        frameReference,
        targetImageUrl,
        tolerance || 30
      );
      
      // Save to cache
      await db.productFrameCache.update({
        where: { productId },
        data: {
          generatedFrameUrl: result.frameUrl,
          processingStatus: 'completed',
          frameGeneratedAt: new Date(),
          errorMessage: null,
          lastCheckedAt: new Date()
        }
      });
      
      return Response.json({
        success: true,
        frameUrl: result.frameUrl,
        debugUrl: result.debugUrl,
        cached: false
      });
    } catch (error) {
      // Save error to cache
      await db.productFrameCache.update({
        where: { productId },
        data: {
          processingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          lastCheckedAt: new Date()
        }
      });
      
      throw error;
    }
  } catch (error) {
    console.error('Frame generation error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
