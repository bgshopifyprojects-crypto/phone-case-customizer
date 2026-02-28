# Render Deployment Guide - Phone Case Customizer

## ✅ Successfully Deployed!

Your app is now live on Render at:
**https://phone-case-customizer-sp.onrender.com**

---

## What Was Configured

### Service Settings:
- **Name:** phone-case-customizer
- **Runtime:** Docker
- **Branch:** main
- **Region:** Frankfurt (EU Central) or Oregon (US West)
- **Plan:** Free

### Environment Variables:
```
SHOPIFY_API_KEY=5074a2fccebe4fcdfa625aa668e6e172
SHOPIFY_API_SECRET=shops_b71dd9217c1906dc5d602837ad7f5212
SHOPIFY_APP_URL=https://phone-case-customizer-sp.onrender.com
SCOPES=write_products,read_orders,write_orders,write_files
NODE_ENV=production
PORT=3000
```

---

## Next Steps After Deployment

### 1. Update Shopify App URLs

Go to https://partners.shopify.com:

1. Select your app
2. Go to **"App setup"** → **"URLs"**
3. Update:
   - **App URL:** `https://phone-case-customizer-sp.onrender.com`
   - **Allowed redirection URLs:**
     - `https://phone-case-customizer-sp.onrender.com/auth`
     - `https://phone-case-customizer-sp.onrender.com/auth/callback`
     - `https://phone-case-customizer-sp.onrender.com/api/auth`

### 2. Update shopify.app.toml

Update your local `shopify.app.toml`:

```toml
application_url = "https://phone-case-customizer-sp.onrender.com"

[auth]
redirect_urls = [
  "https://phone-case-customizer-sp.onrender.com/auth",
  "https://phone-case-customizer-sp.onrender.com/auth/callback",
  "https://phone-case-customizer-sp.onrender.com/api/auth"
]
```

Then push to GitHub:
```powershell
git add shopify.app.toml
git commit -m "Update app URL for Render deployment"
git push
```

Render will auto-deploy the changes!

---

## Free Tier Limitations

### What's Included (Free):
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ 750 hours/month

### Important Limitation:
⚠️ **App spins down after 15 minutes of inactivity**
- First request after idle: 30-60 seconds (cold start)
- Subsequent requests: Fast!
- This can cause Shopify webhook timeouts

### To Avoid Cold Starts:
**Option 1:** Upgrade to Starter plan ($7/month)
- No cold starts
- Always-on
- Better performance

**Option 2:** Use a ping service (free)
- UptimeRobot: https://uptimerobot.com
- Ping your app every 10 minutes
- Keeps it awake during business hours

---

## Managing Your Deployment

### View Logs
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. See real-time logs

### Restart Service
1. Render dashboard → Your service
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Or click "Restart" for quick restart

### Update Environment Variables
1. Render dashboard → Your service
2. Click "Environment" tab
3. Add/edit variables
4. Service auto-restarts

### Redeploy
Render auto-deploys when you push to GitHub!

Or manually:
1. Render dashboard → Your service
2. Click "Manual Deploy" → "Deploy latest commit"

---

## Monitoring

### Check Service Status
- Green = Running
- Yellow = Deploying
- Red = Failed

### Set Up Notifications
1. Render dashboard → Account Settings
2. Add email for notifications
3. Get alerts for:
   - Deployment failures
   - Service crashes
   - Downtime

---

## Troubleshooting

### App Won't Start
**Check logs for errors:**
1. Database migration issues
2. Missing environment variables
3. Port binding errors

**Common fixes:**
- Verify all env vars are set
- Check Dockerfile is correct
- Ensure PORT=3000 is set

### Database Issues
**SQLite limitations on Render:**
- Free tier has ephemeral storage
- Database resets on redeploy
- **Solution:** Upgrade to paid plan with persistent disk

**For production:**
- Consider PostgreSQL (Render provides free tier)
- Or use external database

### Slow Performance
**Free tier limitations:**
- 512 MB RAM might be tight
- Shared CPU
- Cold starts after idle

**Solutions:**
- Upgrade to Starter ($7/month)
- Optimize your app
- Use caching

### Shopify Webhooks Timing Out
**Cause:** Cold starts delay response

**Solutions:**
1. Upgrade to paid plan (no cold starts)
2. Use ping service to keep warm
3. Implement async webhook processing

---

## Upgrading

### To Starter Plan ($7/month):
1. Render dashboard → Your service
2. Click "Settings" tab
3. Scroll to "Instance Type"
4. Select "Starter"
5. Add payment method
6. Confirm upgrade

**Benefits:**
- No cold starts
- 512 MB RAM (same)
- 0.5 CPU (5x faster!)
- Always-on

---

## Auto-Deploy from GitHub

Render automatically deploys when you:
- Push to main branch
- Merge a pull request
- Update environment variables

**To disable auto-deploy:**
1. Settings → Build & Deploy
2. Toggle "Auto-Deploy" off

---

## Custom Domain (Optional)

### Add Your Own Domain:
1. Render dashboard → Your service
2. Click "Settings" → "Custom Domain"
3. Add your domain
4. Update DNS records as shown
5. Wait for SSL certificate (automatic)

---

## Backup & Recovery

### Database Backup (Important!)
Since free tier has ephemeral storage:

**Option 1:** Manual backup
```powershell
# SSH into service (if available)
# Copy database file
```

**Option 2:** Use PostgreSQL
- Render provides free PostgreSQL
- Automatic backups
- Persistent storage

### Code Backup
Your code is safe on GitHub! ✅

---

## Cost Optimization

### Stay on Free Tier:
- Accept cold starts
- Use ping service for business hours
- Monitor usage (750 hours/month limit)

### When to Upgrade:
- Need 24/7 uptime
- Can't accept cold starts
- Shopify webhooks timing out
- Need better performance

---

## Production Checklist

- [ ] App deployed successfully
- [ ] All environment variables set
- [ ] Shopify app URLs updated
- [ ] Test app installation on dev store
- [ ] Monitor logs for errors
- [ ] Set up email notifications
- [ ] Consider upgrade if cold starts are issue
- [ ] Set up database backups (if using SQLite)
- [ ] Test all features work in production

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Shopify Docs:** https://shopify.dev/docs/apps
- **Your Logs:** Render Dashboard → Your Service → Logs

---

## Summary

✅ **Deployed:** https://phone-case-customizer-sp.onrender.com
✅ **Auto-deploy:** Enabled (pushes to GitHub)
✅ **Cost:** Free (with cold starts)
✅ **Upgrade:** $7/month for always-on

**Next:** Update Shopify app URLs and test your app!
