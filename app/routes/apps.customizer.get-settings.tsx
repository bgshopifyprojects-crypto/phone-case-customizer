import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * Public API endpoint to get customizer settings
 * GET /apps/customizer/get-settings
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get shop from query params or referer
    const url = new URL(request.url);
    let shopDomain = url.searchParams.get('shop');
    
    if (!shopDomain) {
      const referer = request.headers.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        shopDomain = refererUrl.hostname;
      }
    }
    
    if (!shopDomain) {
      return Response.json({ 
        themeColor: "#00a8e8", // Default color
        buttonColor: "#667eea", // Default button color
        buttonText: "Customize Your Phone Case", // Default button text
        buttonLogoUrl: null // No logo by default
      });
    }
    
    // Get settings from database
    const settings = await prisma.appSettings.findUnique({
      where: { shop: shopDomain },
      select: { themeColor: true, buttonColor: true, buttonText: true, buttonLogoUrl: true },
    });
    
    return Response.json({
      themeColor: settings?.themeColor || "#00a8e8",
      buttonColor: settings?.buttonColor || "#667eea",
      buttonText: settings?.buttonText || "Customize Your Phone Case",
      buttonLogoUrl: settings?.buttonLogoUrl || null
    });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ 
      themeColor: "#00a8e8", // Default color on error
      buttonColor: "#667eea", // Default button color on error
      buttonText: "Customize Your Phone Case", // Default button text on error
      buttonLogoUrl: null // No logo by default on error
    });
  }
}
