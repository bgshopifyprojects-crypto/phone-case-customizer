# Railway Quick Start - 5 Simple Steps

## Step 1: Push to GitHub (5 minutes)

```powershell
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repo on GitHub: https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR-USERNAME/phone-case-customizer.git
git branch -M main
git push -u origin main
```

---

## Step 2: Sign Up for Railway (1 minute)

1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign up with **GitHub** (one click!)

---

## Step 3: Deploy from GitHub (2 minutes)

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `phone-case-customizer`
4. Railway starts deploying automatically!

---

## Step 4: Add Environment Variables (3 minutes)

In Railway dashboard → Your service → **"Variables"** tab:

```
SHOPIFY_API_KEY=5074a2fccebe4fcdfa625aa668e6e172
SHOPIFY_API_SECRET=your-secret-here
SHOPIFY_APP_URL=https://your-app.up.railway.app
SCOPES=write_products,read_orders,write_orders,write_files
NODE_ENV=production
PORT=3000
```

**Get your Shopify API Secret:**
- https://partners.shopify.com → Your app → App setup → Client credentials

**Get your Railway URL:**
- Railway dashboard → Your service → Settings → Domains

---

## Step 5: Update Shopify URLs (2 minutes)

1. **In Railway:** Update `SHOPIFY_APP_URL` variable with your Railway URL
2. **In Shopify Partners:** Update app URLs to your Railway URL
3. **Done!** 🎉

---

## Total Time: ~15 minutes

**Your app will be live and free for 1-2 months with $5 credit!**

---

## Need Help?

Read the full guide: `RAILWAY-DEPLOYMENT.md`
