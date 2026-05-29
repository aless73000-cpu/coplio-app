import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Landmark, Plus, CheckCircle2, Clock } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'
import { NouveauReleveButton } from './_components/NouveauReleveButton'


export const metadata = { title: 'Rapprochement bancaire' }

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  en_cours:    { label: 'En cours',    color: 'bg-amber-50 text-amber-700' },
  rapproche:   { label: 'Rapproché',   color: 'bg-blue-50 text-blue-700' },
  valide:      { label: 'Validé',      color: 'bg-emerald-50 text-emerald-700' },
}

export default async function RapprochementPage({
  searchParams,
}: {
  searchParams: { copropriete?: string; compte?: string }
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

  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  const selectedId = searchParams.copropriete ?? (coprops ?? [])[0]?.id ?? null

  // Comptes bancaires
  const { data: comptesBancaires } = selectedId
    ? await supabase
        .from('comptes_bancaires')
        .select('id, libelle, iban, banque')
        .eq('copropriete_id', selectedId)
        .eq('actif', true)
        .order('libelle')
    : { data: null }

  const selectedCompte = searchParams.compte ?? comptesBancaires?.[0]?.id ?? null

  // Relevés
  const { data: releves } = selectedCompte
    ? await supabase
        .from('releves_bancaires')
        .select('id, date_debut, date_fin, solde_debut, solde_fin, statut, created_at')
        .eq('compte_bancaire_id', selectedCompte)
        .order('date_debut', { ascending: false })
    : { data: null }

  // Stats non lettrées (sur le compte sélectionné)
  const { count: nbNonLettrees } = selectedCompte
    ? await supabase
        .from('lignes_releve')
        .select('id', { count: 'exact' })
        .eq('statut_lettrage', 'non_lettre')
        .in('releve_id', (releves ?? []).map(r => r.id))
    : { count: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/comptabilite${selectedId ? `?copropriete=${selectedId}` : ''}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Rapprochement bancaire</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Lettrage des écritures avec le relevé bancaire
            </p>
          </div>
        </div>
        {selectedCompte && (
          <NouveauReleveButton
            compteBancaireId={selectedCompte}
            coproprieteId={selectedId!}
          />
        )}
      </div>

      {/* Sélecteur copropriété */}
      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite/rapprochement?copropriete=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedId === c.id
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              {c.nom}
            </Link>
          ))}
        </div>
      )}

      {!selectedId ? (
        <div className="coplio-card text-center py-12">
          <Landmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Sélectionnez une copropriété</p>
        </div>
      ) : !comptesBancaires || comptesBancaires.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Landmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun compte bancaire</p>
          <p className="text-sm text-muted-foreground mb-4">
            Créez d&apos;abord un compte bancaire pour cette copropriété.
          </p>
          <Link
            href={`/comptabilite/rapprochement/comptes/new?copropriete=${selectedId}`}
            className="inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un compte bancaire
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Sidebar comptes bancaires */}
          <div className="w-52 flex-shrink-0 coplio-card p-0 overflow-hidden self-start">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Comptes</p>
              <Link
                href={`/comptabilite/rapprochement/comptes/new?copropriete=${selectedId}`}
                className="text-muted-foreground hover:text-[#374151] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div>
              {comptesBancaires.map((cb) => (
                <Link
                  key={cb.id}
                  href={`/comptabilite/rapprochement?copropriete=${selectedId}&compte=${cb.id}`}
                  className={`flex items-center gap-2 px-4 py-3 border-b border-border last:border-0 transition-colors ${
                    selectedCompte === cb.id
                      ? 'bg-[#374151] text-white'
                      : 'hover:bg-slate-50 text-coplio-text'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{cb.libelle}</p>
                    {cb.banque && (
                      <p className={`text-xs truncate ${selectedCompte === cb.id ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {cb.banque}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Liste des relevés */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Alerte non lettrées */}
            {(nbNonLettrees ?? 0) > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{nbNonLettrees} ligne{(nbNonLettrees ?? 0) > 1 ? 's' : ''}</span>{' '}
                  non lettrée{(nbNonLettrees ?? 0) > 1 ? 's' : ''} sur ce compte.
                </p>
              </div>
            )}

            {!releves || releves.length === 0 ? (
              <div className="coplio-card text-center py-12">
                <p className="text-muted-foreground text-sm">
                  Aucun relevé importé. Créez un nouveau relevé pour commencer le rapprochement.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {releves.map((releve) => {
                  const statut = STATUT_CONFIG[releve.statut] ?? STATUT_CONFIG['en_cours']
                  return (
                    <Link
                      key={releve.id}
                      href={`/comptabilite/rapprochement/${releve.id}?copropriete=${selectedId}`}
                      className="coplio-card flex items-center gap-4 hover:border-[#374151]/20 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#374151] transition-colors">
                        {releve.statut === 'valide'
                          ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 group-hover:text-white" />
                          : <Landmark className="w-4.5 h-4.5 text-[#374151] group-hover:text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-coplio-text text-sm">
                            {formatDate(releve.date_debut)} → {formatDate(releve.date_fin)}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statut.color}`}>
                            {statut.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Solde début : {formatEuro(releve.solde_debut)} · Solde fin : {formatEuro(releve.solde_fin)}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
