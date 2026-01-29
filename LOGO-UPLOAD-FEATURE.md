# Logo Upload Feature - Implementation Summary

## Overview
Added direct file upload capability for the customize button logo, with fallback to URL input.

## Changes Made

### 1. Database Schema
- Already has `buttonLogoUrl` field (nullable String)

### 2. Backend (`app/routes/app._index.tsx`)
- Added file upload handling using Shopify Admin GraphQL API
- Process:
  1. Create staged upload target
  2. Upload file to Shopify's storage
  3. Create file record in Shopify
  4. Store the returned URL in database
- Falls back to URL input if file upload fails
- Supports multipart/form-data

### 3. Admin UI
- Two options for logo:
  - **Option 1**: Direct file upload (recommended)
  - **Option 2**: Paste image URL
- File input accepts all image formats
- Preview shows current logo
- Clear button to remove logo

### 4. Product Page (Liquid Template)
- Already configured to display logo or palette emoji
- No changes needed

## How It Works

### File Upload Flow:
1. User selects image file in admin
2. Clicks "Save Settings"
3. Backend creates staged upload in Shopify
4. File is uploaded to Shopify's CDN
5. Shopify returns permanent URL
6. URL is saved to database
7. Product page fetches URL and displays logo

### URL Input Flow:
1. User pastes image URL
2. Clicks "Save Settings"
3. URL is saved directly to database
4. Product page displays logo from URL

## Features
- ✅ Direct file upload to Shopify
- ✅ Alternative URL input
- ✅ Image preview in admin
- ✅ Clear/remove logo option
- ✅ Fallback to palette emoji if no logo
- ✅ Supports all image formats
- ✅ Files stored on Shopify CDN (fast, reliable)

## Usage
1. Go to admin settings
2. Choose one of two options:
   - Upload a file directly (recommended)
   - Paste an image URL
3. Click "Save Settings"
4. Logo appears on customize button

## Recommended Logo Specs
- Size: 24x24 pixels or larger
- Format: PNG (with transparency) or SVG
- Max file size: 20MB (Shopify limit)
- Square aspect ratio works best

## Version
- Deployed: Version 283
- Migration: `20260129095245_add_button_logo`
