# Railway Deployment Guide for Phone Case Customizer

## Why Railway?
- ✅ $5 free credit (no card required initially)
- ✅ Easier than Fly.io
- ✅ Auto-deploy from GitHub
- ✅ Great developer experience
- ✅ Perfect for Shopify apps

## Prerequisites
- [ ] GitHub account
- [ ] Railway account (we'll create this)
- [ ] Code pushed to GitHub

---

## Step 1: Push Code to GitHub

### If you don't have a GitHub repo yet:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `phone-case-customizer` (or any name you like)
   - Make it **Private** (recommended for Shopify apps)
   - Don't initialize with README (we already have code)
   - Click "Create repository"

2. **Initialize Git in your project** (if not already done):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - Phone Case Customizer"
   ```

3. **Push to GitHub:**
   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/phone-case-customizer.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with **GitHub** (easiest - one click!)
4. Authorize Railway to access your GitHub

---

## Step 3: Create New Project on Railway

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `phone-case-customizer` repository
4. Railway will automatically detect your Dockerfile

---

## Step 4: Configure Environment Variables

In Railway dashboard, go to your project and click **"Variables"** tab:

Add these variables:

```
SHOPIFY_API_KEY=5074a2fccebe4fcdfa625aa668e6e172
SHOPIFY_API_SECRET=your-shopify-api-secret-here
SHOPIFY_APP_URL=https://your-app.up.railway.app
SCOPES=write_products,read_orders,write_orders,write_files
NODE_ENV=production
PORT=3000
```

**Important:** 
- Replace `your-shopify-api-secret-here` with your actual secret
- Replace `your-app.up.railway.app` with your actual Railway URL (you'll get this after first deploy)

### Where to find your Shopify API Secret:
1. Go to https://partners.shopify.com
2. Click on your app
3. Go to "App setup" > "Client credentials"
4. Copy the "Client secret"

---

## Step 5: Add Volume for Database (Optional but Recommended)

Railway provides persistent storage:

1. In your project, click **"New"** → **"Volume"**
2. Name it: `data`
3. Mount path: `/app/prisma`
4. Size: `1GB` (free tier includes 1GB)

This ensures your SQLite database persists across deployments.

---

## Step 6: Deploy!

Railway will automatically deploy when you:
- Push code to GitHub
- Change environment variables
- Click "Deploy" button

**First deployment takes 3-5 minutes.**

Watch the logs in Railway dashboard to see progress.

---

## Step 7: Get Your App URL

After deployment:

1. Go to your project in Railway
2. Click on your service
3. Go to **"Settings"** tab
4. Under **"Domains"**, you'll see your Railway URL
5. It will be something like: `https://phone-case-customizer-production.up.railway.app`

---

## Step 8: Update Shopify App URLs

1. **Update environment variable in Railway:**
   - Go to Variables tab
   - Update `SHOPIFY_APP_URL` with your Railway URL
   - Railway will auto-redeploy

2. **Update `shopify.app.toml`:**
   ```toml
   application_url = "https://your-app.up.railway.app"
   
   [auth]
   redirect_urls = [
     "https://your-app.up.railway.app/auth",
     "https://your-app.up.railway.app/auth/callback",
     "https://your-app.up.railway.app/api/auth"
   ]
   ```

3. **Update in Shopify Partners Dashboard:**
   - Go to https://partners.shopify.com
   - Select your app
   - Go to "App setup" > "URLs"
   - Update "App URL" to your Railway URL
   - Update "Allowed redirection URL(s)" to include:
     - `https://your-app.up.railway.app/auth`
     - `https://your-app.up.railway.app/auth/callback`
     - `https://your-app.up.railway.app/api/auth`

4. **Push updated config to GitHub:**
   ```powershell
   git add shopify.app.toml
   git commit -m "Update app URLs for Railway"
   git push
   ```

Railway will auto-deploy the changes!

---

## Common Commands

### View Logs
In Railway dashboard → Your service → "Deployments" → Click latest deployment → View logs

### Restart Service
Railway dashboard → Your service → "Settings" → "Restart"

### Redeploy
Railway dashboard → Your service → "Deployments" → Click "Redeploy"

### SSH into Container (if needed)
Railway doesn't provide direct SSH, but you can use the logs and metrics

---

## Pricing & Free Tier

**Free Tier Includes:**
- $5 credit per month
- 500 hours of usage
- 1GB storage
- 100GB bandwidth

**Your App Usage (estimated):**
- ~$3-5/month if running 24/7
- With $5 free credit = **FREE for 1-2 months**

**After free credit runs out:**
- Add payment method
- Or optimize to use less resources
- Or switch to another platform

**To maximize free credit:**
- Use sleep/wake features (if available)
- Optimize your app
- Monitor usage in Railway dashboard

---

## Monitoring

**Check Usage:**
1. Railway dashboard → Your project
2. Click "Usage" tab
3. See credit remaining and resource usage

**Set up Alerts:**
1. Railway dashboard → Settings
2. Add email for notifications
3. Get alerts when credit is low

---

## Troubleshooting

### App Won't Start
- Check logs in Railway dashboard
- Verify all environment variables are set
- Check Dockerfile builds successfully

### Database Issues
- Ensure volume is mounted to `/app/prisma`
- Check if migrations ran (see logs)
- Verify SQLite file exists in volume

### Environment Variables Not Working
- Make sure you clicked "Save" after adding variables
- Railway auto-redeploys when variables change
- Check logs to see if variables are loaded

### Out of Credit
- Add payment method in Railway dashboard
- Or deploy to another platform
- Or optimize resource usage

---

## Production Checklist

- [ ] All environment variables set
- [ ] Volume mounted for database
- [ ] Shopify app URLs updated
- [ ] Test app installation on development store
- [ ] Monitor logs for errors
- [ ] Check credit usage regularly
- [ ] Set up email notifications

---

## Advantages of Railway

✅ **Easy Setup** - No CLI needed, all in browser
✅ **Auto-Deploy** - Push to GitHub = automatic deployment
✅ **Great Logs** - Easy to debug
✅ **No Cold Starts** - App stays warm
✅ **Simple Pricing** - Pay for what you use
✅ **Good Support** - Active Discord community

---

## Next Steps

1. Push your code to GitHub
2. Sign up for Railway
3. Connect your repo
4. Add environment variables
5. Deploy!
6. Update Shopify URLs
7. Test your app

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Shopify App Docs: https://shopify.dev/docs/apps
