import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload, UserCheck, UserX, Mail } from 'lucide-react'
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
    .select('id, prenom, nom, email, telephone, portail_actif, invitation_envoyee_at')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  const total = copropriétaires?.length ?? 0
  const portailActif = (copropriétaires ?? []).filter((c) => c.portail_actif).length
  const invites = (copropriétaires ?? []).filter((c) => c.invitation_envoyee_at && !c.portail_actif).length
  const sansInvitation = (copropriétaires ?? []).filter((c) => !c.invitation_envoyee_at && !c.portail_actif).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Copropriétaires</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} copropriétaire{total > 1 ? 's' : ''}
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

      {/* Barre de stats rapide */}
      {total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="coplio-card py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-coplio-text">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">copropriétaires</p>
          </div>

          <div className="coplio-card py-4 border-coplio-green/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Portail actif</p>
              <UserCheck className="w-4 h-4 text-coplio-green" />
            </div>
            <p className="text-2xl font-bold text-coplio-green">{portailActif}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0 ? `${Math.round((portailActif / total) * 100)}% du total` : '—'}
            </p>
          </div>

          <div className="coplio-card py-4 border-coplio-amber/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Invités</p>
              <Mail className="w-4 h-4 text-coplio-amber" />
            </div>
            <p className="text-2xl font-bold text-coplio-amber">{invites}</p>
            <p className="text-xs text-muted-foreground mt-0.5">en attente d&apos;activation</p>
          </div>

          <div className={`coplio-card py-4 ${sansInvitation > 0 ? 'border-red-200' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Sans invitation</p>
              <UserX className={`w-4 h-4 ${sansInvitation > 0 ? 'text-coplio-red' : 'text-muted-foreground'}`} />
            </div>
            <p className={`text-2xl font-bold ${sansInvitation > 0 ? 'text-coplio-red' : 'text-coplio-text'}`}>
              {sansInvitation}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sansInvitation > 0 ? 'à inviter' : 'tous invités ✓'}
            </p>
          </div>
        </div>
      )}

      {copropriétaires && copropriétaires.length > 0 ? (
        <CoproprietairesClient data={copropriétaires.map((c) => ({
          ...c,
          email: c.email ?? undefined,
          telephone: c.telephone ?? undefined,
          portail_actif: c.portail_actif ?? undefined,
          invitation_envoyee_at: c.invitation_envoyee_at ?? undefined,
        }))} />
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
