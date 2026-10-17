import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { RegisterForm } from './RegisterForm'
import { getUser } from '@/lib/guards'

export const metadata = {
  title: 'Create account | PortfolioHub',
}

export default async function RegisterPage() {
  // Already signed in → straight to the builder.
  if (await getUser()) redirect('/profile/builder')

  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
