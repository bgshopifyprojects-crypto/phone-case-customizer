import { LoaderFunctionArgs } from "react-router";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Serve the phone case frame image
 * GET /phone-case-frame.png
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const imagePath = join(process.cwd(), "public", "phone-case-frame.png");
    const imageBuffer = await readFile(imagePath);
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",  // Allow CORS
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("Error serving phone-case-frame.png:", error);
    return new Response("Image not found", { status: 404 });
  }
}
