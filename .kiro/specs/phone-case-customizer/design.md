# Design Document

## Overview

The phone case customizer integration consists of three main components:

1. **React Customizer App** - Modified version of the existing phone-2 application, adapted for modal display
2. **Shopify Theme Extension** - Liquid block that embeds the customizer in product pages via a modal
3. **Shopify App Backend** - React Router API endpoints for design storage, image generation, and order processing

The system follows a hybrid architecture where the frontend (theme extension) handles UI and user interaction, while the backend (Shopify app) handles data persistence, image generation, and order fulfillment.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER BROWSER                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  Shopify Storefront (Product Page)             │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Theme Extension Block               │     │    │
│  │  │  • Customize Button                  │     │    │
│  │  │  • Modal Container                   │     │    │
│  │  │  • React App Mount Point             │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                    ↓                           │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  React Customizer (in Modal)         │     │    │
│  │  │  • Image Upload & Manipulation       │     │    │
│  │  │  • Text Addition & Styling           │     │    │
│  │  │  • Layer Management                  │     │    │
│  │  │  • Design Serialization              │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│              SHOPIFY APP (React Router)                  │
│  ┌────────────────────────────────────────────────┐    │
│  │  API Routes                                     │    │
│  │  • POST /api/save-design                       │    │
│  │    - Receive design JSON                       │    │
│  │    - Generate image (canvas)                   │    │
│  │    - Upload to Shopify Files                   │    │
│  │    - Store in database                         │    │
│  │    - Return design_id + image URL              │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Webhook Handlers                              │    │
│  │  • POST /webhooks/orders/create                │    │
│  │    - Extract design_id from line items         │    │
│  │    - Retrieve design from database             │    │
│  │    - Attach image to order                     │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Database (Prisma + SQLite)                    │    │
│  │  • Design table                                │    │
│  │    - id, shop, designData, imageUrl, orderId   │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  SHOPIFY PLATFORM                        │
│  • Files API (CDN storage for images)                   │
│  • Cart API (line item properties)                      │
│  • Admin GraphQL (order updates)                        │
│  • Webhooks (order notifications)                       │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. React Customizer App (Modified)

**Location:** `original/phone-2/src/`

**Key Modifications:**
- Add modal wrapper component
- Replace "Download" button with "Add to Cart" button
- Add design serialization function
- Add API integration for saving designs
- Scope all CSS to `.phone-case-modal` class
- Remove full-screen height constraints
- Add close handler that unmounts React app

**New Exports:**
```typescript
interface DesignData {
  images: PlacedImage[]
  texts: PlacedText[]
  layers: Layer[]
}

interface PlacedImage {
  id: string
  src: string  // base64 data URL
  name: string
  x: number
  y: number
  scale: number
  rotation: number
}

interface PlacedText {
  id: string
  content: string
  x: number
  y: number
  scale: number
  rotation: number
  fontSize: number
  color: string
  fontFamily: string
  fontWeight: string
  fontStyle: string
}

interface Layer {
  id: string
  type: 'image' | 'text'
}

// Main function to serialize current design
function serializeDesign(): DesignData

// Function to save design to backend
async function saveDesignToBackend(designData: DesignData): Promise<SaveDesignResponse>

interface SaveDesignResponse {
  designId: string
  imageUrl: string
}
```

**Build Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../extensions/hello-world/assets',
    rollupOptions: {
      output: {
        entryFileNames: 'phone-customizer.js',
        assetFileNames: 'phone-customizer.css'
      }
    }
  }
})
```

### 2. Theme Extension Block

**Location:** `extensions/hello-world/blocks/phone-case-customizer.liquid`

**Structure:**
```liquid
<!-- Trigger Button -->
<button id="customize-phone-case-btn" class="customize-btn">
  🎨 Customize Your Phone Case
</button>

<!-- Modal Container -->
<div id="phone-case-modal" class="phone-case-modal" style="display:none;">
  <div class="phone-case-modal-backdrop"></div>
  <div class="phone-case-modal-content">
    <button class="phone-case-modal-close">×</button>
    <div id="phone-case-root"></div>
  </div>
</div>

<link rel="stylesheet" href="{{ 'phone-customizer.css' | asset_url }}">
<script src="{{ 'phone-customizer.js' | asset_url }}" defer></script>

<script>
(function() {
  const modal = document.getElementById('phone-case-modal');
  const btn = document.getElementById('customize-phone-case-btn');
  const closeBtn = document.querySelector('.phone-case-modal-close');
  const backdrop = document.querySelector('.phone-case-modal-backdrop');
  
  // Open modal
  btn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });
  
  // Close modal
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Unmount React app
    const root = document.getElementById('phone-case-root');
    if (root && window.ReactDOM) {
      window.ReactDOM.unmountComponentAtNode(root);
    }
  }
  
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  
  // Handle Add to Cart from customizer
  window.addEventListener('customizer:addToCart', async function(e) {
    const { designId, imageUrl } = e.detail;
    
    // Add to Shopify cart
    const formData = {
      items: [{
        id: '{{ product.selected_or_first_available_variant.id }}',
        quantity: 1,
        properties: {
          '_design_id': designId,
          '_design_preview': imageUrl,
          'Customized': 'Yes'
        }
      }]
    };
    
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        closeModal();
        // Show success message (theme-specific)
        alert('Customized phone case added to cart!');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  });
})();
</script>

{% schema %}
{
  "name": "Phone Case Customizer",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Customize Your Phone Case"
    }
  ]
}
{% endschema %}
```

### 3. Shopify App Backend

**API Route:** `app/routes/api.save-design.tsx`

```typescript
import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { generateDesignImage, uploadToShopifyFiles } from "../utils/image-generator";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const designDataStr = formData.get('designData') as string;
    const designData = JSON.parse(designDataStr);
    
    // Generate high-res image from design data
    const imageBuffer = await generateDesignImage(designData);
    
    // Upload to Shopify Files API
    const fileUrl = await uploadToShopifyFiles(admin, imageBuffer, session.shop);
    
    // Store in database
    const design = await prisma.design.create({
      data: {
        shop: session.shop,
        designData: designDataStr,
        imageUrl: fileUrl,
      }
    });
    
    return json({
      designId: design.id,
      imageUrl: fileUrl
    });
  } catch (error) {
    console.error('Save design error:', error);
    return json({ error: 'Failed to save design' }, { status: 500 });
  }
}
```

**Webhook Handler:** `app/routes/webhooks.orders.create.tsx`

```typescript
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, payload } = await authenticate.webhook(request);
  
  try {
    // Extract design IDs from line items
    for (const item of payload.line_items) {
      const designId = item.properties?.find(
        (p: any) => p.name === '_design_id'
      )?.value;
      
      if (designId) {
        // Retrieve design from database
        const design = await prisma.design.findUnique({
          where: { id: designId }
        });
        
        if (design) {
          // Update design with order ID
          await prisma.design.update({
            where: { id: designId },
            data: { orderId: payload.id.toString() }
          });
          
          // Attach image URL to order notes
          await admin.graphql(`
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order {
                  id
                  note
                }
              }
            }
          `, {
            variables: {
              input: {
                id: payload.admin_graphql_api_id,
                note: `Design Image: ${design.imageUrl}\n${payload.note || ''}`
              }
            }
          });
        }
      }
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(null, { status: 500 });
  }
}
```

**Image Generator Utility:** `app/utils/image-generator.ts`

```typescript
import { createCanvas, loadImage } from 'canvas';

export async function generateDesignImage(designData: any): Promise<Buffer> {
  const canvas = createCanvas(600, 1000);
  const ctx = canvas.getContext('2d');
  
  // Draw background color
  ctx.fillStyle = '#ff8c69';
  ctx.fillRect(0, 0, 600, 1000);
  
  // Draw images and text based on layer order
  for (const layer of designData.layers) {
    if (layer.type === 'image') {
      const img = designData.images.find((i: any) => i.id === layer.id);
      if (img) {
        await drawImage(ctx, img);
      }
    } else if (layer.type === 'text') {
      const text = designData.texts.find((t: any) => t.id === layer.id);
      if (text) {
        drawText(ctx, text);
      }
    }
  }
  
  // Draw phone frame overlay
  const frame = await loadImage('./public/phone-frame.png');
  ctx.drawImage(frame, 0, 0, 600, 1000);
  
  return canvas.toBuffer('image/png');
}

async function drawImage(ctx: any, img: any) {
  const image = await loadImage(img.src);
  
  ctx.save();
  ctx.translate(img.x, img.y);
  ctx.rotate((img.rotation * Math.PI) / 180);
  ctx.scale(img.scale, img.scale);
  ctx.drawImage(image, -100, -100, 200, 200);
  ctx.restore();
}

function drawText(ctx: any, text: any) {
  ctx.save();
  ctx.translate(text.x, text.y);
  ctx.rotate((text.rotation * Math.PI) / 180);
  ctx.scale(text.scale, text.scale);
  
  ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
  ctx.fillStyle = text.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.content, 0, 0);
  
  ctx.restore();
}

export async function uploadToShopifyFiles(admin: any, imageBuffer: Buffer, shop: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  
  const response = await admin.graphql(`
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
      }
    }
  `, {
    variables: {
      files: [{
        alt: 'Phone Case Design',
        contentType: 'IMAGE',
        originalSource: `data:image/png;base64,${base64Image}`
      }]
    }
  });
  
  const result = await response.json();
  return result.data.fileCreate.files[0].image.url;
}
```

## Data Models

**Prisma Schema Addition:**

```prisma
model Design {
  id          String    @id @default(cuid())
  shop        String
  designData  String    // JSON string
  imageUrl    String
  orderId     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([shop])
  @@index([orderId])
  @@index([createdAt])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Modal Open Initializes Empty Canvas
*For any* modal open event, the customizer should initialize with empty placedImages and placedTexts arrays.
**Validates: Requirements 1.3**

### Property 2: Modal Close Restores Page State
*For any* modal close event, the body overflow style should be restored to its original value.
**Validates: Requirements 1.4, 9.4**

### Property 3: Image Upload Adds to Canvas
*For any* valid image file upload, a new entry should be added to the placedImages array.
**Validates: Requirements 2.1**

### Property 4: Image Drag Updates Position
*For any* image drag operation, the image's x and y coordinates should change to reflect the mouse position minus the initial drag offset.
**Validates: Requirements 2.2**

### Property 5: Image Resize Maintains Aspect Ratio
*For any* image resize operation, the scale factor should change while the image dimensions remain proportional.
**Validates: Requirements 2.3**

### Property 6: Image Rotation Updates Angle
*For any* image rotation operation, the rotation angle should update based on the angle between the image center and mouse position.
**Validates: Requirements 2.4**

### Property 7: Image Delete Removes from Canvas
*For any* image delete action, the image should be removed from both placedImages array and allLayers array.
**Validates: Requirements 2.5**

### Property 8: Text Addition Creates Canvas Element
*For any* non-empty text input, a new entry should be added to the placedTexts array with default styling properties.
**Validates: Requirements 3.1**

### Property 9: Text Content Update Reflects Immediately
*For any* text content change, the displayed text content property should match the new input value.
**Validates: Requirements 3.2**

### Property 10: Text Color Change Updates Property
*For any* text color selection, the text's color property should update to the selected color value.
**Validates: Requirements 3.3**

### Property 11: Text Font Change Updates Property
*For any* font family selection, the text's fontFamily property should update to the selected font.
**Validates: Requirements 3.4**

### Property 12: Text Manipulation Behaves Like Images
*For any* text element, drag/resize/rotate operations should use the same transformation logic as image elements.
**Validates: Requirements 3.5**

### Property 13: Design Serialization Captures All Elements
*For any* design state, serialization should produce a DesignData object containing all images, texts, and layer order.
**Validates: Requirements 4.1**

### Property 14: Save Design Calls API
*For any* serialized design, an HTTP POST request should be made to the /api/save-design endpoint.
**Validates: Requirements 4.2**

### Property 15: Backend Generates Image from Design Data
*For any* valid DesignData received by the backend, an image buffer should be generated with dimensions of at least 600x1000 pixels.
**Validates: Requirements 4.3, 10.1**

### Property 16: Generated Image Uploads to Shopify Files
*For any* generated image buffer, an upload mutation should be executed to Shopify's Files API.
**Validates: Requirements 4.4**

### Property 17: Successful Upload Creates Database Record
*For any* successful Shopify Files upload, a Design record should be created in the database with shop, designData, and imageUrl fields populated.
**Validates: Requirements 4.5, 8.1, 8.2**

### Property 18: API Returns Design ID and Image URL
*For any* successful save operation, the API response should contain both designId and imageUrl fields.
**Validates: Requirements 4.6**

### Property 19: Cart Add Includes Line Item Properties
*For any* design_id received from the backend, the cart add request should include properties with _design_id, _design_preview, and Customized fields.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 20: Successful Cart Add Closes Modal
*For any* successful cart add response, the modal should be hidden and body scroll should be restored.
**Validates: Requirements 5.5**

### Property 21: Webhook Extracts Design ID from Line Items
*For any* order webhook payload containing line items with properties, design_id values should be extracted from properties arrays.
**Validates: Requirements 7.2**

### Property 22: Design ID Lookup Retrieves Database Record
*For any* valid design_id, a database query should return the corresponding Design record with imageUrl.
**Validates: Requirements 7.3**

### Property 23: Order Update Attaches Image URL
*For any* retrieved design record, an orderUpdate GraphQL mutation should be executed to add the imageUrl to order notes.
**Validates: Requirements 7.4**

### Property 24: Order Creation Links Design to Order
*For any* order webhook with design_id, the Design record should be updated with the orderId field.
**Validates: Requirements 8.3**

### Property 25: Old Unordered Designs Marked for Cleanup
*For any* Design record older than 90 days with null orderId, the record should be identified by cleanup queries.
**Validates: Requirements 8.4**

### Property 26: Modal Open Prevents Body Scroll
*For any* modal open event, the document.body.style.overflow should be set to 'hidden'.
**Validates: Requirements 9.3**

### Property 27: Generated Image Format is PNG
*For any* image generation operation, the output buffer should be in PNG format.
**Validates: Requirements 10.4**

### Property 28: Image Upload Includes Metadata
*For any* Shopify Files upload, the mutation should include alt text and contentType metadata.
**Validates: Requirements 10.5**

## Error Handling

### Frontend Error Handling

1. **Image Upload Errors**
   - Invalid file types: Show user-friendly error message
   - File size too large: Warn user and reject upload
   - Failed to read file: Log error and show retry option

2. **API Communication Errors**
   - Network failure: Show "Please check your connection" message
   - Server error (500): Show "Something went wrong, please try again"
   - Timeout: Show "Request timed out, please try again"

3. **Cart Add Errors**
   - Failed cart add: Show error message and keep modal open
   - Invalid product variant: Alert user to select a variant

### Backend Error Handling

1. **Design Save Errors**
   - Invalid JSON: Return 400 Bad Request with error details
   - Image generation failure: Log error, return 500 with generic message
   - Shopify Files upload failure: Retry once, then return error
   - Database save failure: Rollback transaction, return error

2. **Webhook Processing Errors**
   - Missing design_id: Skip processing, log warning
   - Design not found: Log error, continue processing other items
   - Order update failure: Log error, retry with exponential backoff
   - Database update failure: Log error for manual review

3. **Authentication Errors**
   - Invalid session: Return 401 Unauthorized
   - Missing permissions: Return 403 Forbidden

## Testing Strategy

### Unit Tests

**Frontend (React Customizer):**
- Test image upload handler adds to state
- Test drag/resize/rotate calculations
- Test design serialization produces valid JSON
- Test API integration calls correct endpoint
- Test modal open/close state management

**Backend (Shopify App):**
- Test design save endpoint validates input
- Test image generator produces correct dimensions
- Test Shopify Files upload mutation format
- Test webhook handler extracts design_id correctly
- Test database queries and updates

### Property-Based Tests

**Configuration:** Minimum 100 iterations per test using fast-check library

**Frontend Properties:**
- **Property 1-12:** Test React state transformations with random inputs
- **Property 13:** Test serialization with randomly generated designs
- **Property 19:** Test cart add with random design_id values

**Backend Properties:**
- **Property 15:** Test image generation with random design data
- **Property 17:** Test database creation with random shop names
- **Property 21-24:** Test webhook processing with random order payloads
- **Property 25:** Test cleanup logic with random date ranges

**Test Tags Format:**
```typescript
// Feature: phone-case-customizer, Property 1: Modal Open Initializes Empty Canvas
test('modal open initializes empty canvas', async () => {
  await fc.assert(
    fc.asyncProperty(fc.anything(), async () => {
      // Test implementation
    }),
    { numRuns: 100 }
  );
});
```

### Integration Tests

1. **End-to-End Flow:**
   - Open modal → customize → save → add to cart → verify cart contents
   - Create order → webhook fires → design attached to order

2. **API Integration:**
   - Test save-design endpoint with real Shopify Files API (staging)
   - Test webhook handler with mock Shopify payloads

3. **Database Integration:**
   - Test design CRUD operations
   - Test cleanup queries with test data

## Performance Considerations

1. **Image Generation:** Use worker threads for canvas operations to avoid blocking
2. **File Uploads:** Implement retry logic with exponential backoff
3. **Database Queries:** Add indexes on shop, orderId, and createdAt fields
4. **Frontend Bundle:** Code-split React app to reduce initial load time
5. **CSS Scoping:** Use CSS modules or scoped selectors to minimize style conflicts

## Security Considerations

1. **Input Validation:** Validate all design data on backend before processing
2. **File Upload:** Limit file sizes and validate image formats
3. **API Authentication:** Require valid Shopify session for all API calls
4. **XSS Prevention:** Sanitize user text input before rendering
5. **CSRF Protection:** Use Shopify's built-in CSRF tokens for cart operations
