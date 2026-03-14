import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticate, sessionStorage } from "../shopify.server";
import { type DesignData } from "../utils/image-generator";

/**
 * Upload a file to Shopify Files API and wait for the URL to be available
 */
async function uploadImageToShopifyFiles(
  admin: any,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string = "image/png",
): Promise<string> {
  try {
    console.log(`Uploading ${filename} to Shopify Files...`);

    // Step 1: Create staged upload
    const stagedUploadResponse = await admin.graphql(
      `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: [
            {
              filename: filename,
              mimeType: mimeType,
              resource: "FILE",
              fileSize: fileBuffer.length.toString(),
              httpMethod: "POST",
            },
          ],
        },
      },
    );

    const stagedUploadData = await stagedUploadResponse.json();
    console.log(
      "Staged upload response:",
      JSON.stringify(stagedUploadData, null, 2),
    );

    if (stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      throw new Error(
        `Staged upload error: ${JSON.stringify(stagedUploadData.data.stagedUploadsCreate.userErrors)}`,
      );
    }

    const stagedTarget =
      stagedUploadData.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!stagedTarget) {
      throw new Error("No staged target returned");
    }

    // Step 2: Upload file to Google Cloud Storage
    const formData = new FormData();

    // Add all parameters from Shopify
    for (const param of stagedTarget.parameters) {
      formData.append(param.name, param.value);
    }

    // Add the file as a Blob
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("file", blob, filename);

    console.log(`Uploading to GCS: ${stagedTarget.url}`);
    const uploadResponse = await fetch(stagedTarget.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
      );
    }

    console.log(`Upload successful, status: ${uploadResponse.status}`);

    // Step 3: Create file in Shopify
    const fileCreateResponse = await admin.graphql(
      `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on GenericFile {
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          files: [
            {
              originalSource: stagedTarget.resourceUrl,
              contentType: "FILE",
            },
          ],
        },
      },
    );

    const fileCreateData = await fileCreateResponse.json();
    console.log(
      "File create response:",
      JSON.stringify(fileCreateData, null, 2),
    );

    if (fileCreateData.data?.fileCreate?.userErrors?.length > 0) {
      throw new Error(
        `File create error: ${JSON.stringify(fileCreateData.data.fileCreate.userErrors)}`,
      );
    }

    const file = fileCreateData.data?.fileCreate?.files?.[0];
    if (!file) {
      throw new Error("No file returned from fileCreate");
    }

    // Step 4: Wait for URL to become available (Shopify processes files asynchronously)
    const fileId = file.id;
    let fileUrl = file.url;
    let attempts = 0;
    const maxAttempts = 10;
    const delayMs = 2000; // 2 seconds between attempts

    while (!fileUrl && attempts < maxAttempts) {
      attempts++;
      console.log(
        `Waiting for file URL (attempt ${attempts}/${maxAttempts})...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Query the file to get its URL
      const fileQueryResponse = await admin.graphql(
        `#graphql
        query getFile($id: ID!) {
          node(id: $id) {
            ... on GenericFile {
              id
              url
            }
          }
        }`,
        {
          variables: {
            id: fileId,
          },
        },
      );

      const fileQueryData = await fileQueryResponse.json();
      console.log(
        `File query response (attempt ${attempts}):`,
        JSON.stringify(fileQueryData, null, 2),
      );

      fileUrl = fileQueryData.data?.node?.url;
    }

    if (!fileUrl) {
      throw new Error(`File URL not available after ${maxAttempts} attempts`);
    }

    console.log(`File uploaded successfully: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading to Shopify Files:", error);
    throw new Error(
      `Failed to upload to Shopify Files: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const designDataStr = formData.get("designData") as string;
    const designImageFile = formData.get("designImage") as File;
    const emptyCaseFile = formData.get("emptyCase") as File;
    const designOnlyFile = formData.get("designOnly") as File;

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
    let shopDomain = url.searchParams.get("shop");

    if (!shopDomain) {
      const referer = request.headers.get("referer");
      if (referer) {
        const refererUrl = new URL(referer);
        shopDomain = refererUrl.hostname;
      }
    }

    console.log("App Proxy request - Shop:", shopDomain, "URL:", request.url);

    if (!designDataStr) {
      return Response.json({ error: "Missing designData" }, { status: 400 });
    }

    if (!designImageFile || !emptyCaseFile || !designOnlyFile) {
      return Response.json({ error: "Missing image files" }, { status: 400 });
    }

    if (!shopDomain) {
      return Response.json(
        { error: "Missing shop parameter" },
        { status: 400 },
      );
    }

    let designData: DesignData;
    try {
      designData = JSON.parse(designDataStr);
    } catch (error) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate design data structure (allow empty arrays)
    if (
      !Array.isArray(designData.images) ||
      !Array.isArray(designData.texts) ||
      !Array.isArray(designData.layers)
    ) {
      return Response.json(
        { error: "Invalid design data structure" },
        { status: 400 },
      );
    }

    // Authenticate to get admin API access
    // For app proxy, we need to authenticate using the shop domain
    let admin;
    try {
      const authResult = await authenticate.public.appProxy(request);
      admin = authResult.admin;
    } catch (error) {
      console.error("Authentication failed:", error);

      // Check if it's a token expiration issue
      const sessionId = `offline_${shopDomain}`;
      const session = await sessionStorage.loadSession(sessionId);

      if (
        session &&
        session.expires &&
        new Date(session.expires) < new Date()
      ) {
        console.error("Access token has expired");
        return Response.json(
          {
            error: "Authentication expired",
            details:
              "Your app session has expired. Please reinstall the app from the Shopify admin.",
            action: "reinstall_required",
          },
          { status: 401 },
        );
      }

      // Generic authentication error
      return Response.json(
        {
          error: "Authentication failed",
          details:
            error instanceof Error
              ? error.message
              : "Unknown authentication error",
        },
        { status: 401 },
      );
    }

    // Convert files to buffers
    const completeImageBuffer = Buffer.from(
      await designImageFile.arrayBuffer(),
    );
    const emptyCaseBuffer = Buffer.from(await emptyCaseFile.arrayBuffer());
    const designOnlyBuffer = Buffer.from(await designOnlyFile.arrayBuffer());

    // Upload images to Shopify Files
    console.log("Uploading images to Shopify Files...");
    const timestamp = Date.now();

    const completeImageUrl = await uploadImageToShopifyFiles(
      admin,
      completeImageBuffer,
      `design-complete-${timestamp}.png`,
    );

    const emptyCaseUrl = await uploadImageToShopifyFiles(
      admin,
      emptyCaseBuffer,
      `design-empty-${timestamp}.png`,
    );

    const designOnlyUrl = await uploadImageToShopifyFiles(
      admin,
      designOnlyBuffer,
      `design-only-${timestamp}.png`,
    );

    // Upload element images
    const elementUrls: string[] = [];
    for (let i = 0; i < elementFiles.length; i++) {
      const elementBuffer = Buffer.from(await elementFiles[i].arrayBuffer());
      const elementUrl = await uploadImageToShopifyFiles(
        admin,
        elementBuffer,
        `design-element-${i}-${timestamp}.png`,
      );
      elementUrls.push(elementUrl);
    }

    console.log(
      `Uploaded ${elementUrls.length} element images to Shopify Files`,
    );

    // Store in database with Shopify CDN URLs
    const design = await prisma.design.create({
      data: {
        shop: shopDomain,
        designData: designDataStr,
        imageUrl: completeImageUrl, // Complete design with frame
        emptyCaseUrl: emptyCaseUrl, // Empty phone case
        designOnlyUrl: designOnlyUrl, // Design elements only
        elementImages: JSON.stringify(elementUrls), // Store element URLs as JSON
      },
    });

    return Response.json({
      designId: design.id,
      imageUrl: completeImageUrl,
      emptyCaseUrl: emptyCaseUrl,
      designOnlyUrl: designOnlyUrl,
      elementUrls: elementUrls,
    });
  } catch (error) {
    console.error("Error in app proxy save-design:", error);
    return Response.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
