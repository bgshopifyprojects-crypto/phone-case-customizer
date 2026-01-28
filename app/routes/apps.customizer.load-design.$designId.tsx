import type { LoaderFunctionArgs } from "react-router";
import { prisma } from "../db.server";

/**
 * Load a saved design by ID
 * GET /apps/customizer/load-design/:designId
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const { designId } = params;

    if (!designId) {
      return Response.json({ error: "Design ID is required" }, { status: 400 });
    }

    // Fetch design from database
    const design = await prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) {
      return Response.json({ error: "Design not found" }, { status: 404 });
    }

    // Parse the design data
    const designData = JSON.parse(design.designData);

    return Response.json({
      designId: design.id,
      designData,
      imageUrl: design.imageUrl,
      emptyCaseUrl: design.emptyCaseUrl,
      designOnlyUrl: design.designOnlyUrl,
      createdAt: design.createdAt,
    });
  } catch (error) {
    console.error("Error loading design:", error);
    return Response.json(
      { error: "Failed to load design" },
      { status: 500 }
    );
  }
};
