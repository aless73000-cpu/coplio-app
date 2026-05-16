import { Metadata } from 'next'
import { OnboardingWizard } from '@/components/auth/OnboardingWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Configurer votre cabinet',
  robots: { index: false, follow: false },
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-coplio-bg flex items-center justify-center p-8">
      <OnboardingWizard
        userId={user.id}
        userEmail={user.email!}
        userMeta={user.user_metadata}
      />
    </div>
  )
}
