import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { CoproprietairesClient } from '@/components/syndic/CoproprietairesClient'

export default async function CopropriétairesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  // Use admin client to bypass RLS (no SELECT policy on copropriétaires table)
  const admin = createAdminClient()
  const { data: copropriétaires } = await admin
    .from('coproprietaires')
    .select('id, prenom, nom, email, telephone, portail_actif')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Copropriétaires</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {copropriétaires?.length ?? 0} copropriétaire{(copropriétaires?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/coproprietaires/import"
            className="flex items-center gap-2 bg-coplio-bg text-coplio-text text-sm font-medium px-4 py-2 rounded-lg hover:bg-border transition-colors border border-border"
          >
            <Upload className="w-4 h-4" />
            Importer Excel
          </Link>
          <Link
            href="/coproprietaires/new"
            className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      {copropriétaires && copropriétaires.length > 0 ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <CoproprietairesClient data={copropriétaires as any[]} />
      ) : (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-coplio-green" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucun copropriétaire</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ajoutez vos copropriétaires pour leur donner accès au portail.
          </p>
          <Link
            href="/coproprietaires/new"
            className="inline-flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un copropriétaire
          </Link>
        </div>
      )}
    </div>
  )
}
