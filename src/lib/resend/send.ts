// Dev stub for transactional email (no provider configured yet).
// Keeps the verification flow working: the link is logged server-side so it
// can be completed manually during development.
// TODO: replace with a real provider (e.g. Resend) before production.

export async function sendVerifyEmail(
  to: string,
  displayName: string,
  verifyUrl: string,
): Promise<void> {
  console.log(`[resend-stub] verify email for ${to} (${displayName}): ${verifyUrl}`)
}
