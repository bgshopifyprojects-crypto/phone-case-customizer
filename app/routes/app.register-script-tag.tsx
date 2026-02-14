import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * Admin route to register the cart injection script tag
 * This should be called once when the app is installed or from admin UI
 * POST /app/register-script-tag
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // Check if script tag already exists for this shop
    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });
    
    // If script tag ID exists, check if it's still valid
    if (settings?.scriptTagId) {
      try {
        // Try to fetch the existing script tag using GraphQL
        const response = await admin.graphql(
          `#graphql
          query getScriptTag($id: ID!) {
            scriptTag(id: $id) {
              id
              src
              displayScope
            }
          }`,
          {
            variables: {
              id: `gid://shopify/ScriptTag/${settings.scriptTagId}`,
            },
          }
        );
        
        const data = await response.json();
        
        if (data.data?.scriptTag) {
          return Response.json({ 
            success: true, 
            message: "Script tag already exists",
            scriptTagId: settings.scriptTagId,
            alreadyExists: true
          });
        }
      } catch (error) {
        // Script tag doesn't exist anymore, we'll create a new one
        console.log("Script tag not found, creating new one");
      }
    }
    
    // Get the app URL from the request
    const url = new URL(request.url);
    // Force HTTPS for script tag (Shopify requirement)
    const scriptSrc = `https://${url.host}/apps/customizer/cart-inject`;
    
    console.log("Creating script tag with src:", scriptSrc);
    
    // Create the script tag using GraphQL
    const createResponse = await admin.graphql(
      `#graphql
      mutation scriptTagCreate($input: ScriptTagInput!) {
        scriptTagCreate(input: $input) {
          scriptTag {
            id
            src
            displayScope
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            src: scriptSrc,
            displayScope: "ONLINE_STORE",
          },
        },
      }
    );
    
    const createData = await createResponse.json();
    
    if (createData.data?.scriptTagCreate?.userErrors?.length > 0) {
      const errors = createData.data.scriptTagCreate.userErrors;
      throw new Error(`Failed to create script tag: ${errors.map((e: any) => e.message).join(", ")}`);
    }
    
    const scriptTag = createData.data?.scriptTagCreate?.scriptTag;
    
    if (!scriptTag?.id) {
      throw new Error("Failed to create script tag - no ID returned");
    }
    
    // Extract numeric ID from GraphQL global ID (gid://shopify/ScriptTag/123456)
    const scriptTagId = scriptTag.id.split('/').pop();
    
    console.log("Script tag created successfully:", scriptTagId);
    
    // Save script tag ID to database
    await prisma.appSettings.upsert({
      where: { shop: session.shop },
      update: { scriptTagId: scriptTagId },
      create: {
        shop: session.shop,
        themeColor: "#00a8e8",
        buttonColor: "#667eea",
        buttonText: "Kendin Tasarla",
        scriptTagId: scriptTagId,
      },
    });
    
    return Response.json({ 
      success: true, 
      message: "Script tag registered successfully",
      scriptTagId: scriptTagId
    });
    
  } catch (error: any) {
    console.error("Error registering script tag:", error);
    return Response.json({ 
      success: false, 
      error: error.message || "Failed to register script tag"
    }, { status: 500 });
  }
}
