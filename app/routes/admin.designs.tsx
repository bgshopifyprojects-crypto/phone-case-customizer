import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * Admin route to view all designs
 * GET /admin/designs
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    
    if (!session?.shop) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get all designs for this shop
    const designs = await prisma.design.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 designs
    });
    
    // Format for display
    const formattedDesigns = designs.map(design => ({
      id: design.id,
      orderId: design.orderId,
      imageUrl: design.imageUrl,
      imageUrlType: design.imageUrl.startsWith('data:') ? 'base64' : 'cdn',
      createdAt: design.createdAt.toISOString(),
    }));
    
    return Response.json({ designs: formattedDesigns });
    
  } catch (error) {
    console.error('Error fetching designs:', error);
    return Response.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}
