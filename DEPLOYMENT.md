# StegoChat - Vercel Production Deployment Guide

## Pre-Deployment Checklist

### 1. Fixed Issues (Already Done)

- [x] **Resolved merge conflict in `package.json`** - Was completely breaking the build
- [x] **Fixed `.env.example`** - Variable name now matches code (`VITE_SUPABASE_PUBLISHABLE_KEY`)
- [x] **Created `vercel.json`** - SPA routing rewrites so `/auth` and other routes work
- [x] **Verified production build passes** - `npm run build` completes successfully

---

### 2. Environment Variables (REQUIRED on Vercel)

You **must** add these two environment variables in the Vercel dashboard:

| Variable Name                  | Where to Get It                                                              | Example Value                                  |
| ------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`           | Supabase Dashboard > Project Settings > API > Project URL                    | `https://abcdefghijk.supabase.co`             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard > Project Settings > API > `anon` `public` key          | `eyJhbGciOiJIUzI1NiIsInR5cCI6...`            |

> **Important:** These are **public/anon** keys (safe to expose in frontend). Never put your `service_role` key here.

---

### 3. Supabase Configuration (REQUIRED)

Before deploying, ensure your Supabase project is production-ready:

#### a) Authentication - Allowed Redirect URLs
Go to **Supabase Dashboard > Authentication > URL Configuration** and add:
```
https://your-vercel-domain.vercel.app
https://your-vercel-domain.vercel.app/**
https://your-custom-domain.com        (if using custom domain)
https://your-custom-domain.com/**     (if using custom domain)
```

#### b) Site URL
Set the **Site URL** to your production domain:
```
https://your-vercel-domain.vercel.app
```

#### c) Storage - CORS Configuration
If using Supabase Storage (for stego-images bucket), ensure CORS allows your Vercel domain.
Go to **Supabase Dashboard > Storage > Policies** and verify the `stego-images` bucket exists and has appropriate policies.

#### d) Row Level Security (RLS)
Ensure RLS policies are enabled on all tables (`profiles`, `chats`, `messages`). These should already be in place.

---

### 4. Vercel Build Settings

These are auto-detected from `vercel.json`, but verify in the Vercel dashboard:

| Setting            | Value          |
| ------------------ | -------------- |
| **Framework**      | Vite           |
| **Build Command**  | `npm run build`|
| **Output Directory** | `dist`       |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

---

## Step-by-Step Deployment

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to** [vercel.com](https://vercel.com) and sign in (or create an account)
2. **Click** "Add New..." > "Project"
3. **Import** your GitHub repository (`stego-chat-app`)
4. **Configure project:**
   - Framework Preset: **Vite** (should auto-detect)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add `VITE_SUPABASE_URL` = your Supabase project URL
   - Add `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon key
   - Set scope to **Production**, **Preview**, and **Development**
6. **Click** "Deploy"
7. **Wait** for build to complete (~1-2 minutes)
8. **Update Supabase** redirect URLs with your new Vercel domain

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Scope: Select your account
- Link to existing project: **N** (first time)
- Project name: `stego-chat-app`
- Directory: `./`
- Override settings: **N** (vercel.json handles this)

Then add environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## Post-Deployment Checklist

- [ ] Site loads at the Vercel URL
- [ ] `/auth` route works (not a 404) - tests SPA routing
- [ ] User registration works - tests Supabase Auth
- [ ] User login works
- [ ] Chat messages send/receive - tests Supabase Realtime
- [ ] Image upload works - tests Supabase Storage
- [ ] Steganography encoding/decoding works
- [ ] No console errors in browser DevTools

---

## Optional: Custom Domain

1. Go to Vercel Dashboard > your project > Settings > Domains
2. Add your domain (e.g., `stegochat.com`)
3. Update DNS records as instructed by Vercel
4. Update Supabase redirect URLs to include the custom domain
5. Update Supabase Site URL to the custom domain

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "module not found" | Run `npm install` locally, commit `package-lock.json` |
| Blank page after deploy | Check browser console for env var errors |
| 404 on page refresh | Verify `vercel.json` rewrites are in place |
| Auth redirect fails | Add Vercel domain to Supabase redirect URLs |
| Images don't upload | Check Supabase Storage bucket and CORS settings |
| Real-time not working | Verify Supabase URL and anon key are correct |

---

## Files Modified/Created for Deployment

| File | Change |
|------|--------|
| `package.json` | Resolved merge conflict, set proper name/version |
| `.env.example` | Fixed variable name to match code (`VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `vercel.json` | **NEW** - Vercel config with SPA rewrites |
| `DEPLOYMENT.md` | **NEW** - This deployment guide |
