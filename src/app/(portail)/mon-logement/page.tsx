import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Home, Building2, MapPin, Hash, Ruler,
  Layers, CreditCard, Phone, Mail, MessageCircle,
  ShieldCheck, Calendar, Flame, Landmark,
  ChevronLeft, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { LOT_TYPE_LABELS } from '@/types'
import { RevealSecret } from '@/components/portail/RevealSecret'

export const metadata = { title: 'Mon logement' }

function InfoRow({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType
  label: string
  value: string | React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        {typeof value === 'string' ? (
          <p className={`text-sm font-semibold mt-0.5 ${accent ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
        ) : (
          <div className="mt-0.5">{value}</div>
        )}
      </div>
    </div>
  )
}

export default async function MonLogementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      lot:lots(
        id, numero, type, etage, surface, nb_pieces, tantiemes, solde_compte, montant_impaye,
        copropriete:coproprietes(
          id, nom, adresse, code_postal, ville,
          annee_construction, nb_etages, surface_totale, tantiemes_totaux,
          assureur, numero_contrat_assurance, expiration_assurance,
          iban, banque,
          cabinet:cabinets(nom, email_contact, telephone)
        )
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/portail')

  const lot = profile.lot as {
    id: string
    numero: string
    type: string
    etage?: string | null
    surface?: number | null
    nb_pieces?: number | null
    tantiemes: number
    solde_compte: number | null
    montant_impaye: number | null
    copropriete: {
      id: string
      nom: string
      adresse?: string | null
      code_postal?: string | null
      ville?: string | null
      annee_construction?: number | null
      nb_etages?: number | null
      surface_totale?: number | null
      tantiemes_totaux?: number | null
      assureur?: string | null
      numero_contrat_assurance?: string | null
      expiration_assurance?: string | null
      iban?: string | null
      banque?: string | null
      cabinet?: { nom: string; email_contact?: string | null; telephone?: string | null } | null
    }
  } | null

  if (!lot) {
    return (
      <div className="max-w-2xl mx-auto py-4 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/accueil" className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Mon logement</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-7 h-7 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Aucun logement associé</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Contactez votre syndic pour lier votre compte à votre lot.</p>
          <Link href="/mes-messages" className="inline-flex items-center gap-2 mt-5 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
            <MessageCircle className="w-4 h-4" /> Contacter le syndic
          </Link>
        </div>
      </div>
    )
  }

  const copro = lot.copropriete
  const solde = lot.solde_compte ?? 0
  const montantImpaye = lot.montant_impaye ?? 0
  const soldePositif = solde >= 0

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/accueil" className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Mon logement</h1>
          <p className="text-xs text-slate-400 mt-0.5">{copro.nom}{lot.numero && ` · Lot ${lot.numero}`}</p>
        </div>
      </div>

      {/* Hero lot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Bandeau top */}
        <div className="px-5 py-4 flex items-center gap-4" style={{ background: '#0f172a' }}>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Mon lot</p>
            <p className="text-xl font-bold text-white mt-0.5">Lot {lot.numero}</p>
            <p className="text-sm text-white/60 mt-0.5">
              {LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type}
              {lot.etage && ` · ${lot.etage}`}
              {lot.surface && ` · ${lot.surface} m²`}
            </p>
          </div>
          {/* Badge solde */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            !soldePositif ? 'bg-red-400/20 text-red-300' :
            montantImpaye > 0 ? 'bg-amber-400/20 text-amber-300' :
            'bg-green-400/20 text-green-300'
          }`}>
            {!soldePositif
              ? <><AlertTriangle className="w-3.5 h-3.5" /> Impayé</>
              : montantImpaye > 0
                ? <><AlertTriangle className="w-3.5 h-3.5" /> En attente</>
                : <><CheckCircle2 className="w-3.5 h-3.5" /> À jour</>
            }
          </div>
        </div>

        {/* Infos lot */}
        <div className="px-5 divide-y divide-slate-100">
          {lot.nb_pieces != null && (
            <InfoRow icon={Home} label="Pièces" value={`${lot.nb_pieces} pièce${lot.nb_pieces > 1 ? 's' : ''}`} />
          )}
          {lot.surface != null && (
            <InfoRow icon={Ruler} label="Surface" value={`${lot.surface} m²`} />
          )}
          {lot.etage && (
            <InfoRow icon={Layers} label="Étage" value={lot.etage} />
          )}
          <InfoRow icon={Hash} label="Tantièmes" value={`${lot.tantiemes} / ${copro.tantiemes_totaux ?? 10000}`} />
          <div className="py-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Solde de compte</p>
                <p className={`text-sm font-bold mt-0.5 ${soldePositif ? 'text-green-600' : 'text-red-600'}`}>
                  {solde >= 0 ? '+' : ''}{solde.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {!soldePositif
                    ? 'Solde débiteur — contactez votre syndic'
                    : montantImpaye > 0
                      ? `${montantImpaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} en attente de paiement`
                      : 'Votre compte est à jour'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copropriété */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Ma copropriété</h2>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <InfoRow icon={Building2} label="Nom" value={copro.nom} />
          {copro.adresse && (
            <InfoRow icon={MapPin} label="Adresse"
              value={[copro.adresse, copro.code_postal, copro.ville].filter(Boolean).join(', ')} />
          )}
          {copro.annee_construction && (
            <InfoRow icon={Calendar} label="Année de construction" value={String(copro.annee_construction)} />
          )}
          {copro.nb_etages != null && (
            <InfoRow icon={Layers} label="Nombre d'étages" value={String(copro.nb_etages)} />
          )}
          {copro.surface_totale != null && (
            <InfoRow icon={Ruler} label="Surface totale" value={`${copro.surface_totale} m²`} />
          )}
        </div>
      </div>

      {/* Assurance */}
      {(copro.assureur || copro.numero_contrat_assurance) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Assurance immeuble</h2>
          </div>
          <div className="px-5 divide-y divide-slate-100">
            {copro.assureur && <InfoRow icon={ShieldCheck} label="Assureur" value={copro.assureur} />}
            {copro.numero_contrat_assurance && (
              <InfoRow icon={Hash} label="N° contrat" value={copro.numero_contrat_assurance} />
            )}
            {copro.expiration_assurance && (
              <InfoRow icon={Calendar} label="Expiration" value={new Date(copro.expiration_assurance).toLocaleDateString('fr-FR')} />
            )}
          </div>
        </div>
      )}

      {/* IBAN syndic — protégé */}
      {copro.iban && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-slate-900">Coordonnées bancaires du syndic</h2>
              <p className="text-xs text-slate-400">Pour vos virements de charges</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {copro.banque && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Banque</p>
                <p className="text-sm font-semibold text-slate-900">{copro.banque}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1.5">IBAN</p>
              <RevealSecret
                label="IBAN du syndic"
                value={copro.iban}
                userEmail={user.email ?? ''}
              />
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              💡 Utilisez cet IBAN pour effectuer vos virements de charges directement depuis votre banque.
              Précisez votre nom et votre numéro de lot en référence.
            </p>
          </div>
        </div>
      )}

      {/* Syndic */}
      {copro.cabinet && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Mon syndic</h2>
          </div>
          <div className="px-5 divide-y divide-slate-100">
            <InfoRow icon={Building2} label="Cabinet" value={copro.cabinet.nom} />
            {copro.cabinet.email_contact && (
              <InfoRow icon={Mail} label="Email"
                value={
                  <a href={`mailto:${copro.cabinet.email_contact}`}
                    className="text-sm font-semibold text-blue-600 hover:underline">{copro.cabinet.email_contact}</a>
                }
              />
            )}
            {copro.cabinet.telephone && (
              <InfoRow icon={Phone} label="Téléphone"
                value={
                  <a href={`tel:${copro.cabinet.telephone}`}
                    className="text-sm font-semibold text-blue-600 hover:underline">{copro.cabinet.telephone}</a>
                }
              />
            )}
          </div>
          <div className="px-5 pb-5 pt-3">
            <Link href="/mes-messages"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
              <MessageCircle className="w-4 h-4" />
              Envoyer un message au syndic
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
