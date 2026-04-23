import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortailNav } from '@/components/portail/PortailNav'

export default async function PortailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(*, copropriete:coproprietes(nom))')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner_resident') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-coplio-bg flex flex-col max-w-md mx-auto">
      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Navigation bottom (mobile) */}
      <PortailNav />
    </div>
  )
}
