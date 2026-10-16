# Deploying PortfolioHub to Vercel

## Prerequisites
- Vercel account (vercel.com)
- Supabase project with connection strings ready
- Resend account for transactional email (optional but recommended)

## Step 1 — Get Your Supabase Connection Strings
1. Go to Supabase Dashboard → your project → Settings → Database
2. Under "Connection string", select "URI"
3. Copy two URLs:
   - **Pooled** (port 6543, mode=transaction): use as `DATABASE_URL`
   - **Direct** (port 5432): use as `DIRECT_URL`
4. Add `?pgbouncer=true&connection_limit=1` to the end of DATABASE_URL

## Step 2 — Generate Secrets
Run these locally:
```bash
openssl rand -base64 32  # → use as JWT_SECRET
openssl rand -base64 32  # → use as CRON_SECRET
```

## Step 3 — Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```
Or connect your GitHub repo in the Vercel dashboard.

## Step 4 — Set Environment Variables
In Vercel Dashboard → your project → Settings → Environment Variables,
add every variable from `.env.vercel.example` marked as REQUIRED.

## Step 5 — Verify Deployment
After deploy completes:
- [ ] Visit /admin — confirm login works
- [ ] Visit /admin/support — confirm DB connection
- [ ] Check Vercel Function Logs for any startup errors
- [ ] Confirm cron jobs appear under Vercel → your project → Cron Jobs

## Known Limitations on Vercel
- File uploads (avatars, media) are stored on ephemeral disk — files will be lost
  on redeploy. Migrate to Cloudinary or Supabase Storage before production use.
- Email verification is a log-only stub — set RESEND_API_KEY to enable real emails.

## Rollback
```bash
vercel rollback
```
