# Responsive Design Testing Checklist

## Testing Overview
This checklist covers all responsive design features that need to be tested on real devices and in Chrome DevTools.

---

## 1. Device Testing Matrix (Task 13.1)

### Priority Devices to Test:

#### High Priority
- [ ] **iPhone SE (375×667)** - Portrait
- [ ] **iPhone 12/13 (390×844)** - Portrait  
- [ ] **iPad Mini (768×1024)** - Portrait
- [ ] **Desktop (1920×1080)** - Standard view

#### Medium Priority
- [ ] **Android Phone (360×640)** - Portrait (Samsung Galaxy S8)
- [ ] **Android Phone (412×915)** - Portrait (Pixel 5)
- [ ] **iPhone 12 (844×390)** - Landscape
- [ ] **iPad Pro (1024×1366)** - Portrait

### How to Test:
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device from dropdown or enter custom dimensions
4. Test each breakpoint: 360px, 375px, 390px, 768px, 1024px, 1920px

---

## 2. Layout Integrity Tests

### Modal Sizing
- [ ] **Mobile (<768px)**: Modal is 100vw × 100vh (full screen)
- [ ] **Tablet (≥768px)**: Modal has margins (not full screen)
- [ ] **Desktop (≥1024px)**: Modal is 86vw × 86vh
- [ ] No horizontal scrolling at any screen size
- [ ] Close button always visible and accessible

### Phone Case Scaling
- [ ] **Small phones (<480px)**: Phone case is 256px × 512px
- [ ] **Large phones (480-767px)**: Phone case is 288px × 576px
- [ ] **Tablets/Desktop (≥768px)**: Phone case is 320px × 640px
- [ ] Placed images maintain position when scaling
- [ ] Control buttons remain usable at all scales

### Sidebar Transformation
- [ ] **Mobile (<768px)**: Sidebar at bottom, horizontal layout, 60px height
- [ ] **Desktop (≥768px)**: Sidebar on left, vertical layout, 90px width
- [ ] Active tab indicator visible in both orientations
- [ ] All icons remain tappable (44px minimum)

### Upload Section
- [ ] **Mobile (<768px)**: Hidden by default, toggle button visible
- [ ] **Tablet (768-1023px)**: Slide-out drawer, 300px width
- [ ] **Desktop (≥1024px)**: Always visible, 380px width
- [ ] Drawer slides smoothly with animation
- [ ] Backdrop appears when drawer opens on mobile

---

## 3. Touch Interaction Tests (Task 13.3)

### Touch Target Sizes
- [ ] All buttons are at least 44px × 44px
- [ ] Image control buttons (delete, rotate, resize) are 44px
- [ ] Sidebar icons are 44px minimum height
- [ ] Category buttons are 44px minimum height
- [ ] Text edit buttons are 44px minimum height
- [ ] Phone control buttons are 44px minimum height

### Touch Responsiveness
- [ ] Buttons respond immediately to tap (no delay)
- [ ] Active states show visual feedback
- [ ] No double-tap zoom on buttons
- [ ] Drag operations are smooth and accurate
- [ ] Rotate handle works smoothly on touch
- [ ] Resize handle works smoothly on touch

### Spacing
- [ ] Minimum 8px gap between adjacent buttons
- [ ] Gallery grid has proper spacing (0.75rem on mobile)
- [ ] Assets grid has proper spacing (0.75rem on mobile)
- [ ] No accidental taps on wrong elements

---

## 4. Typography Tests

### Font Sizes
- [ ] Body text is at least 14px (0.875rem)
- [ ] Labels are at least 12px (0.75rem)
- [ ] Button text is at least 14px
- [ ] Input fields are 16px (prevents zoom on iOS)
- [ ] No text wrapping awkwardly
- [ ] No text overflow or truncation

### Readability
- [ ] Line-height is 1.5 for body text
- [ ] Line-height is 1.4 for labels
- [ ] Text contrast meets WCAG AA standards
- [ ] Text remains readable at all screen sizes

---

## 5. Padding and Spacing Tests

### Section Padding
- [ ] **Small phones (<480px)**: 0.5rem (8px) padding
- [ ] **Tablets (480-767px)**: 1rem (16px) padding
- [ ] **Desktop (≥768px)**: 2rem (32px) padding
- [ ] Content doesn't feel cramped on mobile
- [ ] Content doesn't feel too spacious on desktop

### Button Spacing
- [ ] Phone controls: 1rem gap (desktop), 0.5rem (mobile)
- [ ] Text edit icons: 0.75rem gap (desktop), 0.5rem (mobile)
- [ ] Format buttons: 0.75rem gap (desktop), 0.5rem (mobile)
- [ ] Consistent spacing when buttons wrap

---

## 6. Grid Layout Tests

### Gallery Grid
- [ ] **Small phones (<480px)**: 1 column
- [ ] **Large phones (480-767px)**: 2 columns
- [ ] **Tablets/Desktop (≥768px)**: 2 columns
- [ ] Images display correctly in all layouts
- [ ] Gap is appropriate for screen size

### Assets Grid
- [ ] **Small phones (<480px)**: 2 columns
- [ ] **Large phones/Tablets (≥480px)**: 3 columns
- [ ] **Desktop (≥1024px)**: 3 columns with larger gap
- [ ] Emojis/stickers display correctly
- [ ] Touch targets are easy to tap

---

## 7. Phone Controls Tests

### Layout
- [ ] **Small phones (<480px)**: Stacked vertically, full width
- [ ] **Tablets (480-767px)**: Horizontal with wrapping
- [ ] **Desktop (≥768px)**: Horizontal, no wrapping
- [ ] Buttons maintain 44px minimum height
- [ ] Text doesn't truncate

### Functionality
- [ ] Reset Position button works
- [ ] Clear All button works
- [ ] Buttons are easy to tap on mobile
- [ ] No accidental taps

---

## 8. Text Edit Panel Tests

### Mobile Layout
- [ ] Panel appears at bottom on mobile
- [ ] Panel is above bottom sidebar (60px from bottom)
- [ ] Icon-only buttons on mobile (text hidden)
- [ ] 5 columns on mobile (20% width each)
- [ ] 3 columns on very small screens (<480px)
- [ ] Max-height: 50vh with scroll

### Form Controls
- [ ] Color picker is 60px height (easy to tap)
- [ ] Color preview is 32px on mobile
- [ ] Font selector is 48px min-height
- [ ] Text input is 16px font (no zoom)
- [ ] All inputs are touch-friendly

### Positioning
- [ ] Phone case remains visible when panel open
- [ ] Panel doesn't cover important content
- [ ] Scroll works if content exceeds max-height

---

## 9. Top Menu Tests

### Layout
- [ ] **Desktop**: 60px height, sidebar compensation
- [ ] **Mobile (<768px)**: 50px height, no sidebar compensation
- [ ] **Very small (<480px)**: Icon-only buttons
- [ ] Close button always visible
- [ ] Buttons remain tappable (44px minimum)

### Buttons
- [ ] Download button works
- [ ] Add to Cart button works
- [ ] Tooltips show on hover (desktop)
- [ ] Aria-labels work for screen readers
- [ ] Icon-only mode works on small screens

---

## 10. Upload Drawer Tests

### Toggle Button
- [ ] Button visible on mobile (<1024px)
- [ ] Icon changes based on active tab
- [ ] Shows ✕ when drawer is open
- [ ] Button is 56px × 56px (easy to tap)
- [ ] Positioned correctly (top-right)

### Drawer Behavior
- [ ] Slides in smoothly from right
- [ ] Backdrop appears when open
- [ ] Click backdrop to close
- [ ] Close button inside drawer works
- [ ] Drawer state persists during use

---

## 11. Orientation Change Tests (Task 13.2)

### Portrait to Landscape
- [ ] Layout adapts without breaking
- [ ] No data loss (images, text preserved)
- [ ] All controls remain accessible
- [ ] No layout shift issues

### Landscape to Portrait
- [ ] Layout returns to portrait mode
- [ ] Design state preserved
- [ ] No visual glitches
- [ ] Smooth transition

---

## 12. Performance Tests (Task 13.4)

### Layout Shifts
- [ ] No Cumulative Layout Shift (CLS) issues
- [ ] Smooth transitions between breakpoints
- [ ] No flickering or jumping content

### Animation Performance
- [ ] 60fps during drawer slide animations
- [ ] Smooth hover effects
- [ ] No lag when dragging images
- [ ] No lag when rotating/resizing

### Low-End Device Testing
- [ ] Test on older Android device (if available)
- [ ] Test on iPhone 6/7 (if available)
- [ ] Verify performance is acceptable

---

## 13. Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Logical tab order

### Screen Reader
- [ ] All buttons have aria-labels
- [ ] Images have alt text
- [ ] Form inputs have labels

### Touch Accessibility
- [ ] All touch targets meet 44px minimum
- [ ] Sufficient spacing between targets
- [ ] Visual feedback on touch

---

## 14. Edge Cases

### Long Text
- [ ] Long button text doesn't break layout
- [ ] Text truncates gracefully with ellipsis
- [ ] No overflow issues

### Many Images
- [ ] Gallery scrolls smoothly with many images
- [ ] Performance remains good with 20+ images
- [ ] No memory issues

### Empty States
- [ ] Empty gallery shows proper message
- [ ] Empty layers shows proper message
- [ ] No broken layouts

---

## Testing Tools

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test responsive breakpoints
4. Check touch simulation
5. Throttle network/CPU for performance testing

### Real Device Testing
1. Use your phone to test
2. Test on different browsers (Chrome, Safari, Firefox)
3. Test on different OS versions
4. Test with actual touch interactions

---

## Known Issues to Watch For

1. **Shopify CDN Caching**: Hard refresh doesn't work, must restart dev server
2. **iOS Zoom**: Inputs with font-size < 16px trigger zoom
3. **Touch Delay**: Ensure touch-action: manipulation is applied
4. **Landscape Mode**: Currently skipped (Task 9)
5. **Keyboard Handling**: Currently skipped (Task 12)

---

## Sign-Off Checklist

- [ ] All high-priority devices tested
- [ ] All touch interactions work smoothly
- [ ] No horizontal scrolling on any device
- [ ] Typography is readable on all devices
- [ ] All buttons are tappable (44px minimum)
- [ ] Performance is acceptable (60fps)
- [ ] No accessibility issues
- [ ] Ready for production deployment

---

## Notes

Use this space to document any issues found during testing:

```
Issue 1: [Description]
Device: [Device name]
Screen size: [Width × Height]
Steps to reproduce: [Steps]
Expected: [Expected behavior]
Actual: [Actual behavior]
```
