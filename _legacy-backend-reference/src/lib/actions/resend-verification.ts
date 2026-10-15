'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, createEmailVerificationToken } from '@/lib/auth'
import { getAppUrl } from '@/lib/urls'

export async function resendVerificationEmail(): Promise<{ success?: boolean; error?: string }> {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return { error: 'غير مسجل الدخول' }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { email: true, displayName: true, emailVerified: true },
  })
  if (!user) return { error: 'المستخدم مش موجود' }
  if (user.emailVerified) return { error: 'الإيميل متأكد بالفعل' }

  await prisma.emailVerificationToken.deleteMany({ where: { userId: sessionUser.id } })

  const token = await createEmailVerificationToken(sessionUser.id)
  const verifyUrl = `${getAppUrl()}/api/verify-email?token=${token}`

  try {
    const { sendVerifyEmail } = await import('@/lib/resend/send')
    await sendVerifyEmail(user.email, user.displayName || 'مستخدم', verifyUrl)
    return { success: true }
  } catch (err) {
    console.error('[resend-verification] failed:', err)
    return { error: 'فشل إرسال الإيميل، حاول تاني' }
  }
}
