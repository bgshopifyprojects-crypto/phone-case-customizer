import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

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
        buttonText: "Kendin Tasarla", // Default text
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
  const scriptTagFetcher = useFetcher();
  const [themeColor, setThemeColor] = useState(settings.themeColor);
  const [buttonColor, setButtonColor] = useState(settings.buttonColor);
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [buttonLogoUrl, setButtonLogoUrl] = useState(settings.buttonLogoUrl || "");
  const [textColors, setTextColors] = useState(settings.textColors || "#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080");
  
  const isLoading = fetcher.state === "submitting";
  const isSaved = fetcher.data?.success;
  const isRegisteringScriptTag = scriptTagFetcher.state === "submitting";
  const scriptTagRegistered = scriptTagFetcher.data?.success;
  
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
  
  const handleRegisterScriptTag = () => {
    scriptTagFetcher.submit({}, { 
      method: "POST", 
      action: "/app/register-script-tag" 
    });
  };
  
  return (
    <s-page heading="Telefon Kılıfı Özelleştirici Ayarları">
      <s-section heading="Tema Rengi">
        <s-paragraph>
          Telefon kılıfı özelleştirici arayüzü için birincil renk seçin. Bu renk butonlar, aktif durumlar ve vurgular için kullanılacaktır.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Mevcut Renk:</s-text>
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
            <s-text>Renk Seç:</s-text>
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
            <s-text variant="subdued">Popüler Renkler:</s-text>
            <s-stack direction="inline" gap="tight">
              {[
                { name: "Mavi", color: "#00a8e8" },
                { name: "Mor", color: "#7c3aed" },
                { name: "Pembe", color: "#ec4899" },
                { name: "Yeşil", color: "#10b981" },
                { name: "Turuncu", color: "#f97316" },
                { name: "Kırmızı", color: "#ef4444" },
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
              Tema Rengini Kaydet
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Ayarlar başarıyla kaydedildi!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Özelleştir Butonu Rengi">
        <s-paragraph>
          Ürün sayfalarında görünen "Telefon Kılıfınızı Özelleştirin" butonunun rengini seçin. Bu, müşterilerin özelleştirmeye başlamak için tıkladığı butondur.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Mevcut Renk:</s-text>
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
            <s-text>Renk Seç:</s-text>
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
            <s-text variant="subdued">Popüler Renkler:</s-text>
            <s-stack direction="inline" gap="tight">
              {[
                { name: "Mor", color: "#667eea" },
                { name: "Mavi", color: "#3b82f6" },
                { name: "Pembe", color: "#ec4899" },
                { name: "Yeşil", color: "#10b981" },
                { name: "Turuncu", color: "#f97316" },
                { name: "Kırmızı", color: "#ef4444" },
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
              Ayarları Kaydet
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Ayarlar başarıyla kaydedildi!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Özelleştir Butonu Metni">
        <s-paragraph>
          Ürün sayfalarındaki özelleştir butonunda görünecek metni ayarlayın.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Buton Metni:</s-text>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Kendin Tasarla"
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
              Ayarları Kaydet
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Ayarlar başarıyla kaydedildi!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Özelleştir Butonu Logosu">
        <s-paragraph>
          Özelleştir butonunda görüntülenecek özel bir logo URL'si ekleyin. Logo sağlanmazsa, palet emojisi (🎨) gösterilecektir. Önerilen boyut: 24x24 piksel veya daha büyük olabilir.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          {buttonLogoUrl && (
            <s-stack direction="inline" gap="base" align="center">
              <s-text>Mevcut Logo:</s-text>
              <img 
                src={buttonLogoUrl} 
                alt="Buton logosu" 
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
                Temizle
              </button>
            )}
          </s-stack>
          
          <s-text variant="subdued" style={{ fontSize: "13px" }}>
            İpucu: Logonuzu Shopify Dosyalarına yükleyin (Ayarlar → Dosyalar) ve URL'yi buraya yapıştırın veya herhangi bir genel erişilebilir resim URL'si kullanın.
          </s-text>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Ayarları Kaydet
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Ayarlar başarıyla kaydedildi!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Metin Renk Paleti">
        <s-paragraph>
          Özelleştiricideki metin için kullanılabilir renk paletini özelleştirin. Virgülle ayrılmış en fazla 16 hex renk girin.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" align="center">
            <s-text>Mevcut Renkler:</s-text>
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
            <s-text>Renk Paleti (virgülle ayrılmış hex renkler):</s-text>
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
              Örnek: #FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000
            </s-text>
          </s-stack>
          
          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleSubmit}
              variant="primary"
              {...(isLoading ? { loading: true } : {})}
            >
              Metin Renklerini Kaydet
            </s-button>
            {isSaved && (
              <s-text variant="success">✓ Ayarlar başarıyla kaydedildi!</s-text>
            )}
          </s-stack>
        </s-stack>
      </s-section>
      
      <s-section heading="Önizleme">
        <s-paragraph>
          Renklerinizin nasıl görüneceğini önizleyin:
        </s-paragraph>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-stack direction="block" gap="base">
            <s-text variant="subdued">Özelleştir Butonu (Ürün Sayfası):</s-text>
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
            
            <s-text variant="subdued" style={{ marginTop: "20px" }}>Özelleştirici Arayüz Butonları:</s-text>
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
                Birincil Buton
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
                İkincil Buton
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
                Aktif Durum
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
