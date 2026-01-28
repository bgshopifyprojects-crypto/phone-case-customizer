import { useState, useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Get or create settings for this shop
  let settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });
  
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        shop: session.shop,
        themeColor: "#00a8e8", // Default blue
      },
    });
  }
  
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const themeColor = formData.get("themeColor") as string;
  
  // Update or create settings
  const settings = await prisma.appSettings.upsert({
    where: { shop: session.shop },
    update: { themeColor },
    create: {
      shop: session.shop,
      themeColor,
    },
  });
  
  return { success: true, settings };
};

export default function Index() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [themeColor, setThemeColor] = useState(settings.themeColor);
  
  const isLoading = fetcher.state === "submitting";
  const isSaved = fetcher.data?.success;
  
  useEffect(() => {
    if (isSaved) {
      // Show success message briefly
      const timer = setTimeout(() => {
        // Reset success state
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);
  
  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("themeColor", themeColor);
    fetcher.submit(formData, { method: "POST" });
  };
  
  return (
    <s-page heading="Phone Case Customizer Settings">
      <s-section heading="Theme Color">
        <s-paragraph>
          Choose a primary color for the phone case customizer interface. This color will be used for buttons, active states, and highlights.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Current Color:</s-text>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                backgroundColor: themeColor,
                border: "2px solid #e0e0e0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <s-text variant="subdued">{themeColor}</s-text>
          </s-stack>
          
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Pick Color:</s-text>
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              style={{
                width: "80px",
                height: "44px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
            <input
              type="text"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#00a8e8"
              style={{
                padding: "8px 12px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "14px",
                width: "120px",
              }}
            />
          </s-stack>
          
          <s-stack direction="block" gap="tight">
            <s-text variant="subdued">Popular Colors:</s-text>
            <s-stack direction="inline" gap="tight">
              {[
                { name: "Blue", color: "#00a8e8" },
                { name: "Purple", color: "#7c3aed" },
                { name: "Pink", color: "#ec4899" },
                { name: "Green", color: "#10b981" },
                { name: "Orange", color: "#f97316" },
                { name: "Red", color: "#ef4444" },
              ].map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setThemeColor(preset.color)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    backgroundColor: preset.color,
                    border: themeColor === preset.color ? "3px solid #000" : "2px solid #e0e0e0",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  title={preset.name}
                />
              ))}
            </s-stack>
          </s-stack>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Save Theme Color
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Preview">
        <s-paragraph>
          Preview how the customizer will look with your selected theme color:
        </s-paragraph>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: themeColor,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Primary Button
              </button>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: "white",
                  color: themeColor,
                  border: `2px solid ${themeColor}`,
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Secondary Button
              </button>
              <div
                style={{
                  padding: "12px 24px",
                  backgroundColor: `${themeColor}20`,
                  color: themeColor,
                  borderRadius: "8px",
                  fontWeight: "500",
                }}
              >
                Active State
              </div>
            </div>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
