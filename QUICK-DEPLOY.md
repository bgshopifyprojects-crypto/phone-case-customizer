# Quick Deployment Commands

## First Time Setup

```powershell
# 1. Login to Fly.io
flyctl auth login

# 2. Launch app (don't deploy yet)
flyctl launch --no-deploy

# 3. Set secrets (replace with your actual values)
flyctl secrets set SHOPIFY_API_KEY="5074a2fccebe4fcdfa625aa668e6e172"
flyctl secrets set SHOPIFY_API_SECRET="your-secret-here"
flyctl secrets set SHOPIFY_APP_URL="https://your-app-name.fly.dev"
flyctl secrets set SCOPES="write_products,read_orders,write_orders,write_files"

# 4. Create volume for database
flyctl volumes create data --region iad --size 1

# 5. Deploy
flyctl deploy
```

## ⚠️ IMPORTANT: Set Spending Limit (Stay Free!)

After first deployment, set a spending limit to prevent charges:

1. Go to https://fly.io/dashboard
2. Click your organization
3. Go to "Billing" > "Spending Limit"
4. Set limit to **$0** or **$5** (safety buffer)

This ensures you won't be charged accidentally!

## After First Deployment

Update `shopify.app.toml` with your Fly.io URL, then:

```powershell
flyctl deploy
```

## Common Commands

```powershell
# View logs
flyctl logs

# Check status
flyctl status

# Restart app
flyctl apps restart

# SSH into machine
flyctl ssh console

# Open app in browser
flyctl open
```

## Get Your App URL

```powershell
flyctl info
```

Look for the "Hostname" - that's your app URL!
