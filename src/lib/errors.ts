// Unified API error shape per plan: { code, message, fields? }.
// Success payloads keep their own shape; only errors are unified.
export class AppError extends Error {
  readonly code: string
  readonly status: number
  readonly fields?: Record<string, string>

  constructor(code: string, status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.code = code
    this.status = status
    this.fields = fields
  }
}

export function toErrorResponse(err: unknown, fallback = 'Something went wrong'): Response {
  if (err instanceof AppError) {
    return Response.json(
      { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
      { status: err.status },
    )
  }
  console.error('[api]', err)
  return Response.json({ code: 'INTERNAL_ERROR', message: fallback }, { status: 500 })
}

export const Errors = {
  invalidCredentials: () => new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password'),
  validation: (fields: Record<string, string>) =>
    new AppError('VALIDATION_ERROR', 400, 'Invalid request', fields),
  conflict: (message: string) => new AppError('CONFLICT', 409, message),
  unauthorized: () => new AppError('UNAUTHORIZED', 401, 'Not signed in'),
  forbidden: () => new AppError('FORBIDDEN', 403, 'Forbidden'),
  rateLimited: () =>
    new AppError('RATE_LIMITED', 429, 'Too many attempts, try again later'),
  suspended: () =>
    new AppError('ACCOUNT_SUSPENDED', 403, 'Account suspended, contact support'),
  csrf: () => new AppError('CSRF_REJECTED', 403, 'Cross-site request rejected'),
} as const;

export function rateLimitHeaders(retryAfterMs: number): Record<string, string> {
  return { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
}

