# Implementation Plan: Phone Case Customizer

## Overview

This implementation plan breaks down the phone case customizer integration into discrete, manageable tasks. The approach follows a phased implementation: first modify the React customizer, then create the theme extension, then build the backend API, and finally integrate everything together.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create database migration for Design model
  - Install required npm packages (canvas, fast-check for testing)
  - Configure Vite build for theme extension output
  - _Requirements: 8.1_

- [x] 2. Modify React Customizer for Modal Use
  - [x] 2.1 Add modal wrapper component to App.jsx
    - Wrap entire app in `.phone-case-modal` container
    - Remove full-screen height constraints from CSS
    - Update App.css to scope all styles to `.phone-case-modal`
    - _Requirements: 9.1, 9.2_

  - [x] 2.2 Add "Add to Cart" button alongside Download button
    - Keep existing download button and modal functionality
    - Add "Add to Cart" button in top menu next to download button
    - Add loading state for save operation
    - _Requirements: 4.1_

  - [x] 2.3 Implement design serialization function
    - Create `serializeDesign()` function that exports placedImages, placedTexts, and allLayers
    - Ensure all image data is in base64 format
    - Validate serialized data structure
    - _Requirements: 4.1_

  - [ ]* 2.4 Write property test for design serialization
    - **Property 13: Design Serialization Captures All Elements**
    - **Validates: Requirements 4.1**

  - [x] 2.5 Implement API integration for saving designs
    - Create `saveDesignToBackend()` async function
    - Make POST request to `/api/save-design` with design data
    - Handle response with designId and imageUrl
    - Handle errors with user-friendly messages
    - _Requirements: 4.2, 4.6_

  - [ ]* 2.6 Write property test for API integration
    - **Property 14: Save Design Calls API**
    - **Validates: Requirements 4.2**

  - [x] 2.7 Dispatch custom event for cart integration
    - On successful save, dispatch `customizer:addToCart` event with designId and imageUrl
    - Include error handling for event dispatch
    - _Requirements: 5.1_

  - [ ]* 2.8 Write unit tests for React components
    - Test modal open/close state
    - Test image upload handler
    - Test text addition handler
    - Test drag/resize/rotate handlers
    - _Requirements: 1.2, 1.3, 1.4, 2.1-2.5, 3.1-3.5_

- [x] 3. Update Vite build configuration
  - [x] 3.1 Configure build output for Shopify
    - Set outDir to `../../extensions/hello-world/assets`
    - Configure output file names: `phone-customizer.js` and `phone-customizer.css`
    - Enable source maps for debugging
    - _Requirements: 9.1_

  - [x] 3.2 Build and verify output files
    - Run `npm run build` in original/phone-2
    - Verify files are created in extensions/hello-world/assets
    - Check file sizes are reasonable (<1MB for JS)
    - _Requirements: 9.1_

- [x] 4. Create Theme Extension Block
  - [x] 4.1 Create phone-case-customizer.liquid file
    - Add customize button with configurable text
    - Add modal container with backdrop and close button
    - Add `#phone-case-root` mount point for React
    - Include schema with button_text setting
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 4.2 Write example test for button rendering
    - Test that button element exists when block is added
    - **Validates: Requirements 1.1**

  - [x] 4.3 Add modal open/close JavaScript
    - Implement button click handler to show modal
    - Implement close button and backdrop click handlers
    - Add body scroll prevention on modal open
    - Add body scroll restoration on modal close
    - _Requirements: 1.2, 1.4, 9.3, 9.4_

  - [ ]* 4.4 Write property test for modal state management
    - **Property 1: Modal Open Initializes Empty Canvas**
    - **Property 2: Modal Close Restores Page State**
    - **Property 26: Modal Open Prevents Body Scroll**
    - **Validates: Requirements 1.3, 1.4, 9.3, 9.4**

  - [x] 4.5 Add customizer:addToCart event listener
    - Listen for custom event from React app
    - Extract designId and imageUrl from event detail
    - Call Shopify cart add API with line item properties
    - Handle success: close modal and show message
    - Handle errors: show error message and keep modal open
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.6 Write property test for cart integration
    - **Property 19: Cart Add Includes Line Item Properties**
    - **Property 20: Successful Cart Add Closes Modal**
    - **Validates: Requirements 5.1-5.5**

  - [x] 4.7 Load customizer assets
    - Add link tag for phone-customizer.css with asset_url filter
    - Add script tag for phone-customizer.js with asset_url filter and defer attribute
    - _Requirements: 1.2_

- [x] 5. Checkpoint - Test theme extension locally
  - Deploy extension with `npm run deploy`
  - Add block to product page in theme editor
  - Test modal open/close functionality
  - Verify React app loads in modal
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create Database Migration
  - [x] 6.1 Add Design model to Prisma schema
    - Add Design model with id, shop, designData, imageUrl, orderId, createdAt, updatedAt fields
    - Add indexes on shop, orderId, and createdAt
    - _Requirements: 8.1, 8.2_

  - [x] 6.2 Run Prisma migration
    - Generate migration with `npx prisma migrate dev --name add-design-model`
    - Verify migration creates Design table
    - _Requirements: 8.1_

- [x] 7. Create Image Generator Utility
  - [x] 7.1 Install canvas package
    - Run `npm install canvas` in project root
    - Add @types/canvas for TypeScript support
    - _Requirements: 4.3_

  - [x] 7.2 Implement generateDesignImage function
    - Create app/utils/image-generator.ts
    - Implement canvas-based image generation from DesignData
    - Draw background, images, texts in layer order
    - Draw phone frame overlay
    - Return PNG buffer at 600x1000 resolution
    - _Requirements: 4.3, 10.1, 10.2, 10.4_

  - [ ]* 7.3 Write property test for image generation
    - **Property 15: Backend Generates Image from Design Data**
    - **Property 27: Generated Image Format is PNG**
    - **Validates: Requirements 4.3, 10.1, 10.4**

  - [x] 7.4 Implement uploadToShopifyFiles function
    - Convert buffer to base64
    - Create fileCreate GraphQL mutation
    - Execute mutation with admin API
    - Extract and return image URL from response
    - _Requirements: 4.4, 10.5_

  - [ ]* 7.5 Write property test for file upload
    - **Property 16: Generated Image Uploads to Shopify Files**
    - **Property 28: Image Upload Includes Metadata**
    - **Validates: Requirements 4.4, 10.5**

- [x] 8. Create Save Design API Route
  - [x] 8.1 Create app/routes/api.save-design.tsx
    - Add action function with authentication
    - Parse designData from form data
    - Call generateDesignImage with design data
    - Call uploadToShopifyFiles with image buffer
    - Create Design record in database
    - Return JSON with designId and imageUrl
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.2 Write property tests for save design endpoint
    - **Property 17: Successful Upload Creates Database Record**
    - **Property 18: API Returns Design ID and Image URL**
    - **Validates: Requirements 4.5, 4.6, 8.1, 8.2**

  - [x] 8.3 Add error handling
    - Validate design data structure
    - Handle image generation errors
    - Handle upload errors with retry logic
    - Handle database errors
    - Return appropriate HTTP status codes
    - _Requirements: 4.2-4.6_

  - [ ]* 8.4 Write unit tests for error cases
    - Test invalid JSON handling
    - Test image generation failure
    - Test upload failure
    - Test database failure
    - _Requirements: 4.2-4.6_

- [x] 9. Create Order Webhook Handler
  - [x] 9.1 Create app/routes/webhooks.orders.create.tsx
    - Add action function with webhook authentication
    - Extract line items from payload
    - Loop through line items to find design_id properties
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.2 Write property test for design ID extraction
    - **Property 21: Webhook Extracts Design ID from Line Items**
    - **Validates: Requirements 7.2**

  - [x] 9.3 Implement design retrieval and order update
    - Query database for Design by design_id
    - Update Design record with orderId
    - Create orderUpdate GraphQL mutation
    - Append imageUrl to order notes
    - _Requirements: 7.3, 7.4, 8.3_

  - [ ]* 9.4 Write property tests for webhook processing
    - **Property 22: Design ID Lookup Retrieves Database Record**
    - **Property 23: Order Update Attaches Image URL**
    - **Property 24: Order Creation Links Design to Order**
    - **Validates: Requirements 7.3, 7.4, 8.3**

  - [x] 9.5 Add error handling
    - Handle missing design_id gracefully
    - Handle design not found errors
    - Handle order update failures with retry
    - Log errors for manual review
    - _Requirements: 7.2-7.4_

  - [ ]* 9.6 Write unit tests for webhook error cases
    - Test missing design_id
    - Test design not found
    - Test order update failure
    - _Requirements: 7.2-7.4_

- [x] 10. Register Order Webhook
  - [x] 10.1 Add webhook subscription to shopify.app.toml
    - Add orders/create webhook subscription
    - Set URI to /webhooks/orders/create
    - _Requirements: 7.1_

  - [x] 10.2 Deploy and verify webhook registration
    - Run `npm run deploy`
    - Check Shopify admin for webhook subscription
    - Test webhook with test order
    - _Requirements: 7.1_

- [ ] 11. Implement Design Cleanup Logic
  - [ ] 11.1 Create cleanup utility function
    - Create app/utils/design-cleanup.ts
    - Implement query for designs older than 90 days with null orderId
    - Implement delete operation for old designs
    - _Requirements: 8.4_

  - [ ]* 11.2 Write property test for cleanup logic
    - **Property 25: Old Unordered Designs Marked for Cleanup**
    - **Validates: Requirements 8.4**

  - [ ] 11.3 Create scheduled job for cleanup
    - Add cron job or scheduled task to run cleanup weekly
    - Log cleanup operations
    - _Requirements: 8.4_

- [ ] 12. Checkpoint - Integration testing
  - Test complete flow: customize → save → add to cart → checkout → order created
  - Verify design image appears in order notes
  - Test error scenarios
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Add Frontend Error Handling
  - [ ] 13.1 Add error states to React app
    - Add error state for image upload failures
    - Add error state for API save failures
    - Add error state for cart add failures
    - Display user-friendly error messages
    - _Requirements: 4.2, 5.1_

  - [ ] 13.2 Add loading states
    - Add loading spinner during save operation
    - Disable Add to Cart button while saving
    - Show progress feedback to user
    - _Requirements: 4.2_

- [ ] 14. Performance Optimization
  - [ ] 14.1 Optimize image generation
    - Use worker threads for canvas operations
    - Add caching for phone frame image
    - _Requirements: 4.3_

  - [ ] 14.2 Optimize frontend bundle
    - Enable code splitting in Vite config
    - Lazy load heavy dependencies
    - Minimize CSS output
    - _Requirements: 1.2_

- [ ] 15. Security Hardening
  - [ ] 15.1 Add input validation
    - Validate design data structure on backend
    - Limit image sizes and formats
    - Sanitize text content
    - _Requirements: 4.2, 4.3_

  - [ ] 15.2 Add rate limiting
    - Limit API calls per shop
    - Prevent abuse of save endpoint
    - _Requirements: 4.2_

- [ ] 16. Documentation
  - [ ] 16.1 Add README for customizer modifications
    - Document build process
    - Document API integration
    - Document event system
    - _Requirements: All_

  - [ ] 16.2 Add merchant documentation
    - How to add customizer block to theme
    - How to access design images from orders
    - Troubleshooting guide
    - _Requirements: 1.1, 7.5_

- [ ] 17. Final checkpoint - Production readiness
  - Run full test suite
  - Test on multiple browsers
  - Test on mobile devices
  - Verify all error handling works
  - Check performance metrics
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
