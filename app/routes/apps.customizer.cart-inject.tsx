import type { LoaderFunctionArgs } from "react-router";

/**
 * Public route that serves JavaScript for cart page custom image injection
 * This script is loaded via Shopify Script Tag API on all storefront pages
 * GET /apps/customizer/cart-inject
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // JavaScript code that will be injected into the storefront
  const javascript = `
(function() {
  'use strict';
  
  // Only run on cart page
  if (window.location.pathname !== '/cart') {
    return;
  }
  
  console.log('[Phone Case Customizer] Cart injection script loaded');
  
  // Function to inject custom design images into cart items (Horizon theme)
  function injectCustomDesignImages() {
    console.log('[Phone Case Customizer] Injecting custom design images into cart...');
    
    // Fetch cart data
    fetch('/cart.js')
      .then(res => res.json())
      .then(cart => {
        console.log('[Phone Case Customizer] Cart data:', cart);
        
        // Find all cart item rows (Horizon theme uses table rows)
        const cartRows = document.querySelectorAll('tr.cart-items__table-row');
        console.log('[Phone Case Customizer] Found', cartRows.length, 'cart rows');
        
        cart.items.forEach((item, itemIndex) => {
          // Check if item has custom image property
          const customImageUrl = item.properties?._main || item.properties?.main;
          
          if (customImageUrl) {
            console.log('[Phone Case Customizer] Item', itemIndex, 'has custom image:', customImageUrl);
            
            // Find the matching cart row by variant ID in data-key attribute
            cartRows.forEach(row => {
              const dataKey = row.getAttribute('data-key') || '';
              const variantId = item.variant_id.toString();
              
              // Check if this row matches the item (data-key starts with variant ID)
              if (dataKey.startsWith(variantId)) {
                console.log('[Phone Case Customizer] Found matching cart row for variant:', variantId);
                
                // Find the details cell
                const detailsCell = row.querySelector('td.cart-items__details');
                
                if (detailsCell) {
                  // Check if we already injected the image (avoid duplicates)
                  if (detailsCell.querySelector('.custom-design-preview')) {
                    console.log('[Phone Case Customizer] Custom design already injected, skipping');
                    return;
                  }
                  
                  // Create custom design preview container
                  const previewContainer = document.createElement('div');
                  previewContainer.className = 'custom-design-preview';
                  previewContainer.style.cssText = \`
                    margin: 12px 0;
                    padding: 12px;
                    background: #f9f9f9;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    display: inline-block;
                  \`;
                  
                  // Create label
                  const label = document.createElement('div');
                  label.textContent = 'Your Custom Design:';
                  label.style.cssText = \`
                    font-size: 13px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 8px;
                  \`;
                  
                  // Create image
                  const img = document.createElement('img');
                  img.src = customImageUrl;
                  img.alt = 'Your Custom Design';
                  img.style.cssText = \`
                    max-width: 150px;
                    max-height: 150px;
                    width: auto;
                    height: auto;
                    display: block;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                  \`;
                  
                  // Make image clickable to view full size
                  img.addEventListener('click', function() {
                    window.open(customImageUrl, '_blank');
                  });
                  
                  // Add hover effect
                  img.addEventListener('mouseenter', function() {
                    img.style.transform = 'scale(1.05)';
                    img.style.transition = 'transform 0.2s';
                  });
                  img.addEventListener('mouseleave', function() {
                    img.style.transform = 'scale(1)';
                  });
                  
                  // Assemble the preview
                  previewContainer.appendChild(label);
                  previewContainer.appendChild(img);
                  
                  // Inject after the product title
                  const titleElement = detailsCell.querySelector('p');
                  if (titleElement && titleElement.nextSibling) {
                    detailsCell.insertBefore(previewContainer, titleElement.nextSibling);
                  } else if (titleElement) {
                    titleElement.parentNode.insertBefore(previewContainer, titleElement.nextSibling);
                  } else {
                    // Fallback: prepend to details cell
                    detailsCell.insertBefore(previewContainer, detailsCell.firstChild);
                  }
                  
                  console.log('[Phone Case Customizer] Custom design image injected successfully');
                }
              }
            });
          }
        });
      })
      .catch(err => console.error('[Phone Case Customizer] Failed to inject custom design images:', err));
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCustomDesignImages);
  } else {
    injectCustomDesignImages();
  }
  
  // Run again after delays to catch dynamically loaded content
  setTimeout(injectCustomDesignImages, 500);
  setTimeout(injectCustomDesignImages, 1000);
  setTimeout(injectCustomDesignImages, 2000);
  
  // Listen for cart update events
  window.addEventListener('cart:updated', injectCustomDesignImages);
  window.addEventListener('cart:refresh', injectCustomDesignImages);
  document.addEventListener('cart:updated', injectCustomDesignImages);
  document.addEventListener('cart:refresh', injectCustomDesignImages);
  
  // Watch for DOM changes
  const observer = new MutationObserver(function(mutations) {
    injectCustomDesignImages();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true
  });
  
  console.log('[Phone Case Customizer] Cart injection script initialized');
})();
`;

  // Return JavaScript with proper content type
  return new Response(javascript, {
    headers: {
      "Content-Type": "text/javascript",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
    },
  });
}
