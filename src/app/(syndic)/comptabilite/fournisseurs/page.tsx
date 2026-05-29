import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Building2 } from 'lucide-react'
import { FournisseursManager } from './_components/FournisseursManager'


export const metadata = { title: 'Fournisseurs' }

export default async function FournisseursPage({
  searchParams,
}: {
  searchParams: { copropriete?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('id, nom, siret, email, telephone, ville, compte_comptable, actif, mode_paiement')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite${searchParams.copropriete ? `?copropriete=${searchParams.copropriete}` : ''}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Fournisseurs</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {(fournisseurs ?? []).length} fournisseur{(fournisseurs ?? []).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <FournisseursManager
        cabinetId={profile.cabinet_id}
        fournisseurs={fournisseurs ?? []}
      />
    </div>
  )
}
