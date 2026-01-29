import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { generateDesignImage, uploadToShopifyFiles, type DesignData } from "../utils/image-generator";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const designDataStr = formData.get('designData') as string;
    const designImageFile = formData.get('designImage') as File;
    const emptyCaseFile = formData.get('emptyCase') as File;
    const designOnlyFile = formData.get('designOnly') as File;
    
    // Get all element images (element0, element1, element2, etc.)
    const elementFiles: File[] = [];
    let elementIndex = 0;
    while (formData.has(`element${elementIndex}`)) {
      const elementFile = formData.get(`element${elementIndex}`) as File;
      if (elementFile) {
        elementFiles.push(elementFile);
      }
      elementIndex++;
    }
    
    console.log(`Received ${elementFiles.length} element images`);
    
    // Get shop from Shopify's App Proxy headers
    const url = new URL(request.url);
    let shopDomain = url.searchParams.get('shop');
    
    if (!shopDomain) {
      const referer = request.headers.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        shopDomain = refererUrl.hostname;
      }
    }
    
    console.log('App Proxy request - Shop:', shopDomain, 'URL:', request.url);
    
    if (!designDataStr) {
      return Response.json({ error: 'Missing designData' }, { status: 400 });
    }

    if (!designImageFile || !emptyCaseFile || !designOnlyFile) {
      return Response.json({ error: 'Missing image files' }, { status: 400 });
    }

    if (!shopDomain) {
      return Response.json({ error: 'Missing shop parameter' }, { status: 400 });
    }
    
    let designData: DesignData;
    try {
      designData = JSON.parse(designDataStr);
    } catch (error) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    // Validate design data structure (allow empty arrays)
    if (!Array.isArray(designData.images) || !Array.isArray(designData.texts) || !Array.isArray(designData.layers)) {
      return Response.json({ error: 'Invalid design data structure' }, { status: 400 });
    }
    
    // Convert all uploaded images to base64 for storage
    const completeImageBuffer = Buffer.from(await designImageFile.arrayBuffer());
    const completeBase64 = completeImageBuffer.toString('base64');
    const completeDataUrl = `data:image/png;base64,${completeBase64}`;
    
    const emptyCaseBuffer = Buffer.from(await emptyCaseFile.arrayBuffer());
    const emptyCaseBase64 = emptyCaseBuffer.toString('base64');
    const emptyCaseDataUrl = `data:image/png;base64,${emptyCaseBase64}`;
    
    const designOnlyBuffer = Buffer.from(await designOnlyFile.arrayBuffer());
    const designOnlyBase64 = designOnlyBuffer.toString('base64');
    const designOnlyDataUrl = `data:image/png;base64,${designOnlyBase64}`;
    
    // Convert element images to base64
    const elementDataUrls: string[] = [];
    for (const elementFile of elementFiles) {
      const elementBuffer = Buffer.from(await elementFile.arrayBuffer());
      const elementBase64 = elementBuffer.toString('base64');
      const elementDataUrl = `data:image/png;base64,${elementBase64}`;
      elementDataUrls.push(elementDataUrl);
    }
    
    console.log(`Converted ${elementDataUrls.length} element images to base64`);
    
    // Store in database with element images as JSON array
    const design = await prisma.design.create({
      data: {
        shop: shopDomain,
        designData: designDataStr,
        imageUrl: completeDataUrl, // Complete design with frame
        emptyCaseUrl: emptyCaseDataUrl, // Empty phone case
        designOnlyUrl: designOnlyDataUrl, // Design elements only
        elementImages: JSON.stringify(elementDataUrls), // Store element images as JSON
      },
    });
    
    // Generate public URLs to serve the images
    const baseUrl = new URL(request.url).origin;
    const publicImageUrl = `${baseUrl}/design-image/${design.id}`;
    const emptyCaseUrl = `${baseUrl}/design-image/${design.id}/empty`;
    const designOnlyUrl = `${baseUrl}/design-image/${design.id}/design-only`;
    
    // Generate URLs for element images
    const elementUrls = elementDataUrls.map((_, index) => 
      `${baseUrl}/design-image/${design.id}/element/${index}`
    );
    
    return Response.json({
      designId: design.id,
      imageUrl: publicImageUrl,
      emptyCaseUrl: emptyCaseUrl,
      designOnlyUrl: designOnlyUrl,
      elementUrls: elementUrls,
    });
    
  } catch (error) {
    console.error('Error in app proxy save-design:', error);
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
