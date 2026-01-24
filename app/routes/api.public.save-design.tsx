import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { generateDesignImage, uploadToShopifyFiles, type DesignData } from "../utils/image-generator";
import { authenticate } from "../shopify.server";

/**
 * PUBLIC API endpoint to save a phone case design from storefront
 * POST /api/public/save-design
 */
export async function action({ request }: ActionFunctionArgs) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const designDataStr = formData.get('designData') as string;
    const shopDomain = formData.get('shop') as string;
    
    if (!designDataStr || !shopDomain) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    let designData: DesignData;
    try {
      designData = JSON.parse(designDataStr);
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!designData.images || !designData.texts || !designData.layers) {
      return Response.json(
        { error: 'Invalid design data structure' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const imageBuffer = await generateDesignImage(designData);
    
    const session = await prisma.session.findFirst({
      where: { shop: shopDomain },
      orderBy: { id: 'desc' },
    });

    if (!session) {
      return Response.json(
        { error: 'Shop session not found' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { admin } = await authenticate.admin(
      new Request(request.url, {
        headers: {
          ...Object.fromEntries(request.headers),
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })
    );
    
    const imageUrl = await uploadToShopifyFiles(imageBuffer, shopDomain, admin);
    
    const design = await prisma.design.create({
      data: {
        shop: shopDomain,
        designData: designDataStr,
        imageUrl: imageUrl,
      },
    });
    
    return Response.json(
      { designId: design.id, imageUrl: design.imageUrl },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Error in public save-design:', error);
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
