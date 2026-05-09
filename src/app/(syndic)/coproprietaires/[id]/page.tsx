import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Home, MapPin, Pencil, Smartphone } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { InviterPortailButton } from '@/components/syndic/InviterPortailButton'

export default async function CopropriétairePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to bypass RLS (no SELECT policy on copropriétaires)
  const admin = createAdminClient()
  const { data: copropriétaire } = await admin
    .from('coproprietaires')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!copropriétaire) notFound()

  // Get lots via junction table
  const { data: junctionData } = await admin
    .from('coproprietaire_lots')
    .select('lot_id')
    .eq('coproprietaire_id', params.id)

  const lotIds = (junctionData ?? []).map((j: { lot_id: string }) => j.lot_id)

  const lotsData = lotIds.length > 0
    ? (await admin
        .from('lots')
        .select('id, numero, type, etage, surface, tantiemes, solde_compte, copropriete:coproprietes(id, nom)')
        .in('id', lotIds)
        .order('numero')).data
    : []

  const lots = (lotsData ?? []).map((lot) => ({ lot }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/coproprietaires" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-coplio-text">
            {copropriétaire.prenom} {copropriétaire.nom}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lots.length} lot{lots.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/coproprietaires/${params.id}/edit`}
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Fiche contact */}
        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 bg-coplio-green/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-coplio-green" />
            </div>
            <div>
              <p className="font-bold text-coplio-text text-lg">
                {copropriétaire.prenom} {copropriétaire.nom}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  copropriétaire.portail_actif
                    ? 'bg-coplio-green-light text-coplio-green'
                    : 'bg-coplio-bg text-muted-foreground'
                }`}>
                  {copropriétaire.portail_actif ? 'Portail actif' : 'Portail inactif'}
                </span>
              </div>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            {copropriétaire.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${copropriétaire.email}`} className="text-coplio-green hover:underline">
                  {copropriétaire.email}
                </a>
              </div>
            )}
            {copropriétaire.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${copropriétaire.telephone}`} className="text-coplio-text hover:text-coplio-green">
                  {copropriétaire.telephone}
                </a>
              </div>
            )}
            {copropriétaire.adresse_correspondance && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-coplio-text">{copropriétaire.adresse_correspondance}</span>
              </div>
            )}
          </dl>
        </div>

        {/* Portail copropriétaire */}
        <div className="coplio-card">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-coplio-text">Portail copropriétaire</h2>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                copropriétaire.portail_actif
                  ? 'bg-coplio-green-light text-coplio-green'
                  : 'bg-coplio-bg text-muted-foreground'
              }`}>
                {copropriétaire.portail_actif ? 'Accès actif' : 'Accès inactif'}
              </span>
              {copropriétaire.invitation_envoyee_at && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Invitation envoyée le {formatDate(copropriétaire.invitation_envoyee_at)}
                </p>
              )}
            </div>
          </div>

          {copropriétaire.email ? (
            <InviterPortailButton
              coproprietaireId={copropriétaire.id}
              email={copropriétaire.email}
              invitationDejaSent={!!copropriétaire.invitation_envoyee_at}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ajoutez un email pour pouvoir inviter ce copropriétaire.
            </p>
          )}
        </div>

        {/* Lots */}
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Lots</h2>
          {lots.length > 0 ? (
            <div className="space-y-3">
              {lots.map((cl) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lot = cl.lot as any
                const coproprieteNom = Array.isArray(lot.copropriete) ? lot.copropriete[0]?.nom : lot.copropriete?.nom
                return (
                  <Link
                    key={lot.id}
                    href={`/lots/${lot.id}`}
                    className="flex items-center gap-3 p-3 bg-coplio-bg rounded-xl hover:bg-border transition-colors"
                  >
                    <div className="w-9 h-9 bg-coplio-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-coplio-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coplio-text">
                        Lot {lot.numero}
                        {lot.etage && <span className="text-muted-foreground font-normal"> · {lot.etage}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{coproprieteNom}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{lot.tantiemes} t.</p>
                      {lot.solde_compte !== 0 && (
                        <p className={`text-xs font-medium ${lot.solde_compte < 0 ? 'text-red-500' : 'text-coplio-green'}`}>
                          {formatEuro(lot.solde_compte)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun lot assigné</p>
          )}
        </div>
      </div>
    </div>
  )
}
