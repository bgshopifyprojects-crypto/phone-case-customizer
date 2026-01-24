# Implementation Plan: Responsive Design for Phone Case Customizer

## Overview

This implementation plan breaks down the responsive design improvements into discrete, manageable tasks. The approach follows a mobile-first methodology, starting with critical mobile fixes and progressively enhancing for larger screens.

## Tasks

- [x] 1. Set up responsive infrastructure
  - [x] 1.1 Add viewport meta tag to liquid template
    - Ensure `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is present
    - Prevent zoom on input focus with `maximum-scale=1.0` if needed
    - _Requirements: 1.1_

  - [x] 1.2 Create mobile-first CSS structure
    - Reorganize App.css to start with mobile base styles
    - Add breakpoint comments for clarity
    - Group related responsive rules together
    - _Requirements: 1.1_

  - [x] 1.3 Add CSS custom properties for breakpoints
    - Define breakpoint values as CSS variables
    - Create reusable spacing scale
    - Define touch target minimum sizes
    - _Requirements: 1.1, 3.1_

- [x] 2. Fix critical mobile layout issues
  - [x] 2.1 Make modal full-screen on mobile
    - Change modal to 100vw × 100vh on screens < 768px
    - Remove border-radius on mobile for full-screen feel
    - Adjust close button position for mobile
    - _Requirements: 6.1, 6.3_

  - [x] 2.2 Scale phone case dynamically
    - Add responsive width/height using CSS clamp() or media queries
    - Scale to 70% on < 480px, 85% on 480-767px, 100% on 768px+
    - Ensure placed images/text scale proportionally
    - Test that control buttons remain usable at all scales
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Make upload section responsive
    - Hide upload section by default on mobile (< 768px)
    - Create slide-out drawer with toggle button
    - Set width to 85vw (max 320px) on mobile
    - Set width to 300px on tablets, 380px on desktop
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.4 Transform sidebar for mobile
    - Move sidebar to bottom on screens < 768px
    - Change flex-direction to row
    - Set height to 60px, width to 100%
    - Adjust icon sizes and spacing for horizontal layout
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Fix modal close button visibility
  - [x] 3.1 Identify z-index stacking context issue
    - Close button in liquid template was in different stacking context from React app
    - Top menu (z-index: 100) inside React was covering close button (z-index: 200) outside React
    - Child elements cannot escape parent's stacking context regardless of z-index
    - _Issue discovered during implementation_

  - [x] 3.2 Create close button inside React component
    - Move close button from liquid template to React component
    - Position at same level as upload-drawer-toggle for proper stacking
    - Style as rounded square (6px border-radius) with dark background (#2c3e50)
    - Add white border (2px) and hover effect matching top menu style
    - _Solution: Create button in React at same stacking level as other controls_

  - [x] 3.3 Remove old liquid template close button
    - Remove `<button class="phone-case-modal-close">` from liquid template
    - Remove associated CSS styles from liquid template
    - Update JavaScript to remove closeBtn event listener
    - Keep backdrop click-to-close functionality
    - _Cleanup: Remove obsolete code_

  - [x] 3.4 Test close button at all screen sizes
    - Desktop: 30px × 30px at top: 15px, right: 15px
    - Mobile: 30px × 30px at top: 10px, right: 10px
    - Verify button appears on top of all elements
    - Confirm hover and click interactions work correctly
    - _Testing: Verified on dev server_

- [x] 3. Optimize touch interactions
  - [x] 3.1 Increase touch target sizes
    - Set min-width and min-height to 44px for all interactive elements
    - Update .image-delete-btn, .image-rotate-handle, .image-resize-handle
    - Update .sidebar-icon, .category-btn, .upload-btn
    - Add padding to maintain visual size while increasing hit area
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.2 Improve touch event handling
    - Add touch-action: manipulation to prevent double-tap zoom
    - Improve drag tracking for touch events
    - Add visual feedback for touch interactions (active states)
    - _Requirements: 3.2, 3.3_

  - [x] 3.3 Add spacing between touch targets
    - Ensure minimum 8px gap between adjacent interactive elements
    - Update grid gaps, button groups, and control clusters
    - _Requirements: 3.4_

- [x] 4. Fix typography for mobile
  - [x] 4.1 Increase minimum font sizes
    - Set base font size to 14px on mobile (currently 10px in some places)
    - Update .sidebar-text from 0.65rem to 0.75rem (desktop) / 0.875rem (mobile)
    - Update .download-btn and .add-to-cart-btn text to 0.75rem (desktop) / 0.875rem (mobile)
    - Ensure all labels are at least 12px
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 4.2 Optimize text for readability
    - Increase line-height to 1.5 for body text on mobile
    - Prevent text wrapping issues in buttons
    - Ensure error/warning text is 16px minimum
    - _Requirements: 9.4, 9.5_

- [x] 5. Reduce padding on small screens
  - [x] 5.1 Create responsive padding scale
    - Set padding to 0.5rem (8px) on < 480px
    - Set padding to 1rem (16px) on 480-767px
    - Set padding to 2rem (32px) on 768px+
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 5.2 Apply responsive padding to sections
    - Update .phone-section padding
    - Update .upload-section padding
    - Update .text-edit-panel padding
    - Ensure content doesn't feel cramped
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.3 Optimize button spacing
    - Scale gap between buttons based on screen size
    - Update .phone-controls gap
    - Update .text-edit-icons gap
    - _Requirements: 8.5_

- [x] 6. Make grids responsive
  - [x] 6.1 Adapt gallery grid
    - Set to 1 column on < 480px
    - Set to 2 columns on 480-767px
    - Keep 2 columns on 768px+
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 6.2 Adapt assets grid
    - Set to 2 columns on < 480px
    - Set to 3 columns on 480px+
    - Adjust item sizes for better touch targets
    - _Requirements: 10.4_

  - [x] 6.3 Optimize grid spacing
    - Set gap to 0.5rem on mobile
    - Set gap to 0.75rem on tablet
    - Set gap to 1rem on desktop
    - _Requirements: 10.5_

- [x] 7. Handle phone controls on mobile
  - [x] 7.1 Stack controls vertically on mobile
    - Change .phone-controls to flex-direction: column on < 480px
    - Set button width to 100% when stacked
    - Maintain horizontal layout on 480px+
    - _Requirements: 11.1, 11.4_

  - [x] 7.2 Enable button wrapping on tablets
    - Add flex-wrap: wrap on 480-767px
    - Maintain consistent spacing when wrapped
    - _Requirements: 11.2, 11.3_

  - [x] 7.3 Prevent text truncation
    - Ensure button text doesn't overflow
    - Use appropriate font sizes for button text
    - Test with long translated text
    - _Requirements: 11.5_

- [x] 8. Optimize text edit panel for mobile
  - [x] 8.1 Stack text edit controls vertically
    - Change .text-edit-icons to flex-direction: column on < 480px
    - Increase button sizes to 44px minimum
    - Adjust spacing for vertical layout
    - _Requirements: 12.1, 12.2_

  - [x] 8.2 Optimize form controls for touch
    - Increase color picker size for easier tapping
    - Make font selector dropdown larger
    - Ensure text input has 16px font to prevent zoom
    - _Requirements: 12.3, 12.4_

  - [x] 8.3 Position panel to not cover preview
    - On mobile, position panel at bottom or as overlay
    - Add close button for panel on mobile
    - Ensure phone case remains visible when editing
    - _Requirements: 12.5_

- [ ] 9. Add landscape mode support
  - [ ] 9.1 Detect and handle landscape orientation
    - Add media query for landscape: `@media (max-height: 600px) and (orientation: landscape)`
    - Reduce phone case size to fit height
    - Adjust sidebar height to be thinner
    - _Requirements: 7.1, 7.2_

  - [ ] 9.2 Optimize layout for landscape
    - Center phone case with controls on sides
    - Make upload section slide-out from right
    - Reduce top menu height
    - _Requirements: 7.3, 7.4_

  - [x] 9.3 Preserve state on orientation change
    - Test that design data persists when rotating
    - Ensure no layout shift issues
    - Verify all controls remain accessible
    - _Requirements: 7.5_

- [x] 10. Add upload section drawer functionality
  - [x] 10.1 Create toggle button for mobile
    - Add floating button to open upload drawer
    - Position button in top-right or bottom-right
    - Style button to be obvious and accessible
    - _Requirements: 5.4_

  - [x] 10.2 Implement drawer slide animation
    - Add CSS transition for smooth slide-in/out
    - Use transform for better performance
    - Add backdrop overlay when drawer is open
    - _Requirements: 5.1_

  - [x] 10.3 Handle drawer state management
    - Add open/close state to React component
    - Close drawer when image is selected
    - Add close button inside drawer
    - _Requirements: 5.1, 5.4_

- [x] 11. Optimize top menu for mobile
  - [x] 11.1 Adjust top menu layout
    - Remove left padding compensation for sidebar on mobile
    - Center buttons or align appropriately
    - Reduce height to 50px on mobile
    - _Requirements: 1.1_

  - [x] 11.2 Optimize button sizes and text
    - Ensure buttons are tappable (44px minimum)
    - Consider icon-only buttons on very small screens
    - Add tooltips for icon-only buttons
    - _Requirements: 3.1, 9.1_

- [ ] 12. Add keyboard handling for mobile
  - [ ] 12.1 Detect keyboard open/close
    - Use visualViewport API to detect keyboard
    - Adjust modal padding when keyboard opens
    - Scroll active input into view
    - _Requirements: 6.4_

  - [ ] 12.2 Prevent content from being hidden
    - Add bottom padding equal to keyboard height
    - Ensure submit buttons remain visible
    - Test on iOS and Android
    - _Requirements: 6.4_

- [x] 13. Test and refine
  - [ ] 13.1 Test on real devices
    - Test on iPhone SE (375px)
    - Test on iPhone 12 (390px)
    - Test on iPad Mini (768px)
    - Test on Android phones (360px, 412px)
    - _Requirements: All_

  - [ ] 13.2 Test orientation changes
    - Test portrait to landscape transitions
    - Test landscape to portrait transitions
    - Verify no data loss or layout breaks
    - _Requirements: 7.5_

  - [ ] 13.3 Test touch interactions
    - Verify all buttons are tappable
    - Test drag/resize/rotate on touch
    - Check for any double-tap zoom issues
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 13.4 Performance testing
    - Check for layout shifts (CLS)
    - Verify 60fps during animations
    - Test on low-end devices
    - _Requirements: All_

- [ ] 14. Build and deploy
  - [ ] 14.1 Rebuild React app
    - Run `npm run build` in original/phone-2
    - Verify CSS file size is reasonable
    - Check that all responsive styles are included
    - _Requirements: All_

  - [ ] 14.2 Deploy to dev store
    - Deploy theme extension with updated CSS
    - Test on actual Shopify store
    - Verify no conflicts with theme styles
    - _Requirements: All_

## Notes

- All tasks should be tested on real devices, not just browser DevTools
- Touch target sizes follow WCAG 2.1 Level AAA guidelines (44px minimum)
- Mobile-first approach means base styles are for mobile, then enhanced for larger screens
- Performance is critical - use CSS transforms and avoid layout thrashing
- Test with actual content (long text, many images) to catch edge cases
