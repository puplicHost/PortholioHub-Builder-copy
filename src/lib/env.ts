import { z } from 'zod'

// Server environment validation. Fails fast with the variable NAME
// (never the value) so misconfiguration is obvious and secret-safe.
const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  CRON_SECRET: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
})

export type ServerEnv = z.infer<typeof envSchema>

let cached: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env)
    if (!parsed.success) {
      const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
      throw new Error(`Invalid server environment: ${names}`)
    }
    cached = parsed.data
  }
  return cached
}
