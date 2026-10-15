import { redirect } from 'next/navigation'
import { validateSession } from './auth'
import { cookies } from 'next/headers'

export async function getUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  return validateSession(sessionToken)
}

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  if (user.mustChangePassword) redirect('/change-password')
  return user
}

// Admin-only pages. Non-admins land back in the builder (no admin
// surface is ever rendered for them).
export async function requireAdmin() {
  const user = await requireUser()
  if (!user.isAdmin) redirect('/profile/builder')
  return user
}

export async function redirectIfAuthenticated() {
  const user = await getUser()
  if (user) redirect('/')
}

export async function requireUnauthenticated() {
  const user = await getUser()
  if (user) redirect('/')
}
