# Fly.io Free Tier - Simple Explanation

## ✅ Your App is 100% FREE

### What You Get (Free):
```
┌─────────────────────────────────────┐
│  Fly.io Free Tier                   │
├─────────────────────────────────────┤
│  ✅ 3 VMs × 256MB RAM each          │
│  ✅ 3GB storage                      │
│  ✅ 160GB data transfer/month       │
│  ✅ Auto-stop/start feature         │
└─────────────────────────────────────┘
```

### What You're Using:
```
┌─────────────────────────────────────┐
│  Your Phone Case Customizer App    │
├─────────────────────────────────────┤
│  ✅ 1 VM × 256MB RAM (FREE!)        │
│  ✅ 1GB storage (FREE!)             │
│  ✅ Auto-stop enabled (FREE!)       │
└─────────────────────────────────────┘
```

**Cost: $0.00 per month** 🎉

---

## How Auto-Stop Works

### Scenario 1: No Traffic (App Sleeping)
```
User visits app → App is sleeping 😴
                ↓
         Fly.io wakes up app (5-10 seconds)
                ↓
         App responds to user ✅
                ↓
         App stays awake for more requests
                ↓
         No requests for 5 minutes
                ↓
         App goes back to sleep 😴
```

**Cost while sleeping: $0.00**

### Scenario 2: Active Traffic
```
User 1 visits → App wakes up → Responds fast ⚡
User 2 visits → App is awake → Responds fast ⚡
User 3 visits → App is awake → Responds fast ⚡
(5 min idle)  → App sleeps 😴
```

**Cost while awake: $0.00** (within free tier limits)

---

## Important Notes

### ✅ Completely Free If:
- You use 256MB RAM (configured ✅)
- You use auto-stop (configured ✅)
- You stay under 160GB traffic/month
- You use less than 3GB storage

### ⚠️ You'll Pay If:
- You increase RAM above 256MB
- You disable auto-stop
- You exceed 160GB traffic/month
- You add more than 3 VMs

### 💡 Trade-offs of Free Tier:
- **Pro:** Completely free!
- **Con:** First request after idle is slow (5-10 seconds)
- **Con:** 256MB RAM might be tight for heavy traffic

---

## Will 256MB RAM Be Enough?

**For your Shopify app:**
- ✅ **Yes** for development and testing
- ✅ **Yes** for low-medium traffic (< 100 requests/hour)
- ⚠️ **Maybe** for high traffic (you can upgrade later)

**Your app includes:**
- React Router server
- SQLite database (lightweight)
- Image generation (uses some memory)
- Shopify API calls

**Recommendation:**
- Start with 256MB (free)
- Monitor performance
- Upgrade to 512MB ($3-5/month) if needed

---

## How to Monitor Usage

```powershell
# Check if you're within free tier
flyctl status

# View resource usage
flyctl dashboard metrics

# Check billing
flyctl dashboard billing
```

---

## Summary

**Your configuration is 100% FREE** ✅

- No credit card charges
- No surprise bills
- Auto-stop keeps it free
- You can upgrade anytime if needed

**When to upgrade:**
- App is too slow
- Getting memory errors
- Need 24/7 uptime (no cold starts)
- High traffic volume

---

## Questions?

**Q: Will I be charged anything?**
A: No! Your config is within free tier limits.

**Q: What if I exceed free tier?**
A: Fly.io will email you first. You can set spending limits.

**Q: Can I upgrade later?**
A: Yes! Just change `memory = "256mb"` to `memory = "512mb"` in fly.toml

**Q: What about the credit card requirement?**
A: Fly.io requires it for verification, but won't charge you if you stay within free tier.

**Q: How do I prevent accidental charges?**
A: Set a spending limit in Fly.io dashboard (Settings > Billing > Spending Limit)
