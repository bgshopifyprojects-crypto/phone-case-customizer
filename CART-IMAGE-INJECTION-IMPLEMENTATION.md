# Cart Image Injection Implementation

## Overview
Successfully implemented Shopify Script Tag API to automatically inject custom design images into the cart page.

## What Was Implemented

### 1. JavaScript Route (`app/routes/apps.customizer.cart-inject.tsx`)
- Serves JavaScript code that runs on the storefront
- Only executes on cart page (`/cart`)
- Injects custom design preview images into cart items
- Returns `Content-Type: text/javascript`

### 2. Script Tag Registration Route (`app/routes/apps.customizer.register-script-tag.tsx`)
- Registers the script tag via Shopify Admin API
- Checks if script tag already exists (prevents duplicates)
- Saves script tag ID to database
- Can be triggered from admin UI

### 3. Database Schema Update
- Added `scriptTagId` field to `AppSettings` model
- Migration created: `20260131093650_add_script_tag_id`
- Stores the Shopify script tag ID for reference

### 4. Admin UI Enhancement
- Added "Cart Image Display" section at top of settings page
- Shows activation status
- One-click button to enable cart image display
- Displays script tag ID when active

## How It Works

1. **Admin activates feature**: Merchant clicks "Enable Cart Image Display" button
2. **Script tag created**: App registers script tag with Shopify via Admin API
3. **Script loads automatically**: Shopify loads the script on all storefront pages
4. **Cart detection**: Script checks if current page is `/cart`
5. **Image injection**: If on cart page, script:
   - Fetches cart data via `/cart.js`
   - Finds items with `_main` property (custom image URL)
   - Injects styled preview image into cart item details
   - Makes image clickable to view full size

## Key Features

✅ **Fully automatic** - No theme modifications required
✅ **No merchant action** - Works immediately after activation
✅ **Clean uninstall** - Script tags auto-removed when app uninstalled
✅ **Cart page only** - Efficient, only runs where needed
✅ **Duplicate prevention** - Checks if already injected
✅ **Multiple triggers** - Handles dynamic cart updates
✅ **Horizon theme compatible** - Targets correct DOM structure

## Testing Steps

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Access admin UI**:
   - Go to app admin page
   - Look for "Cart Image Display" section at top

3. **Enable cart injection**:
   - Click "Enable Cart Image Display" button
   - Wait for success message
   - Note the script tag ID displayed

4. **Test on storefront**:
   - Go to a product with `dsn-editable-true` tag
   - Click "Customize Your Phone Case"
   - Create a custom design
   - Add to cart
   - Go to cart page (`/cart`)
   - **Expected**: Custom design image appears below product title

5. **Check browser console**:
   - Look for `[Phone Case Customizer]` log messages
   - Should see: "Cart injection script loaded"
   - Should see: "Injecting custom design images into cart..."
   - Should see: "Custom design image injected successfully"

## Files Modified

### New Files:
- `app/routes/apps.customizer.cart-inject.tsx` - JavaScript serving route
- `app/routes/apps.customizer.register-script-tag.tsx` - Script tag registration
- `prisma/migrations/20260131093650_add_script_tag_id/migration.sql` - Database migration

### Modified Files:
- `prisma/schema.prisma` - Added `scriptTagId` field
- `app/routes/app._index.tsx` - Added cart display UI section
- `extensions/phone-case-customizer/blocks/phone-case-customizer.liquid` - Removed old non-working script

## Technical Details

### Script Tag Properties:
- **event**: "onload" (loads when page loads)
- **src**: `https://your-app.com/apps/customizer/cart-inject`
- **display_scope**: "online_store" (all storefront pages)

### Cart Item Detection:
- Fetches cart via `/cart.js` API
- Checks `item.properties._main` for custom image URL
- Matches cart rows by `data-key` attribute containing variant ID

### DOM Injection:
- Targets: `td.cart-items__details` (Horizon theme)
- Injects after product title `<p>` element
- Styled preview: 150x150px max, rounded corners, shadow
- Clickable to open full size in new tab

## Troubleshooting

### Script not loading:
- Check script tag exists in Shopify admin: Settings → Apps and sales channels → Develop apps → [Your App] → API credentials → Script tags
- Verify script URL is accessible (visit it directly in browser)
- Check browser console for errors

### Images not appearing:
- Verify cart items have `_main` property (check `/cart.js` response)
- Check browser console for `[Phone Case Customizer]` logs
- Ensure you're on `/cart` page (not cart drawer)
- Verify Horizon theme structure matches (inspect cart HTML)

### Script tag registration fails:
- Check app has `write_script_tags` permission
- Verify database connection
- Check server logs for errors

## Next Steps

1. Test on production store
2. Test with different themes (if needed)
3. Monitor for any edge cases
4. Consider adding uninstall webhook to clean up (optional, auto-removed anyway)

## Notes

- Script tags are **scoped to the app** - automatically removed on uninstall
- Works on **cart page only** (not checkout - Shopify security restriction)
- **No theme changes** required - fully automatic
- **HTTPS required** for script src URL
- Script is cached by CDN for 5 minutes (configurable)
