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
        buttonColor: "#667eea", // Default purple
        buttonText: "Customize Your Phone Case", // Default text
      },
    });
  }
  
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const themeColor = formData.get("themeColor") as string;
  const buttonColor = formData.get("buttonColor") as string;
  const buttonText = formData.get("buttonText") as string;
  const buttonLogoUrl = formData.get("buttonLogoUrl") as string;
  const textColors = formData.get("textColors") as string;
  
  // Update or create settings
  const settings = await prisma.appSettings.upsert({
    where: { shop: session.shop },
    update: { themeColor, buttonColor, buttonText, buttonLogoUrl: buttonLogoUrl || null, textColors: textColors || "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080" },
    create: {
      shop: session.shop,
      themeColor,
      buttonColor,
      buttonText,
      buttonLogoUrl: buttonLogoUrl || null,
      textColors: textColors || "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080",
    },
  });
  
  return { success: true, settings };
};

export default function Index() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [themeColor, setThemeColor] = useState(settings.themeColor);
  const [buttonColor, setButtonColor] = useState(settings.buttonColor);
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [buttonLogoUrl, setButtonLogoUrl] = useState(settings.buttonLogoUrl || "");
  const [textColors, setTextColors] = useState(settings.textColors || "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080");
  
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
    formData.append("buttonColor", buttonColor);
    formData.append("buttonText", buttonText);
    formData.append("buttonLogoUrl", buttonLogoUrl);
    formData.append("textColors", textColors);
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
      
      <s-section heading="Customize Button Color">
        <s-paragraph>
          Choose the color for the "Customize Your Phone Case" button that appears on product pages. This is the button customers click to start customizing.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Current Color:</s-text>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${buttonColor} 0%, ${buttonColor}dd 100%)`,
                border: "2px solid #e0e0e0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <s-text variant="subdued">{buttonColor}</s-text>
          </s-stack>
          
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Pick Color:</s-text>
            <input
              type="color"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
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
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              placeholder="#667eea"
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
                { name: "Purple", color: "#667eea" },
                { name: "Blue", color: "#3b82f6" },
                { name: "Pink", color: "#ec4899" },
                { name: "Green", color: "#10b981" },
                { name: "Orange", color: "#f97316" },
                { name: "Red", color: "#ef4444" },
              ].map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setButtonColor(preset.color)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    background: `linear-gradient(135deg, ${preset.color} 0%, ${preset.color}dd 100%)`,
                    border: buttonColor === preset.color ? "3px solid #000" : "2px solid #e0e0e0",
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
              Save Settings
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Customize Button Text">
        <s-paragraph>
          Set the text that appears on the customize button on product pages.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Button Text:</s-text>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Customize Your Phone Case"
              style={{
                padding: "10px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                width: "300px",
              }}
            />
          </s-stack>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Save Settings
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Customize Button Logo">
        <s-paragraph>
          Add a custom logo URL to display on the customize button. If no logo is provided, a palette emoji (🎨) will be shown. Recommended size: 24x24 pixels or larger.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          {buttonLogoUrl && (
            <s-stack direction="inline" gap="base" align="center">
              <s-text>Current Logo:</s-text>
              <img 
                src={buttonLogoUrl} 
                alt="Button logo" 
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "contain",
                  border: "2px solid #e0e0e0",
                  borderRadius: "4px",
                  padding: "4px",
                  background: "white"
                }}
              />
            </s-stack>
          )}
          
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Logo URL:</s-text>
            <input
              type="text"
              value={buttonLogoUrl}
              onChange={(e) => setButtonLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={{
                padding: "10px 16px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                width: "400px",
              }}
            />
            {buttonLogoUrl && (
              <button
                onClick={() => setButtonLogoUrl("")}
                style={{
                  padding: "8px 16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Clear
              </button>
            )}
          </s-stack>
          
          <s-text variant="subdued" style={{ fontSize: "13px" }}>
            Tip: Upload your logo to Shopify Files (Settings → Files) and paste the URL here, or use any publicly accessible image URL.
          </s-text>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Save Settings
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Text Color Palette">
        <s-paragraph>
          Customize the color palette available for text in the customizer. Enter up to 16 hex colors separated by commas.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Current Colors:</s-text>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {textColors.split(',').map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    backgroundColor: color.trim(),
                    border: "2px solid #e0e0e0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  title={color.trim()}
                />
              ))}
            </div>
          </s-stack>
          
          <s-stack direction="block" gap="tight">
            <s-text>Color Palette (comma-separated hex colors):</s-text>
            <textarea
              value={textColors}
              onChange={(e) => setTextColors(e.target.value)}
              placeholder="#FFFFFF,#000000,#FF0000,..."
              style={{
                padding: "12px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "14px",
                width: "100%",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
            <s-text variant="subdued" style={{ fontSize: "13px" }}>
              Example: #FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000
            </s-text>
          </s-stack>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Save Text Colors
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Settings saved successfully!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Preview">
        <s-paragraph>
          Preview how your colors will look:
        </s-paragraph>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-text variant="subdued">Customize Button (Product Page):</s-text>
            <button
              style={{
                padding: "15px 30px",
                background: `linear-gradient(135deg, ${buttonColor} 0%, ${buttonColor}dd 100%)`,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {buttonLogoUrl ? (
                <img src={buttonLogoUrl} alt="Logo" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
              ) : (
                "🎨"
              )}
              {buttonText}
            </button>
            
            <s-text variant="subdued" style={{ marginTop: "20px" }}>Customizer Interface Buttons:</s-text>
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
