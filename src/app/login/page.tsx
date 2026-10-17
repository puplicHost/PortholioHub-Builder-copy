import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { LoginForm } from './LoginForm'
import { getUser } from '@/lib/guards'

export const metadata = {
  title: 'Log in | PortfolioHub',
}

export default async function LoginPage() {
  // Already signed in → straight to the builder.
  if (await getUser()) redirect('/profile/builder')

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
