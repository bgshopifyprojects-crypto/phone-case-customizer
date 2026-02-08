import type { ActionFunctionArgs } from "react-router";
import sharp from "sharp";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log('Generating frame from image:', imageUrl);

    // Ensure URL has protocol
    const fullImageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl;

    // Fetch the product image
    const imageResponse = await fetch(fullImageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return Response.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Ensure image has alpha channel for transparency
    const imageWithAlpha = await sharp(imageBuffer)
      .ensureAlpha()
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(imageWithAlpha).metadata();
    const width = metadata.width || 600;
    const height = metadata.height || 1000;

    console.log('Image dimensions:', width, 'x', height);

    // Define the customizable area margins
    // Final working values: left 84px, right 82px, top 58px, bottom 60px
    const topMargin = 58;
    const bottomMargin = 60;
    const leftMargin = 84;
    const rightMargin = 82;

    const customizableWidth = width - leftMargin - rightMargin;
    const customizableHeight = height - topMargin - bottomMargin;
    const cornerRadius = 62;

    console.log('Customizable area:', customizableWidth, 'x', customizableHeight, 'at', leftMargin, topMargin);
    console.log('Corner radius:', cornerRadius);

    // Create a transparent PNG with the center area cut out with rounded corners
    const cutoutSvg = `
      <svg width="${width}" height="${height}">
        <rect x="${leftMargin}" y="${topMargin}" 
              width="${customizableWidth}" height="${customizableHeight}" 
              rx="${cornerRadius}" ry="${cornerRadius}"
              fill="black"/>
      </svg>
    `;

    // Apply the cutout to make center transparent
    const frameBuffer = await sharp(imageWithAlpha)
      .composite([
        {
          input: Buffer.from(cutoutSvg),
          blend: "dest-out", // Remove pixels where the cutout is
        },
      ])
      .png()
      .toBuffer();

    console.log('Frame generated successfully, size:', frameBuffer.length, 'bytes');

    // Return as base64 data URL
    const base64Frame = frameBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Frame}`;

    return Response.json({ frameUrl: dataUrl });
  } catch (error) {
    console.error("Frame generation error:", error);
    return Response.json(
      { error: "Failed to generate frame: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
};
