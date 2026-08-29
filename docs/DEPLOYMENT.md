# 🚀 Vercel Deployment Guide

## Prerequisites
- [ ] GitHub repository pushed
- [ ] Convex account created
- [ ] Vercel account created

---

## Step 1: Deploy Convex Backend (5 minutes)

### 1.1 Login to Convex
```bash
npx convex login
```

### 1.2 Deploy Convex
```bash
npx convex deploy
```

This will:
- Create a production deployment
- Give you a production URL like: `https://your-deployment.convex.cloud`
- Generate your `CONVEX_DEPLOYMENT` name

### 1.3 Set Convex Environment Variables

Go to your Convex Dashboard (https://dashboard.convex.dev) and add these environment variables:

```
SHEETS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SHEETS_SECRET=your_secret_here
```

**Important**: These are backend-only secrets (no `VITE_` prefix) and won't be exposed to the client.

---

## Step 2: Deploy to Vercel (5 minutes)

### 2.1 Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### 2.2 Configure Environment Variables

In Vercel's "Environment Variables" section, add:

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

**Note**: Only add `VITE_CONVEX_URL` - the Google Sheets secrets are in Convex, not Vercel.

### 2.3 Deploy

Click "Deploy" and wait ~2 minutes.

---

## Step 3: Update Convex Deployment URL

After Vercel gives you your production URL (e.g., `life-at-daust.vercel.app`):

1. Copy your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your production Convex URL:
   ```
   VITE_CONVEX_URL=https://your-actual-deployment.convex.cloud
   CONVEX_DEPLOYMENT=your-actual-deployment-name
   ```

3. For local development, keep using `npx convex dev`

---

## Step 4: Test Production Deployment

Visit your Vercel URL and test:
- [ ] Homepage loads
- [ ] Shop page shows products from Convex
- [ ] Add items to cart
- [ ] Checkout creates order in Convex
- [ ] Admin login works (`/admin`)
- [ ] Admin dashboard shows orders

---

## Troubleshooting

### Issue: "Convex client could not connect"
**Fix**: Make sure `VITE_CONVEX_URL` in Vercel matches your Convex production URL

### Issue: "Orders not appearing in admin"
**Fix**: Check Convex deployment succeeded with `npx convex deploy`

### Issue: "Images not loading"
**Fix**: Ensure product images are uploaded to Convex Storage, not local files

### Issue: "Google Sheets not receiving orders"
**Fix**: Check that `SHEETS_WEBAPP_URL` and `SHEETS_SECRET` are set in Convex Dashboard (not Vercel)

---

## Environment Variable Summary

| Variable | Where to Set | Purpose |
|----------|-------------|---------|
| `VITE_CONVEX_URL` | Vercel | Client connects to Convex |
| `CONVEX_DEPLOYMENT` | Local `.env` only | CLI deployment target |
| `SHEETS_WEBAPP_URL` | Convex Dashboard | Backend Google Sheets sync |
| `SHEETS_SECRET` | Convex Dashboard | Backend authentication |

---

## Security Notes

✅ **GOOD**: Secrets are now in Convex backend (not exposed to clients)
✅ **GOOD**: `.env` file is not in git
✅ **GOOD**: Order IDs use timestamp + random (more secure)

---

## Next Deploy

For future updates:

```bash
# 1. Push to GitHub
git add .
git commit -m "Your changes"
git push

# 2. Vercel auto-deploys from main branch

# 3. If backend changes, redeploy Convex
npx convex deploy
```

---

**Questions?** Check your Convex logs at https://dashboard.convex.dev
