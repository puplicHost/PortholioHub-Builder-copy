import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
)
const JWT_EXPIRES_IN = '7d'
const PASSWORD_SALT_ROUNDS = 12
const SESSION_TOKEN_LENGTH = 32
const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000 // 7 days (ms)

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function createSession(userId: string): Promise<string> {
  await prisma.session.deleteMany({ where: { userId } })

  const token = crypto.randomBytes(SESSION_TOKEN_LENGTH).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN)

  await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function validateSession(token: string | undefined | null) {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}

export async function deleteAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
}

// ============================================================
// USER MANAGEMENT
// ============================================================

export async function createUser(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) throw new Error('User with this email already exists')

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: (metadata.displayName as string) || normalizedEmail.split('@')[0],
      isAdmin: Boolean(metadata.isAdmin || false),
      emailVerified: Boolean(metadata.emailVerified || false),
      metadata: metadata as Prisma.InputJsonValue,
    },
  })

  await prisma.profile.create({
    data: {
      userId: user.id,
      displayName: user.displayName || undefined,
      avatarUrl: (metadata.avatarUrl as string) || undefined,
      isAdmin: user.isAdmin,
    },
  })

  return user
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export async function updatePassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

export async function getUserByEmail(email: string) {
  if (!email) return null
  const normalizedEmail = email.trim().toLowerCase()
  return prisma.user.findUnique({ where: { email: normalizedEmail } })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function updateUserEmail(userId: string, newEmail: string) {
  const normalizedEmail = newEmail.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing && existing.id !== userId) {
    throw new Error('User with this email already exists')
  }
  await prisma.user.update({ where: { id: userId }, data: { email: normalizedEmail } })
}

// ============================================================
// JWT (API AUTH)
// ============================================================

export async function generateJWT(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return (payload.userId as string) ?? null
  } catch {
    return null
  }
}

// ============================================================
// PASSWORD RESET
// ============================================================

export async function createPasswordResetToken(email: string): Promise<string> {
  const user = await getUserByEmail(email)
  if (!user) return crypto.randomBytes(32).toString('hex')

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })
  return token
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record) return null
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {})
    return null
  }
  return record.userId
}

export async function deletePasswordResetToken(token: string) {
  await prisma.passwordResetToken.deleteMany({ where: { token } })
}

// ============================================================
// EMAIL VERIFICATION
// ============================================================

export async function createEmailVerificationToken(userId: string): Promise<string> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  await prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } })
  return token
}

export async function validateEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })
  if (!record) return null
  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {})
    return null
  }
  return record.userId
}

export async function verifyUserEmail(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } })
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })
}

// ============================================================
// UTILITIES
// ============================================================

export async function getCurrentUser() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  return validateSession(sessionToken)
}

export async function getCurrentSession() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  if (!sessionToken) return null
  return prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  })
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { isAdmin: true },
  })
  if (profile?.isAdmin) return true
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return user?.isAdmin === true
}

export { SESSION_EXPIRES_IN, JWT_EXPIRES_IN, PASSWORD_SALT_ROUNDS }
