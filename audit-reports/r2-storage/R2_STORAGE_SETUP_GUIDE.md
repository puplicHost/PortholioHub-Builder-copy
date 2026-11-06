# R2 Storage Setup Guide

## Cloudflare R2 setup
1. Create a Cloudflare account and enable R2.
2. Create a bucket (e.g. `portfoliohub-files`).
3. Create an API token with Object Read & Write on the bucket. Note Account ID, Access Key ID, Secret Access Key.
4. Set CORS on the bucket to allow PUT/GET from your app origin:
   - AllowedOrigins: your app URL(s)
   - AllowedMethods: GET, PUT, HEAD, DELETE
   - AllowedHeaders: *
   - ExposeHeaders: ETag
   - MaxAgeSeconds: 3600
5. (Optional) Enable public access / custom domain for public files; set R2_PUBLIC_BASE_URL.

## Environment variables (server-side only)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://files.example.com (optional)

## Database migration (safe environment only)
npx prisma migrate dev --name add_r2_fields
Review generated SQL for destructive operations.
Apply to production via: npx prisma migrate deploy (after staging verification).

## Notes
- Images remain on Cloudinary; do not migrate.
- Existing Google Drive URLs remain supported (stored as url in items).
- Large files: single PUT up to 500MB; multipart service available for extension.