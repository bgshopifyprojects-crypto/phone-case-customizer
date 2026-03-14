/**
 * /apps/customizer/embed
 *
 * Serves the phone-case customizer React app as a full-page HTML document
 * designed to be loaded inside an <iframe> on the Shopify storefront.
 *
 * Running inside an iframe gives us a completely isolated document, so:
 *  - `body { overscroll-behavior: none; touch-action: none }` works correctly
 *    (the iframe's body IS the scroll container — no theme interference)
 *  - The Shopify theme's passive touchstart listeners cannot reach our document
 *  - Pull-down-to-refresh is prevented at the iframe document level
 *
 * Communication with the parent page is done via postMessage:
 *  - iframe → parent: { type: 'customizer:addToCart', detail: {...} }
 *  - iframe → parent: { type: 'customizer:close' }
 *  - parent → iframe: { type: 'customizer:variantChanged', detail: {...} }
 *  - parent → iframe: { type: 'customizer:init', detail: {...} }
 *
 * Query params (passed by the Liquid block when building the iframe src):
 *  - phoneCaseUrl
 *  - productImageUrl
 *  - productImageUrls  (comma-separated)
 *  - variantId
 *  - designsUrl
 *  - themeColor
 *  - productPrice
 *  - productComparePrice
 *  - customFrameUrl
 *  - hasCustomFrame
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // Pass all query params through to the HTML so the React app can read them
  // from data attributes on #phone-case-root (same pattern as the Liquid block).
  const phoneCaseUrl = url.searchParams.get("phoneCaseUrl") || "";
  const productImageUrl = url.searchParams.get("productImageUrl") || "";
  const productImageUrls = url.searchParams.get("productImageUrls") || "";
  const variantId = url.searchParams.get("variantId") || "";
  const designsUrl = url.searchParams.get("designsUrl") || "";
  const themeColor = url.searchParams.get("themeColor") || "#00a8e8";
  const productPrice = url.searchParams.get("productPrice") || "";
  const productComparePrice = url.searchParams.get("productComparePrice") || "";
  const customFrameUrl = url.searchParams.get("customFrameUrl") || "";
  const hasCustomFrame = url.searchParams.get("hasCustomFrame") || "false";

  // Asset URLs — served by the existing asset routes
  const origin = new URL(request.url).origin;
  const jsUrl = `${origin}/apps/customizer/phone-customizer-js`;
  const cssUrl = `${origin}/apps/customizer/phone-customizer-css`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Phone Case Customizer</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Cinzel:wght@400;700&family=Comforter+Brush&family=Dancing+Script:wght@400;700&family=Fuggles&family=Great+Vibes&family=Leckerli+One&family=Luckiest+Guy&family=Montserrat:wght@400;700&family=Noto+Serif:wght@400;700&family=Pacifico&family=Poppins:wght@400;700&family=Roboto:wght@400;700&family=Sacramento&family=Source+Code+Pro:wght@400;700&family=Ubuntu+Mono:wght@400;700&display=swap"
    rel="stylesheet"
  />

  <!-- React app styles -->
  <link rel="stylesheet" href="${cssUrl}" />

  <style>
    /*
     * PTR PREVENTION — iframe edition.
     * Inside an iframe the body IS the scroll container (no theme wrapper),
     * so these rules work correctly — unlike on the parent page where the
     * theme sets overflow:hidden on body and uses #MainContent as the real
     * scroll container.
     */
    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      overscroll-behavior: none;
      touch-action: none;
      background: #000;
    }

    #phone-case-root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <!--
    #phone-case-root carries the same data attributes as the Liquid block,
    so the React app (App.jsx) works without any changes to its data-reading logic.
  -->
  <div
    id="phone-case-root"
    data-phone-case-url="${escapeAttr(phoneCaseUrl)}"
    data-product-image-url="${escapeAttr(productImageUrl)}"
    data-product-image-urls="${escapeAttr(productImageUrls)}"
    data-variant-id="${escapeAttr(variantId)}"
    data-designs-url="${escapeAttr(designsUrl)}"
    data-theme-color="${escapeAttr(themeColor)}"
    data-product-price="${escapeAttr(productPrice)}"
    data-product-compare-price="${escapeAttr(productComparePrice)}"
    data-custom-frame-url="${escapeAttr(customFrameUrl)}"
    data-has-custom-frame="${escapeAttr(hasCustomFrame)}"
    data-iframe-mode="true"
  ></div>

  <script>
    // ─── postMessage bridge ───────────────────────────────────────────────────
    // The React app dispatches window events (customizer:addToCart).
    // We intercept them here and forward to the parent page via postMessage.
    // The parent page listens for these messages and handles cart add / close.

    // Forward customizer:addToCart → parent
    window.addEventListener('customizer:addToCart', function (e) {
      window.parent.postMessage(
        { type: 'customizer:addToCart', detail: e.detail },
        '*'
      );
    });

    // Listen for messages FROM the parent page
    window.addEventListener('message', function (e) {
      // Variant changed on the parent page — update data attributes so React re-renders
      if (e.data && e.data.type === 'customizer:variantChanged') {
        var root = document.getElementById('phone-case-root');
        if (!root) return;
        var d = e.data.detail;
        if (d.variantId)      root.setAttribute('data-variant-id',        d.variantId);
        if (d.backgroundUrl)  root.setAttribute('data-phone-case-url',    d.backgroundUrl);
        if (d.productImageUrl) root.setAttribute('data-product-image-url', d.productImageUrl);

        // Re-dispatch as the custom event the React app already listens for
        window.dispatchEvent(new CustomEvent('customizer:variantChanged', { detail: d }));
      }

      // Parent requests close (e.g. backdrop click on parent side)
      if (e.data && e.data.type === 'customizer:close') {
        window.dispatchEvent(new CustomEvent('customizer:close'));
      }
    });

    // When React app wants to close (close button inside the app), forward to parent
    window.addEventListener('customizer:requestClose', function () {
      window.parent.postMessage({ type: 'customizer:close' }, '*');
    });
  </script>

  <!-- React app bundle -->
  <script src="${jsUrl}" defer></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow embedding in an iframe from the Shopify storefront (same-site)
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *",
      "Cache-Control": "no-store",
    },
  });
}

/** Escape a string for use in an HTML attribute value (double-quoted). */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
