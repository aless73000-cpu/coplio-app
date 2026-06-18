import { Fragment, type ReactNode } from 'react'
import { Check, Clock, RefreshCw, DatabaseZap, MessageSquare } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
 * Pricing « par copropriété, dégressif » + forfait fixe par plan.
 * Toutes les données sont ici → modifier les prix/coches sans toucher au JSX.
 * Pour appliquer la DA verte : ACCENT = '#0F6E56' / ACCENT_SOFT = '#E1F5EE'.
 * ────────────────────────────────────────────────────────────────────────── */

const ACCENT = '#374151'        // gris Coplio (live)
const ACCENT_SOFT = '#F1F5F9'   // fond doux

type SocleTier = { label: string; price: number }

const SOCLE_TIERS: SocleTier[] = [
  { label: '1 à 4 copropriétés', price: 30 },
  { label: '5 à 20 copropriétés', price: 24 },
  { label: '21 copropriétés et plus', price: 19 },
]

type PlanKey = 'essentiel' | 'pro' | 'cabinet'

type Plan = {
  key: PlanKey
  name: string
  pitch: string
  /** Forfait mensuel fixe en sus du socle. null = inclus dans le socle. */
  forfait: number | null
  popular?: boolean
  highlights: { label: string; soon?: boolean }[]
  cta: string
  href: string
}

const PLANS: Plan[] = [
  {
    key: 'essentiel',
    name: 'Essentiel',
    pitch: 'Tout le socle légal pour gérer vos copropriétés en règle.',
    forfait: null,
    cta: "Démarrer l'essai gratuit",
    href: '/register',
    highlights: [
      { label: 'Copropriétés, lots & tantièmes' },
      { label: 'Comptabilité en partie double' },
      { label: 'Appels de charges & budgets' },
      { label: "Carnet d'entretien & fonds de travaux" },
      { label: 'Assemblées générales & PV' },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    pitch: 'Automatisez la compta, les AG et la relation copropriétaires.',
    forfait: 39,
    popular: true,
    cta: "Démarrer l'essai gratuit",
    href: '/register',
    highlights: [
      { label: 'Rapprochement bancaire & export FEC' },
      { label: "Relances d'impayés automatiques" },
      { label: 'Vote en ligne, pouvoirs & consultations' },
      { label: 'Signature électronique & modèles' },
      { label: 'Sinistres, prestataires & messagerie' },
      { label: 'Espace bailleur · Assistant IA · support prioritaire' },
    ],
  },
  {
    key: 'cabinet',
    name: 'Cabinet',
    pitch: 'Pour les cabinets qui veulent tout piloter, à plusieurs.',
    forfait: 89,
    cta: "Démarrer l'essai gratuit",
    href: '/register',
    highlights: [
      { label: 'AG en visioconférence' },
      { label: 'Multi-utilisateurs & rôles' },
      { label: 'Reporting & tableaux de bord sur mesure' },
      { label: 'Paiement en ligne des charges', soon: true },
      { label: 'Mise en concurrence prestataires', soon: true },
      { label: 'API & webhooks', soon: true },
    ],
  },
]

/** Valeur d'une cellule : true (inclus) · false (—) · string (libellé) */
type Cell = boolean | string
type FeatureRow = { label: string; soon?: boolean; values: Record<PlanKey, Cell> }
type FeatureGroup = { title: string; rows: FeatureRow[] }

const all = (v: Cell): Record<PlanKey, Cell> => ({ essentiel: v, pro: v, cabinet: v })
const proUp = (): Record<PlanKey, Cell> => ({ essentiel: false, pro: true, cabinet: true })
const cabinetOnly = (): Record<PlanKey, Cell> => ({ essentiel: false, pro: false, cabinet: true })

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Gestion & obligations légales',
    rows: [
      { label: 'Copropriétés, lots & tantièmes', values: all(true) },
      { label: 'Annuaire des copropriétaires', values: all(true) },
      { label: 'Clés de répartition', values: all(true) },
      { label: "Carnet d'entretien", values: all(true) },
      { label: 'Fonds de travaux (loi ALUR)', values: all(true) },
      { label: "Obligations légales & registre d'immatriculation", values: all(true) },
      { label: 'Agenda & échéancier', values: all(true) },
    ],
  },
  {
    title: 'Comptabilité & finances',
    rows: [
      { label: 'Appels de charges & budgets prévisionnels', values: all(true) },
      { label: 'Comptabilité en partie double (journaux, grand-livre, balance)', values: all(true) },
      { label: 'Plan comptable & exercices (clôture)', values: all(true) },
      { label: 'Factures & fournisseurs', values: all(true) },
      { label: 'Suivi des impayés', values: all(true) },
      { label: "Relances d'impayés automatiques", values: proUp() },
      { label: 'Rapprochement bancaire', values: proUp() },
      { label: 'Export FEC & exports comptables', values: proUp() },
    ],
  },
  {
    title: 'Assemblées & décisions',
    rows: [
      { label: 'Assemblées générales & PV', values: all(true) },
      { label: 'Résolutions & votes en AG', values: all(true) },
      { label: 'Pouvoirs / mandats', values: proUp() },
      { label: 'Votes & consultations en ligne', values: proUp() },
      { label: 'AG en visioconférence', values: cabinetOnly() },
    ],
  },
  {
    title: 'Portail copropriétaire (extranet)',
    rows: [
      { label: 'Extranet copropriétaire sécurisé', values: proUp() },
      { label: 'Espace charges, documents & appels de fonds', values: all(true) },
      { label: "Messagerie & signalement d'incidents", values: all(true) },
      { label: 'Espace conseil syndical', values: all(true) },
      { label: 'Espace bailleur / gestion locataire', values: proUp() },
      { label: 'Vente de lot / mutation', values: proUp() },
      { label: 'Paiement en ligne des charges (SEPA / CB)', soon: true, values: cabinetOnly() },
    ],
  },
  {
    title: 'Documents, sinistres & prestataires',
    rows: [
      { label: 'Coffre-fort documentaire (GED)', values: all(true) },
      { label: 'Modèles de documents', values: all(true) },
      { label: 'Signature électronique', values: proUp() },
      { label: 'Gestion des sinistres', values: proUp() },
      { label: 'Gestion des prestataires', values: proUp() },
      { label: "Mise en concurrence prestataires (appels d'offres)", soon: true, values: cabinetOnly() },
    ],
  },
  {
    title: 'Pilotage, équipe & support',
    rows: [
      { label: 'Tableau de bord & recherche globale', values: all(true) },
      { label: 'Notifications temps réel & push', values: all(true) },
      { label: 'Assistant IA', values: proUp() },
      { label: 'Application mobile native', values: proUp() },
      { label: 'Multi-utilisateurs & rôles', values: proUp() },
      { label: 'Reporting & tableaux de bord sur mesure', values: cabinetOnly() },
      { label: 'API & webhooks', soon: true, values: cabinetOnly() },
      { label: 'Support', values: { essentiel: 'Email', pro: 'Email prioritaire', cabinet: 'Téléphone dédié' } },
      { label: 'Onboarding accompagné', values: cabinetOnly() },
    ],
  },
]

const CONDITIONS = [
  { icon: Clock, title: 'Essai gratuit 30 jours', body: 'Testez Coplio sur vos vraies copropriétés, sans carte bancaire. Aucun engagement.' },
  { icon: RefreshCw, title: 'Engagement annuel : 2 mois offerts', body: "En réglant à l'année, vous économisez l'équivalent de deux mois — socle et forfaits." },
  { icon: DatabaseZap, title: 'Mise en service : 200 €, offerte en annuel', body: 'On migre vos données depuis votre ancien logiciel. Frais offerts en engagement annuel.' },
  { icon: MessageSquare, title: 'SMS en crédits, à la consommation', body: 'Notifications par SMS facturées à l\'usage, hors forfait. Vous ne payez que ce que vous envoyez.' },
] as const

const SoonPill = () => (
  <span className="ml-2 align-middle text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
    À venir
  </span>
)

export default function PricingTarifs({
  headingLevel = 1,
  founderSlot,
}: {
  /** 1 pour la page /tarifs (titre principal), 2 quand intégré dans la home. */
  headingLevel?: 1 | 2
  /** Emplacement optionnel (ex. bandeau offre fondateur) inséré sous le titre. */
  founderSlot?: ReactNode
} = {}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h1'
  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      {/* Header */}
      <div className="pt-10 pb-4 text-center mb-14">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
          Tarifs
        </span>
        <Heading className="text-4xl sm:text-5xl font-bold text-[#1C1C1A] mt-3 mb-5 tracking-tight">
          Un prix par copropriété. Dégressif. Sans surprise.
        </Heading>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Pensé pour les syndics indépendants. Vous payez pour les immeubles que vous gérez —
          et l&apos;unité baisse à mesure que votre cabinet grandit.
        </p>
      </div>

      {/* Emplacement fondateur (optionnel) */}
      {founderSlot && <div className="mb-12">{founderSlot}</div>}

      {/* Socle dégressif */}
      <div className="grid sm:grid-cols-3 rounded-2xl border border-gray-200 overflow-hidden bg-white mb-3">
        {SOCLE_TIERS.map((tier, i) => (
          <div
            key={tier.label}
            className={`p-7 ${i < SOCLE_TIERS.length - 1 ? 'sm:border-r border-b sm:border-b-0 border-gray-200' : ''}`}
            style={i === SOCLE_TIERS.length - 1 ? { background: ACCENT_SOFT } : undefined}
          >
            <div className="text-[13px] font-semibold text-gray-500">{tier.label}</div>
            <div className="mt-2 font-bold tracking-tight" style={{ color: ACCENT }}>
              <span className="text-5xl">{tier.price}</span>
              <span className="text-base font-medium text-gray-400 ml-1">€</span>
            </div>
            <div className="text-xs text-gray-400">par copropriété / mois</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-16">
        Le tarif s&apos;applique automatiquement à l&apos;ensemble de votre parc selon votre palier.{' '}
        <span className="font-semibold" style={{ color: ACCENT }}>
          Plus vous gérez de copropriétés, moins l&apos;unité vous coûte.
        </span>
      </p>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-8 flex flex-col relative ${plan.popular ? 'shadow-lg' : 'border-gray-200'}`}
            style={plan.popular ? { borderColor: ACCENT, boxShadow: `0 10px 30px -18px ${ACCENT}55` } : undefined}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span
                  className="text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider"
                  style={{ background: ACCENT }}
                >
                  Le plus choisi
                </span>
              </div>
            )}

            <h2 className="text-xl font-bold text-[#1C1C1A]">{plan.name}</h2>
            <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{plan.pitch}</p>

            <div className="mt-5 mb-1">
              {plan.forfait === null ? (
                <span className="text-3xl font-bold" style={{ color: ACCENT }}>Inclus</span>
              ) : (
                <>
                  <span className="text-4xl font-bold text-[#1C1C1A]">+{plan.forfait} €</span>
                  <span className="text-gray-400 text-sm ml-1">/mois</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-7 min-h-[16px]">
              {plan.forfait === null ? 'Vous payez uniquement le socle par copropriété.' : 'En plus du socle par copropriété.'}
            </p>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.highlights.map((h) => (
                <li key={h.label} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                  <span>
                    {h.label}
                    {h.soon && <SoonPill />}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={plan.href}
              className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${plan.popular ? 'text-white' : 'bg-gray-100 text-[#1C1C1A] hover:bg-gray-200'}`}
              style={plan.popular ? { background: ACCENT } : undefined}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>

      {/* Tableau comparatif */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-[#1C1C1A] text-center mb-2 tracking-tight">
          Le détail, plan par plan
        </h2>
        <p className="text-gray-400 text-sm text-center mb-10">
          Les fonctionnalités <SoonPill /> sont sur la feuille de route et incluses dès leur sortie dans le plan indiqué.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-4 text-gray-400 font-normal w-1/2">Fonctionnalité</th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className="text-center pb-4 font-semibold text-gray-500"
                    style={p.popular ? { color: ACCENT } : undefined}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((group) => (
                <Fragment key={group.title}>
                  <tr>
                    <td
                      colSpan={4}
                      className="pt-6 pb-2 text-[12px] font-semibold uppercase tracking-wide"
                      style={{ color: ACCENT }}
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 text-gray-700 font-medium">
                        {row.label}
                        {row.soon && <SoonPill />}
                      </td>
                      {PLANS.map((p) => {
                        const v = row.values[p.key]
                        return (
                          <td key={p.key} className="py-3.5 text-center">
                            {typeof v === 'boolean' ? (
                              v ? (
                                <Check className="w-4 h-4 mx-auto" style={{ color: ACCENT }} />
                              ) : (
                                <span className="block w-4 h-0.5 bg-gray-200 mx-auto rounded" />
                              )
                            ) : (
                              <span className="text-gray-700 font-medium">{v}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conditions */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-[#1C1C1A] mb-2 tracking-tight">Conditions &amp; options</h2>
        <p className="text-gray-400 text-sm mb-8">
          Les mêmes règles pour tous les plans — pensées pour lever les freins, pas pour piéger.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {CONDITIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 items-start rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ACCENT_SOFT }}>
                <Icon className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div>
                <h4 className="font-semibold text-[#1C1C1A] mb-1">{title}</h4>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Garantie */}
      <p className="text-center text-sm text-gray-400 mt-12">
        Résiliation en 1 clic · Données exportables à tout moment · Hébergement 🇪🇺 RGPD
      </p>
    </div>
  )
}
