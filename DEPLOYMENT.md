# Fly.io Deployment Guide for Phone Case Customizer

## Prerequisites

- [x] Fly.io CLI installed
- [ ] Fly.io account created
- [ ] Credit card for verification (free tier available)

## Step-by-Step Deployment

### 1. Authenticate with Fly.io

**If you don't have an account:**
```powershell
flyctl auth signup
```

**If you already have an account:**
```powershell
flyctl auth login
```

### 2. Create a Fly.io App

```powershell
flyctl launch --no-deploy
```

This will:
- Detect your Dockerfile
- Ask you to choose an app name (or use the default)
- Ask you to select a region (choose closest to your users)
- Ask if you want PostgreSQL or Redis (say **NO** - we use SQLite)

**Important:** When asked "Would you like to deploy now?", say **NO**

### 3. Set Environment Variables

You need to set your Shopify app credentials:

```powershell
# Set Shopify API credentials
flyctl secrets set SHOPIFY_API_KEY="5074a2fccebe4fcdfa625aa668e6e172"
flyctl secrets set SHOPIFY_API_SECRET="your-shopify-api-secret"

# Set app URL (will be your-app-name.fly.dev)
flyctl secrets set SHOPIFY_APP_URL="https://your-app-name.fly.dev"

# Set scopes
flyctl secrets set SCOPES="write_products,read_orders,write_orders,write_files"

# Optional: Set custom shop domain if needed
# flyctl secrets set SHOP_CUSTOM_DOMAIN="your-shop.myshopify.com"
```

**Where to find your Shopify API Secret:**
1. Go to https://partners.shopify.com
2. Click on your app
3. Go to "App setup" > "Client credentials"
4. Copy the "Client secret"

### 4. Create Persistent Volume for Database

```powershell
flyctl volumes create data --region iad --size 1
```

**Note:** Change `iad` to your chosen region (e.g., `lhr` for London, `syd` for Sydney)

### 5. Deploy Your App

```powershell
flyctl deploy
```

This will:
- Build your Docker image
- Push it to Fly.io
- Start your app
- Run database migrations

### 6. Check Deployment Status

```powershell
# Check if app is running
flyctl status

# View logs
flyctl logs

# Open your app in browser
flyctl open
```

### 7. Update Shopify App URLs

After deployment, you need to update your Shopify app configuration:

1. Get your Fly.io app URL:
   ```powershell
   flyctl info
   ```
   Your URL will be: `https://your-app-name.fly.dev`

2. Update `shopify.app.toml`:
   ```toml
   application_url = "https://your-app-name.fly.dev"
   
   [auth]
   redirect_urls = [
     "https://your-app-name.fly.dev/auth",
     "https://your-app-name.fly.dev/auth/callback",
     "https://your-app-name.fly.dev/api/auth"
   ]
   ```

3. Update in Shopify Partners Dashboard:
   - Go to https://partners.shopify.com
   - Select your app
   - Go to "App setup" > "URLs"
   - Update "App URL" to: `https://your-app-name.fly.dev`
   - Update "Allowed redirection URL(s)" to include:
     - `https://your-app-name.fly.dev/auth`
     - `https://your-app-name.fly.dev/auth/callback`
     - `https://your-app-name.fly.dev/api/auth`

4. Redeploy with updated config:
   ```powershell
   flyctl deploy
   ```

## Common Commands

### View Logs
```powershell
# Real-time logs
flyctl logs

# Last 100 lines
flyctl logs --lines 100
```

### SSH into Your App
```powershell
flyctl ssh console
```

### Scale Your App
```powershell
# Increase memory
flyctl scale memory 1024

# Add more machines
flyctl scale count 2
```

### Update Environment Variables
```powershell
flyctl secrets set VARIABLE_NAME="value"
```

### Restart Your App
```powershell
flyctl apps restart
```

## Database Management

### Access Database
```powershell
# SSH into the machine
flyctl ssh console

# Navigate to database
cd /app/prisma
ls -la
```

### Run Migrations
Migrations run automatically on deployment via the `docker-start` script.

To run manually:
```powershell
flyctl ssh console
cd /app
npm run setup
```

### Backup Database
```powershell
# SSH into machine
flyctl ssh console

# Copy database file
cp /app/prisma/dev.sqlite /app/prisma/backup.sqlite

# Exit and download
exit
flyctl ssh sftp get /app/prisma/dev.sqlite ./local-backup.sqlite
```

## Troubleshooting

### App Won't Start
```powershell
# Check logs
flyctl logs

# Check app status
flyctl status

# Restart app
flyctl apps restart
```

### Database Issues
```powershell
# SSH into machine
flyctl ssh console

# Check if volume is mounted
df -h

# Check database file
ls -la /app/prisma/
```

### Environment Variables Not Set
```powershell
# List all secrets
flyctl secrets list

# Set missing secrets
flyctl secrets set KEY="value"
```

### Out of Memory
```powershell
# Increase memory to 1GB
flyctl scale memory 1024
```

## Pricing

**Free Tier Includes:**
- 3 shared-cpu-1x 256MB VMs (stopped when not in use)
- 3GB persistent volume storage
- 160GB outbound data transfer

**Your App Configuration:**
- ✅ 1 VM with 256MB RAM (FREE - within free tier)
- ✅ 1GB persistent volume (FREE - within 3GB limit)
- ✅ Auto-stop enabled (FREE - stops when idle)

**Cost: $0/month** 🎉

**How it works:**
- Your app will **stop automatically** when no one is using it
- When someone visits your app, it **starts automatically** (takes 5-10 seconds)
- First request after idle will be slower (cold start)
- Subsequent requests will be fast

**To Stay on Free Tier:**
- Keep memory at 256MB (already configured)
- Use only 1 VM (already configured)
- Keep auto-stop enabled (already configured)
- Don't exceed 160GB monthly traffic

## Production Checklist

- [ ] Set all environment variables
- [ ] Update Shopify app URLs
- [ ] Test app installation on a development store
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts (optional)
- [ ] Configure custom domain (optional)
- [ ] Enable auto-scaling if needed

## Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- Shopify App Docs: https://shopify.dev/docs/apps

## Next Steps After Deployment

1. Test your app on a Shopify development store
2. Monitor logs for any errors
3. Set up proper error tracking (e.g., Sentry)
4. Consider upgrading to PostgreSQL for production
5. Set up CI/CD for automatic deployments
