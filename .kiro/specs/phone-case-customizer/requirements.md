# Requirements Document

## Introduction

This document specifies the requirements for integrating a phone case customizer into a Shopify store. The system allows customers to customize phone cases with images and text, add customized products to their cart, and ensures merchants receive the customization details with orders.

## Glossary

- **Customizer**: The React-based phone case design application
- **Theme_Extension**: Shopify theme app extension that embeds the customizer
- **Design_Data**: JSON representation of customer's customization (images, text, positions, transformations)
- **Design_Image**: Final rendered image of the customized phone case
- **Shopify_App**: Backend React Router application handling design storage and order processing
- **Line_Item_Properties**: Custom properties attached to cart items in Shopify
- **Merchant**: Store owner who fulfills orders

## Requirements

### Requirement 1: Display Customizer on Product Pages

**User Story:** As a customer, I want to access a phone case customizer from product pages, so that I can create a personalized design.

#### Acceptance Criteria

1. WHEN a customer views a product page with the customizer block, THE Theme_Extension SHALL display a "Customize Your Phone Case" button
2. WHEN a customer clicks the customize button, THE Theme_Extension SHALL open a modal containing the Customizer
3. WHEN the modal opens, THE Customizer SHALL initialize with an empty canvas ready for customization
4. WHEN a customer clicks outside the modal or presses the close button, THE Theme_Extension SHALL close the modal and unmount the Customizer

### Requirement 2: Enable Image Customization

**User Story:** As a customer, I want to upload and manipulate images on the phone case, so that I can create a unique design.

#### Acceptance Criteria

1. WHEN a customer uploads an image, THE Customizer SHALL display the image on the phone case canvas
2. WHEN a customer drags an image, THE Customizer SHALL update the image position in real-time
3. WHEN a customer resizes an image, THE Customizer SHALL scale the image proportionally
4. WHEN a customer rotates an image, THE Customizer SHALL rotate the image around its center point
5. WHEN a customer deletes an image, THE Customizer SHALL remove the image from the canvas

### Requirement 3: Enable Text Customization

**User Story:** As a customer, I want to add and style text on the phone case, so that I can include personalized messages.

#### Acceptance Criteria

1. WHEN a customer adds text, THE Customizer SHALL place the text on the phone case canvas
2. WHEN a customer changes text content, THE Customizer SHALL update the displayed text immediately
3. WHEN a customer changes text color, THE Customizer SHALL apply the new color to the text
4. WHEN a customer changes font family, THE Customizer SHALL render the text in the selected font
5. WHEN a customer manipulates text (drag/resize/rotate), THE Customizer SHALL behave identically to image manipulation

### Requirement 4: Save Design to Backend

**User Story:** As a customer, I want my design to be saved when I add to cart, so that my customization is preserved.

#### Acceptance Criteria

1. WHEN a customer clicks "Add to Cart", THE Customizer SHALL serialize all design elements into Design_Data JSON format
2. WHEN Design_Data is created, THE Customizer SHALL send the data to the Shopify_App API endpoint
3. WHEN the Shopify_App receives Design_Data, THE Shopify_App SHALL generate a Design_Image using canvas rendering
4. WHEN the Design_Image is generated, THE Shopify_App SHALL upload the image to Shopify Files API
5. WHEN the upload completes, THE Shopify_App SHALL store the Design_Data and image URL in the database
6. WHEN storage completes, THE Shopify_App SHALL return a design_id and preview image URL to the Customizer

### Requirement 5: Add Customized Product to Cart

**User Story:** As a customer, I want to add my customized phone case to the cart, so that I can purchase it.

#### Acceptance Criteria

1. WHEN the Customizer receives a design_id from the backend, THE Theme_Extension SHALL add the product to cart with Line_Item_Properties
2. WHEN adding to cart, THE Line_Item_Properties SHALL include the design_id
3. WHEN adding to cart, THE Line_Item_Properties SHALL include a preview image URL
4. WHEN adding to cart, THE Line_Item_Properties SHALL include a "Customized: Yes" property
5. WHEN the cart add succeeds, THE Theme_Extension SHALL close the modal and show a success message

### Requirement 6: Display Customization in Cart

**User Story:** As a customer, I want to see my customization details in the cart, so that I can verify my design before checkout.

#### Acceptance Criteria

1. WHEN a customer views their cart, THE Cart SHALL display the preview image for customized items
2. WHEN a customer views their cart, THE Cart SHALL display "Customized" label for customized items
3. WHEN a customer views line item properties, THE Cart SHALL show the design_id (hidden from customer view)

### Requirement 7: Deliver Design to Merchant

**User Story:** As a merchant, I want to receive the customer's design image with orders, so that I can fulfill customized products accurately.

#### Acceptance Criteria

1. WHEN an order is created with a customized item, THE Shopify_App SHALL receive an orders/create webhook
2. WHEN the webhook is received, THE Shopify_App SHALL extract the design_id from Line_Item_Properties
3. WHEN the design_id is extracted, THE Shopify_App SHALL retrieve the high-resolution Design_Image from the database
4. WHEN the Design_Image is retrieved, THE Shopify_App SHALL attach the image URL to the order via order notes or metafields
5. WHEN the merchant views the order, THE Merchant SHALL see the Design_Image URL and be able to download it

### Requirement 8: Handle Design Data Persistence

**User Story:** As a system administrator, I want design data to be stored reliably, so that no customer customizations are lost.

#### Acceptance Criteria

1. WHEN Design_Data is saved, THE Shopify_App SHALL store it in a database with a unique design_id
2. WHEN Design_Data is saved, THE Shopify_App SHALL associate it with the shop domain
3. WHEN an order is created, THE Shopify_App SHALL link the design_id to the order_id in the database
4. WHEN Design_Data is older than 90 days and not associated with an order, THE Shopify_App SHALL mark it for cleanup

### Requirement 9: Scope CSS for Theme Compatibility

**User Story:** As a theme developer, I want the customizer styles to not conflict with theme styles, so that the store's design remains intact.

#### Acceptance Criteria

1. WHEN the Customizer loads, THE Theme_Extension SHALL wrap all customizer content in a scoped container
2. WHEN customizer CSS is applied, THE CSS SHALL only target elements within the scoped container
3. WHEN the modal is open, THE Theme_Extension SHALL prevent body scroll without affecting theme layout
4. WHEN the modal closes, THE Theme_Extension SHALL restore original page state

### Requirement 10: Generate High-Quality Design Images

**User Story:** As a merchant, I want high-resolution design images, so that I can print phone cases with good quality.

#### Acceptance Criteria

1. WHEN generating a Design_Image, THE Shopify_App SHALL render at 600x1000 pixels minimum
2. WHEN generating a Design_Image, THE Shopify_App SHALL include the phone case frame overlay
3. WHEN generating a Design_Image, THE Shopify_App SHALL preserve all image quality and text clarity
4. WHEN generating a Design_Image, THE Shopify_App SHALL output in PNG format for transparency support
5. WHEN the Design_Image is complete, THE Shopify_App SHALL upload it to Shopify Files API with appropriate metadata
