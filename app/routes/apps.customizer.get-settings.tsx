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
        buttonText: "Kendin Tasarla", // Default button text
        buttonLogoUrl: null, // No logo by default
        textColors: "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080" // Default colors
      });
    }
    
    // Get settings from database
    const settings = await prisma.appSettings.findUnique({
      where: { shop: shopDomain },
      select: { themeColor: true, buttonColor: true, buttonText: true, buttonLogoUrl: true, textColors: true },
    });
    
    return Response.json({
      themeColor: settings?.themeColor || "#00a8e8",
      buttonColor: settings?.buttonColor || "#667eea",
      buttonText: settings?.buttonText || "Kendin Tasarla",
      buttonLogoUrl: settings?.buttonLogoUrl || null,
      textColors: settings?.textColors || "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080"
    });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ 
      themeColor: "#00a8e8", // Default color on error
      buttonColor: "#667eea", // Default button color on error
      buttonText: "Kendin Tasarla", // Default button text on error
      buttonLogoUrl: null, // No logo by default on error
      textColors: "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080" // Default colors on error
    });
  }
}
