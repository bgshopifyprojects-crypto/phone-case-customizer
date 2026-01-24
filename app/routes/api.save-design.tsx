import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateDesignImage, uploadToShopifyFiles, type DesignData } from "../utils/image-generator";

/**
 * API endpoint to save a phone case design
 * POST /api/save-design
 * 
 * Accepts design data, generates an image, uploads to Shopify Files,
 * stores in database, and returns design ID and image URL
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate the request
    const { admin, session } = await authenticate.admin(request);
    
    if (!session?.shop) {
      return Response.json(
        { error: 'Authentication failed: No shop session' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const formData = await request.formData();
    const designDataStr = formData.get('designData') as string;
    
    if (!designDataStr) {
      return Response.json(
        { error: 'Missing designData in request' },
        { status: 400 }
      );
    }
    
    // Parse and validate design data
    let designData: DesignData;
    try {
      designData = JSON.parse(designDataStr);
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON in designData' },
        { status: 400 }
      );
    }
    
    // Validate design data structure
    if (!designData.images || !designData.texts || !designData.layers) {
      return Response.json(
        { error: 'Invalid design data structure: missing required fields' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(designData.images) || !Array.isArray(designData.texts) || !Array.isArray(designData.layers)) {
      return Response.json(
        { error: 'Invalid design data structure: fields must be arrays' },
        { status: 400 }
      );
    }
    
    // Generate high-resolution image from design data
    let imageBuffer: Buffer;
    try {
      imageBuffer = await generateDesignImage(designData);
    } catch (error) {
      console.error('Image generation error:', error);
      return Response.json(
        { error: 'Failed to generate design image' },
        { status: 500 }
      );
    }
    
    // Upload image to Shopify Files API
    let imageUrl: string;
    try {
      imageUrl = await uploadToShopifyFiles(imageBuffer, session.shop, admin);
    } catch (error) {
      console.error('Shopify Files upload error:', error);
      
      // Retry once on failure
      try {
        console.log('Retrying Shopify Files upload...');
        imageUrl = await uploadToShopifyFiles(imageBuffer, session.shop, admin);
      } catch (retryError) {
        console.error('Shopify Files upload retry failed:', retryError);
        return Response.json(
          { error: 'Failed to upload design image to Shopify' },
          { status: 500 }
        );
      }
    }
    
    // Store design in database
    let design;
    try {
      design = await prisma.design.create({
        data: {
          shop: session.shop,
          designData: designDataStr,
          imageUrl: imageUrl, // Store base64 for now
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      return Response.json(
        { error: 'Failed to save design to database' },
        { status: 500 }
      );
    }
    
    // Generate public URL to serve the image
    const publicImageUrl = `${new URL(request.url).origin}/design-image/${design.id}`;
    
    // Return success response with design ID and public image URL
    return Response.json({
      designId: design.id,
      imageUrl: publicImageUrl,
    });
    
  } catch (error) {
    console.error('Unexpected error in save-design endpoint:', error);
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
