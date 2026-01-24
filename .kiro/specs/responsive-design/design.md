# Design Document: Responsive Design for Phone Case Customizer

## Overview

This document outlines the responsive design strategy for the phone case customizer. The approach uses a mobile-first methodology with progressive enhancement, ensuring optimal user experience across all device sizes while maintaining feature parity.

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Base styles: 320px - 479px (Small phones) */

@media (min-width: 480px) {
  /* Large phones */
}

@media (min-width: 768px) {
  /* Tablets (portrait) */
}

@media (min-width: 1024px) {
  /* Tablets (landscape) / Small desktops */
}

@media (min-width: 1280px) {
  /* Desktops */
}

/* Landscape orientation */
@media (max-height: 600px) and (orientation: landscape) {
  /* Mobile landscape */
}
```

## Layout Strategies by Device

### Mobile (320px - 767px)

**Layout:** Single column, stacked elements

```
┌─────────────────────┐
│   Top Menu Bar      │
├─────────────────────┤
│                     │
│   Phone Case        │
│   (Centered)        │
│                     │
├─────────────────────┤
│  Bottom Sidebar     │
│  [📷] [🎨] [📝] [📚]│
└─────────────────────┘
```

**Key Changes:**
- Modal: 100vw × 100vh (full screen)
- Phone case: Scaled to 70-80%
- Sidebar: Horizontal at bottom
- Upload section: Slide-out drawer
- Padding: 0.5rem
- Touch targets: 44px minimum

### Tablet (768px - 1023px)

**Layout:** Two-column with collapsible sidebar

```
┌──────────────────────────────┐
│      Top Menu Bar            │
├────┬─────────────────────────┤
│ S  │                         │
│ i  │    Phone Case           │
│ d  │    (Centered)           │
│ e  │                         │
│ b  │                         │
│ a  │                         │
│ r  │                         │
└────┴─────────────────────────┘
```

**Key Changes:**
- Modal: 90vw × 90vh
- Phone case: Scaled to 90%
- Sidebar: Vertical, collapsible
- Upload section: 300px width, slide-out
- Padding: 1rem
- Touch targets: 44px minimum

### Desktop (1024px+)

**Layout:** Three-column with full features

```
┌────────────────────────────────────┐
│         Top Menu Bar               │
├────┬──────────────────┬────────────┤
│ S  │                  │  Upload    │
│ i  │   Phone Case     │  Section   │
│ d  │   (Full size)    │            │
│ e  │                  │  Gallery   │
│ b  │                  │            │
│ a  │                  │            │
│ r  │                  │            │
└────┴──────────────────┴────────────┘
```

**Key Changes:**
- Modal: 86vw × 86vh
- Phone case: 100% size
- Sidebar: Vertical, always visible
- Upload section: 380px width, always visible
- Padding: 2rem
- Mouse interactions optimized

## Component Responsive Behavior

### 1. Phone Case Scaling

```css
/* Base: Mobile */
.phone-case {
  width: 256px;  /* 80% of 320px */
  height: 512px; /* 80% of 640px */
  transform-origin: center;
}

/* Large phones */
@media (min-width: 480px) {
  .phone-case {
    width: 288px;  /* 90% */
    height: 576px;
  }
}

/* Tablets and up */
@media (min-width: 768px) {
  .phone-case {
    width: 320px;  /* 100% */
    height: 640px;
  }
}
```

### 2. Sidebar Transformation

```css
/* Mobile: Horizontal bottom bar */
.sidebar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  flex-direction: row;
  justify-content: space-around;
}

/* Tablet and up: Vertical sidebar */
@media (min-width: 768px) {
  .sidebar {
    position: static;
    width: 90px;
    height: auto;
    flex-direction: column;
  }
}
```

### 3. Upload Section Drawer

```css
/* Mobile: Hidden by default, slide-out drawer */
.upload-section {
  position: fixed;
  right: -100%;
  top: 0;
  bottom: 0;
  width: 85vw;
  max-width: 320px;
  transition: right 0.3s ease;
  z-index: 200;
}

.upload-section.open {
  right: 0;
}

/* Tablet: Slide-out from left */
@media (min-width: 768px) {
  .upload-section {
    width: 300px;
    right: auto;
    left: -300px;
  }
  
  .upload-section.open {
    left: 90px; /* After sidebar */
  }
}

/* Desktop: Always visible */
@media (min-width: 1024px) {
  .upload-section {
    position: static;
    width: 380px;
  }
}
```

### 4. Touch Target Sizing

```css
/* All interactive elements */
.image-delete-btn,
.image-rotate-handle,
.image-resize-handle,
.sidebar-icon,
.category-btn,
.upload-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
}

/* Desktop: Can be smaller */
@media (min-width: 1024px) {
  .image-delete-btn,
  .image-rotate-handle,
  .image-resize-handle {
    min-width: 32px;
    min-height: 32px;
  }
}
```

### 5. Typography Scaling

```css
/* Mobile: Larger for readability */
.sidebar-text,
.download-btn,
.add-to-cart-btn {
  font-size: 0.875rem; /* 14px */
}

.modal-description,
.text-input {
  font-size: 1rem; /* 16px */
}

/* Desktop: Can be smaller */
@media (min-width: 1024px) {
  .sidebar-text,
  .download-btn,
  .add-to-cart-btn {
    font-size: 0.75rem; /* 12px */
  }
}
```

### 6. Grid Adaptations

```css
/* Mobile: 1 column */
.gallery-grid {
  grid-template-columns: 1fr;
}

.assets-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Large phones: 2 columns */
@media (min-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .assets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablets and up: Original layout */
@media (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .assets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 7. Modal Sizing

```css
/* Mobile: Full screen */
.phone-case-modal-content {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

/* Tablets: With margins */
@media (min-width: 768px) {
  .phone-case-modal-content {
    width: 90vw;
    height: 90vh;
    border-radius: 12px;
  }
}

/* Desktop: Original size */
@media (min-width: 1024px) {
  .phone-case-modal-content {
    width: 86vw;
    height: 86vh;
  }
}
```

### 8. Landscape Mode Handling

```css
/* Mobile landscape: Optimize for width */
@media (max-height: 600px) and (orientation: landscape) {
  .phone-case {
    width: 240px;  /* Smaller to fit */
    height: 480px;
  }
  
  .phone-section {
    padding: 0.5rem;
  }
  
  .sidebar {
    height: 50px;  /* Thinner */
  }
  
  .top-menu {
    height: 50px;
  }
}
```

## Interaction Patterns

### Mobile Drawer Toggle

```javascript
// Add toggle button for upload section
const toggleUploadBtn = document.createElement('button');
toggleUploadBtn.className = 'toggle-upload-btn';
toggleUploadBtn.innerHTML = '📷';
toggleUploadBtn.onclick = () => {
  uploadSection.classList.toggle('open');
};
```

### Touch Event Handling

```javascript
// Improve touch tracking for drag operations
let touchStartX, touchStartY;

element.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

element.addEventListener('touchmove', (e) => {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  // Update position
});
```

### Keyboard Handling on Mobile

```javascript
// Adjust modal when keyboard opens
window.visualViewport?.addEventListener('resize', () => {
  const keyboardHeight = window.innerHeight - window.visualViewport.height;
  if (keyboardHeight > 100) {
    // Keyboard is open
    modal.style.paddingBottom = `${keyboardHeight}px`;
  } else {
    modal.style.paddingBottom = '0';
  }
});
```

## Performance Considerations

1. **CSS Transitions:** Use `transform` and `opacity` for smooth animations
2. **Touch Delay:** Remove 300ms tap delay with `touch-action: manipulation`
3. **Scroll Performance:** Use `will-change` sparingly for animated elements
4. **Image Loading:** Lazy load gallery images on mobile
5. **Bundle Size:** Consider separate mobile CSS bundle

## Accessibility

1. **Touch Targets:** Minimum 44px × 44px (WCAG 2.1 Level AAA)
2. **Text Size:** Minimum 14px for body text, 16px for inputs
3. **Contrast:** Maintain 4.5:1 contrast ratio
4. **Focus Indicators:** Visible on all interactive elements
5. **Screen Reader:** Proper ARIA labels for all controls

## Testing Strategy

### Device Testing Matrix

| Device Type | Screen Size | Orientation | Priority |
|-------------|-------------|-------------|----------|
| iPhone SE | 375×667 | Portrait | High |
| iPhone 12 | 390×844 | Portrait | High |
| iPhone 12 | 844×390 | Landscape | Medium |
| iPad Mini | 768×1024 | Portrait | High |
| iPad Pro | 1024×1366 | Portrait | Medium |
| Desktop | 1920×1080 | N/A | High |

### Test Scenarios

1. **Layout Integrity:** All elements visible without horizontal scroll
2. **Touch Interactions:** All buttons respond to touch within 100ms
3. **Orientation Change:** Layout adapts without data loss
4. **Keyboard Handling:** Content remains visible when keyboard opens
5. **Performance:** 60fps during animations and interactions
