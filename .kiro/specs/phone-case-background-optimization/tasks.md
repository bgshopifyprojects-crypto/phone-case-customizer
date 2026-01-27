# Implementation Plan: Phone Case Background Optimization

## Overview

This implementation replaces the solid orange background with phone-case.png image and eliminates pixel-by-pixel manipulation for design-only image generation. The changes are focused on CSS styling and the `saveDesignToBackend` function, with additional improvements for loading feedback and image pre-loading.

## Tasks

- [ ] 1. Update CSS to use phone-case.png as background
  - Modify `.phone-screen` class in `phone-case-customizer/src/App.css` (around line 632)
  - Replace `background: #ff8c69;` with `background-image: url('/phone-case.png');`
  - Add `background-size: cover;`, `background-position: center;`, `background-repeat: no-repeat;`
  - Test that background displays correctly in browser
  - _Requirements: 1.1_

- [ ] 2. Add image pre-loading on component mount
  - Add new `useEffect` hook in `phone-case-customizer/src/App.jsx`
  - Pre-load phone-case.png and frame image
  - Ensure images are cached before user triggers capture
  - _Requirements: 5.3_

- [ ] 3. Add loading overlay component and state
  - [ ] 3.1 Add `isCapturing` state variable
    - Add `const [isCapturing, setIsCapturing] = useState(false)` to state declarations
    - _Requirements: 7.1, 7.3_
  
  - [ ] 3.2 Create loading overlay JSX component
    - Add overlay div with spinner and "Generating images..." text
    - Conditionally render based on `isCapturing` state
    - _Requirements: 7.1, 7.4_
  
  - [ ] 3.3 Add loading overlay CSS styles
    - Create `.capture-overlay` and `.capture-spinner` classes
    - Add spin animation keyframes
    - Style overlay to cover entire screen with semi-transparent background
    - _Requirements: 7.1, 7.2_

- [ ] 4. Modify Complete Image generation to use phone-case.png
  - [ ] 4.1 Update Complete Image generation logic (lines ~1670-1695)
    - Load phone-case.png as first layer
    - Draw phone-case.png to canvas at correct position
    - Draw design elements canvas on top
    - Draw frame as final layer
    - Maintain proper error handling for image loading
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 4.2 Write property test for Complete Image layer order
    - **Property 2: Complete Image Layer Order**
    - **Validates: Requirements 3.2, 3.3**

- [ ] 5. Modify Empty Case Image generation to use phone-case.png
  - [ ] 5.1 Update Empty Case Image generation logic (lines ~1697-1717)
    - Replace `fillRect` with phone-case.png loading and drawing
    - Draw phone-case.png as background
    - Draw frame on top
    - Ensure no design elements are included
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 5.2 Write property test for Empty Case Image composition
    - **Property 4: Empty Case Image Composition**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 6. Simplify Design-Only Image generation
  - [ ] 6.1 Remove pixel manipulation code (lines ~1719-1763)
    - Delete temporary canvas creation
    - Delete pixel data extraction (`getImageData`)
    - Delete pixel iteration loop (819,200 iterations)
    - Delete color matching and transparency logic
    - Replace with direct canvas drawing
    - _Requirements: 2.1, 2.2_
  
  - [ ] 6.2 Implement simplified Design-Only generation
    - Draw captured canvas directly to final canvas
    - Rely on html2canvas transparent background
    - Ensure proper positioning (xOffset, screenWidth, screenHeight)
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 6.3 Write property test for Design-Only transparent background
    - **Property 1: Design-Only Image Contains Only Transparent Background**
    - **Validates: Requirements 2.3, 2.4**
  
  - [ ]* 6.4 Write property test for Design-Only performance
    - **Property 5: Design-Only Generation Performance**
    - **Validates: Requirements 5.2**

- [ ] 7. Integrate loading overlay with capture process
  - Update `saveDesignToBackend` function to set `isCapturing` state
  - Set `isCapturing = true` at start of capture
  - Set `isCapturing = false` in finally block
  - Ensure overlay shows during entire capture process
  - _Requirements: 7.1, 7.3_

- [ ]* 8. Write property test for generated image dimensions
  - **Property 3: Generated Image Dimensions**
  - **Validates: Requirements 3.4, 4.4**

- [ ]* 9. Write property test for loading overlay lifecycle
  - **Property 6: Loading Overlay Lifecycle**
  - **Validates: Requirements 7.1, 7.3**

- [ ]* 10. Write unit tests for implementation details
  - Test CSS background property is set correctly
  - Test image pre-loading on mount
  - Test CORS attributes on Image objects
  - Test error handling for image loading failures
  - Test no pixel manipulation code exists
  - _Requirements: 1.1, 2.2, 5.3, 8.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Test manually on desktop and mobile browsers
  - Measure performance improvement (should be 40-60% faster)
  - Ask the user if questions arise

- [ ] 12. Build and deploy to test environment
  - Run `npm run build` in `phone-case-customizer` folder
  - Run `npm run deploy` from root directory
  - Test on production URL: https://phone-case-customizer-vfql.onrender.com
  - Test on Shopify store: https://phone-case-test-2.myshopify.com/products/custom-phone-case
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The main performance improvement comes from task 6 (removing pixel manipulation)
- Task 3 (loading overlay) improves user experience during the 200ms delay
- Task 2 (image pre-loading) eliminates loading delays during capture
- Manual testing is required for visual verification across browsers and devices
- Performance should be measured using browser DevTools Performance tab
