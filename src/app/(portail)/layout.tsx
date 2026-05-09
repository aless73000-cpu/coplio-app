import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortailSidebar } from '@/components/portail/PortailSidebar'

export default async function PortailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(numero, copropriete:coproprietes(nom))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/portail')
  if (profile.role !== 'owner_resident') redirect('/dashboard')

  const lot = profile.lot as { numero: string; copropriete: { nom: string } } | null

  return (
    <div className="flex h-screen bg-coplio-bg overflow-hidden">
      <PortailSidebar
        prenom={profile.prenom}
        nom={profile.nom}
        email={profile.email}
        lotNumero={lot?.numero ?? null}
        coproprieteNom={lot?.copropriete?.nom ?? null}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
