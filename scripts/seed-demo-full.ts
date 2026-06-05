/**
 * COPLIO — Script de seed démonstration COMPLET
 * Crée : 1 syndic, 1 cabinet, 4 copropriétés × 20 lots × 20 copropriétaires
 * + 12 mois d'historique sur (presque) toutes les fonctionnalités :
 *   AG (résolutions + votes nominatifs), sinistres (étapes/devis/intervenants),
 *   appels de charges (4 trimestres + impayés + relances), votes portail,
 *   messagerie, agenda, prestataires, carnet d'entretien, documents,
 *   budgets prévisionnels, fonds travaux, travaux, clés, obligations légales,
 *   archives, conseil syndical, notifications.
 *
 * NB : le module Comptabilité (écritures double-entrée) n'est PAS seedé
 *      (bootstrap exercices + équilibre validé par triggers = hors scope).
 *
 * Usage : npx tsx scripts/seed-demo-full.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes. Usage :\n  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo-full.ts')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Logs ──────────────────────────────────────────────────────────
function log(msg: string) { console.log(`    ✓ ${msg}`) }
function section(msg: string) { console.log(`\n  ▶ ${msg}`) }
function bigSection(msg: string) { console.log(`\n${'═'.repeat(62)}\n  ${msg}\n${'═'.repeat(62)}`) }

// ─── Helpers temps (ancrés sur maintenant) ──────────────────────────
const NOW = new Date()
function monthsAgo(n: number): Date { const d = new Date(NOW); d.setMonth(d.getMonth() - n); return d }
function monthsFromNow(n: number): Date { const d = new Date(NOW); d.setMonth(d.getMonth() + n); return d }
function daysAgo(n: number): Date { const d = new Date(NOW); d.setDate(d.getDate() - n); return d }
function daysFromNow(n: number): Date { const d = new Date(NOW); d.setDate(d.getDate() + n); return d }
function iso(d: Date): string { return d.toISOString() }
function ymd(d: Date): string { return d.toISOString().split('T')[0] }
function eur(n: number): number { return Math.round(n * 100) / 100 }
function pick<T>(arr: T[], i: number): T { return arr[i % arr.length] }
function slug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

// Insert helper qui remonte une erreur explicite
async function ins<T = unknown>(table: string, rows: object | object[], select = false): Promise<T[]> {
  let q = db.from(table).insert(rows as never)
  if (select) {
    const { data, error } = await q.select()
    if (error) throw new Error(`[${table}] ${error.message}`)
    return (data ?? []) as T[]
  }
  const { error } = await q
  if (error) throw new Error(`[${table}] ${error.message}`)
  return []
}

// ─── Données de référence ───────────────────────────────────────────

const SYNDIC = {
  email: 'demo@coplio.fr',
  password: 'Coplio2026!',
  prenom: 'Camille',
  nom: 'Durand',
}

const PRENOMS = [
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Laurent', 'Isabelle', 'Philippe', 'Nathalie',
  'François', 'Catherine', 'Michel', 'Anne', 'Jacques', 'Sylvie', 'Pierre-Yves', 'Hélène',
  'Olivier', 'Christine', 'Daniel', 'Valérie', 'Bernard', 'Sandrine', 'Thierry', 'Caroline',
  'Patrick', 'Nadia', 'Alain', 'Émilie', 'Gérard', 'Julie', 'Marc', 'Aurélie',
  'Vincent', 'Céline', 'Stéphane', 'Patricia', 'Bruno', 'Karine', 'Denis', 'Laure',
]
const NOMS = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefèvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier',
  'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'Lambert', 'Bonnet', 'Rousseau',
  'Faure', 'Clément', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Marchand', 'Perrin',
]

// Gabarit des 20 lots (réutilisé par copro, tantièmes ~9890/copro)
const LOT_TEMPLATE = [
  { numero: 'A01', type: 'appartement', etage: 'RDC', surface: 48, tantiemes: 580 },
  { numero: 'A02', type: 'appartement', etage: 'RDC', surface: 52, tantiemes: 620 },
  { numero: 'A03', type: 'appartement', etage: '1er', surface: 55, tantiemes: 650 },
  { numero: 'A04', type: 'appartement', etage: '1er', surface: 60, tantiemes: 700 },
  { numero: 'A05', type: 'appartement', etage: '2e', surface: 62, tantiemes: 720 },
  { numero: 'A06', type: 'appartement', etage: '2e', surface: 65, tantiemes: 760 },
  { numero: 'A07', type: 'appartement', etage: '3e', surface: 70, tantiemes: 800 },
  { numero: 'A08', type: 'appartement', etage: '3e', surface: 54, tantiemes: 640 },
  { numero: 'A09', type: 'appartement', etage: '4e', surface: 46, tantiemes: 560 },
  { numero: 'A10', type: 'appartement', etage: '4e', surface: 82, tantiemes: 900 },
  { numero: 'A11', type: 'appartement', etage: '5e', surface: 78, tantiemes: 850 },
  { numero: 'A12', type: 'appartement', etage: '5e', surface: 58, tantiemes: 680 },
  { numero: 'B01', type: 'appartement', etage: 'RDC', surface: 30, tantiemes: 300 },
  { numero: 'B02', type: 'appartement', etage: '1er', surface: 32, tantiemes: 320 },
  { numero: 'B03', type: 'appartement', etage: '2e', surface: 28, tantiemes: 280 },
  { numero: 'B04', type: 'appartement', etage: '3e', surface: 34, tantiemes: 340 },
  { numero: 'C01', type: 'cave', etage: 'SS1', surface: 8, tantiemes: 40 },
  { numero: 'C02', type: 'cave', etage: 'SS1', surface: 7, tantiemes: 35 },
  { numero: 'P01', type: 'parking', etage: 'SS1', surface: 12, tantiemes: 60 },
  { numero: 'P02', type: 'parking', etage: 'SS1', surface: 12, tantiemes: 55 },
]

interface CoproCfg {
  nom: string; adresse: string; code_postal: string; ville: string
  annee: number; etages: number; assureur: string; iban: string; banque: string
  budget: number
}
const COPROS: CoproCfg[] = [
  { nom: 'Résidence Le Parc', adresse: '24 Avenue Jean Jaurès', code_postal: '69007', ville: 'Lyon', annee: 1992, etages: 5, assureur: 'AXA Immobilier', iban: 'FR76 3000 4000 0100 0000 0001 234', banque: 'BNP Paribas', budget: 78000 },
  { nom: 'Le Clos des Tilleuls', adresse: '8 Rue des Tilleuls', code_postal: '69003', ville: 'Lyon', annee: 2005, etages: 4, assureur: 'Allianz', iban: 'FR76 1027 8073 0000 0002 345 678', banque: 'Crédit Mutuel', budget: 64000 },
  { nom: 'Résidence Bellevue', adresse: '15 Cours Émile Zola', code_postal: '69100', ville: 'Villeurbanne', annee: 1978, etages: 6, assureur: 'MAAF', iban: 'FR76 3000 3000 0100 0003 456 789', banque: 'Société Générale', budget: 92000 },
  { nom: 'Carré Saint-Jean', adresse: '3 Place Saint-Jean', code_postal: '69005', ville: 'Lyon', annee: 2018, etages: 3, assureur: 'Groupama', iban: 'FR76 1680 7001 0000 0004 567 890', banque: 'Banque Populaire', budget: 58000 },
]

// ─── Création / récupération d'un utilisateur auth ──────────────────
const userCache = new Map<string, string>() // email → id

async function loadExistingUsers() {
  let page = 1
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    for (const u of data.users) if (u.email) userCache.set(u.email, u.id)
    if (data.users.length < 1000) break
    page++
  }
}

async function getOrCreateUser(email: string, password: string, meta: Record<string, unknown>): Promise<string> {
  const existing = userCache.get(email)
  if (existing) return existing
  const { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: meta,
  })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  userCache.set(email, data.user.id)
  return data.user.id
}

// ─── Seed d'une copropriété complète ────────────────────────────────
interface Owner {
  prenom: string; nom: string; email: string; lot: string
  lotId: string; coproId: string; profileId: string; tantiemes: number; password: string
}

async function seedCopro(cfg: CoproCfg, cIdx: number, cabinetId: string, syndicId: string, prestataires: { id: string; metier: string }[]) {
  bigSection(`COPROPRIÉTÉ ${cIdx + 1}/4 — ${cfg.nom}`)

  // 1. Copropriété
  const [copro] = await ins<{ id: string }>('coproprietes', {
    cabinet_id: cabinetId, gestionnaire_id: syndicId,
    nom: cfg.nom, adresse: cfg.adresse, code_postal: cfg.code_postal, ville: cfg.ville,
    annee_construction: cfg.annee, nb_etages: cfg.etages,
    assureur: cfg.assureur, numero_contrat_assurance: `${slug(cfg.assureur).toUpperCase().slice(0, 4)}-2025-${10000 + cIdx}`,
    expiration_assurance: ymd(monthsFromNow(7)),
    iban: cfg.iban, banque: cfg.banque, statut: 'a_jour',
  }, true)
  const coproprieteId = copro.id
  log(`Copropriété créée : ${cfg.nom} (${cfg.ville})`)

  // 2. Lots
  const lots = await ins<{ id: string; numero: string }>('lots',
    LOT_TEMPLATE.map(l => ({
      copropriete_id: coproprieteId, numero: l.numero, type: l.type,
      etage: l.etage, surface: l.surface, tantiemes: l.tantiemes, solde_compte: 0,
    })), true)
  const lotMap = new Map(lots.map(l => [l.numero, l.id]))
  log(`${lots.length} lots créés`)

  // 3. Copropriétaires (auth + profile + coproprietaire + liaison lot)
  section('Copropriétaires + portails actifs')
  const owners: Owner[] = []
  for (let li = 0; li < LOT_TEMPLATE.length; li++) {
    const tpl = LOT_TEMPLATE[li]
    const prenom = pick(PRENOMS, cIdx * 20 + li)
    const nom = pick(NOMS, cIdx * 13 + li * 7)
    const email = `${slug(prenom)}.${slug(nom)}.c${cIdx + 1}${tpl.numero.toLowerCase()}@horizon-demo.fr`
    const password = `Portail#${cIdx + 1}${tpl.numero}!`
    const lotId = lotMap.get(tpl.numero)!

    const profileId = await getOrCreateUser(email, password, { prenom, nom, role: 'owner_resident' })
    await db.from('profiles').upsert({
      id: profileId, cabinet_id: cabinetId, role: 'owner_resident',
      prenom, nom, email, lot_id: lotId, onboarding_complete: true,
    }, { onConflict: 'id' })

    const [copropA] = await ins<{ id: string }>('coproprietaires', {
      cabinet_id: cabinetId, profile_id: profileId, prenom, nom, email,
      telephone: `06 ${10 + cIdx}${li.toString().padStart(2, '0')} ${20 + li} ${30 + li} ${40 + li}`.replace(/ +/g, ' ').slice(0, 14),
      portail_actif: true, invitation_envoyee_at: iso(monthsAgo(11)),
    }, true)

    await ins('coproprietaire_lots', {
      coproprietaire_id: copropA.id, lot_id: lotId, date_acquisition: '2019-01-01',
    })

    owners.push({ prenom, nom, email, lot: tpl.numero, lotId, coproId: copropA.id, profileId, tantiemes: tpl.tantiemes, password })
  }
  log(`${owners.length} copropriétaires créés (portail actif)`)
  const byLot = (n: string) => owners.find(o => o.lot === n)!

  // 4. Conseil syndical (4 membres = copropriétaires A01..A04)
  section('Conseil syndical')
  const conseilRoles = ['president', 'secretaire', 'tresorier', 'membre']
  await ins('conseil_syndical', ['A01', 'A02', 'A03', 'A04'].map((ln, i) => {
    const o = byLot(ln)
    return {
      copropriete_id: coproprieteId, prenom: o.prenom, nom: o.nom, email: o.email,
      telephone: '06 00 00 00 0' + i, role: conseilRoles[i], lot_numero: ln,
      date_debut: ymd(monthsAgo(11)),
    }
  }))
  log('Conseil syndical : président, secrétaire, trésorier, membre')

  // 5. Assemblées générales + résolutions + votes nominatifs
  section('Assemblées générales (historique 12 mois)')

  async function createAGTerminee(titre: string, type: string, dAg: Date, resolutions: { titre: string; type_vote: string }[]) {
    const [ag] = await ins<{ id: string }>('assemblees_generales', {
      copropriete_id: coproprieteId, cabinet_id: cabinetId, gestionnaire_id: syndicId,
      titre, type, status: 'terminee', date_ag: iso(dAg),
      lieu: `Salle de quartier — ${cfg.ville}`,
      tantiemes_requis: 5001,
      convocations_envoyees_at: iso(new Date(dAg.getTime() - 30 * 864e5)),
    }, true)

    let totalPresents = 0
    for (let ri = 0; ri < resolutions.length; ri++) {
      const r = resolutions[ri]
      const [res] = await ins<{ id: string }>('ag_resolutions', {
        ag_id: ag.id, ordre: ri + 1, titre: r.titre, type_vote: r.type_vote,
      }, true)

      // Votes nominatifs : ~85% des lots votent
      let vp = 0, vc = 0, va = 0, tp = 0, tc = 0
      const agVotes: object[] = []
      for (const o of owners) {
        if (Math.random() < 0.15) continue // absent / non votant
        const roll = Math.random()
        const valeur = roll < 0.7 ? 'pour' : roll < 0.88 ? 'contre' : 'abstention'
        if (valeur === 'pour') { vp++; tp += o.tantiemes }
        else if (valeur === 'contre') { vc++; tc += o.tantiemes }
        else va++
        agVotes.push({ resolution_id: res.id, coproprietaire_id: o.coproId, lot_id: o.lotId, valeur, tantiemes: o.tantiemes, vote_a: iso(dAg) })
      }
      await ins('ag_votes', agVotes)
      totalPresents = Math.max(totalPresents, tp + tc) // approx présents
      const adoptee = r.type_vote === 'art_25' || r.type_vote === 'art_26'
        ? tp > (9890 / 2) // majorité absolue des tantièmes
        : tp > tc          // majorité simple des présents
      await db.from('ag_resolutions').update({
        voix_pour: vp, voix_contre: vc, voix_abstention: va,
        tantiemes_pour: tp, tantiemes_contre: tc, adoptee,
      }).eq('id', res.id)
    }
    await db.from('assemblees_generales').update({ tantiemes_presents: totalPresents }).eq('id', ag.id)
    return ag.id
  }

  await createAGTerminee('Assemblée Générale Ordinaire 2025', 'ordinaire', monthsAgo(7), [
    { titre: "Approbation des comptes de l'exercice 2024", type_vote: 'art_24' },
    { titre: 'Vote du budget prévisionnel 2025', type_vote: 'art_24' },
    { titre: 'Quitus au syndic', type_vote: 'art_24' },
    { titre: 'Réfection de l\'éclairage des parties communes', type_vote: 'art_25' },
  ])
  log('AG Ordinaire 2025 — terminée (4 résolutions, votes nominatifs)')

  await createAGTerminee('AG Extraordinaire — Travaux de toiture', 'extraordinaire', monthsAgo(3), [
    { titre: 'Réfection de l\'étanchéité de la toiture-terrasse', type_vote: 'art_25' },
    { titre: 'Choix de l\'entreprise et plan de financement', type_vote: 'art_24' },
  ])
  log('AG Extraordinaire — terminée (2 résolutions)')

  const [agPlan] = await ins<{ id: string }>('assemblees_generales', {
    copropriete_id: coproprieteId, cabinet_id: cabinetId, gestionnaire_id: syndicId,
    titre: 'Assemblée Générale Ordinaire 2026', type: 'ordinaire', status: 'planifiee',
    date_ag: iso(monthsFromNow(1)), lieu: `Salle de quartier — ${cfg.ville}`,
  }, true)
  await ins('ag_resolutions', [
    { ag_id: agPlan.id, ordre: 1, titre: "Approbation des comptes de l'exercice 2025", type_vote: 'art_24' },
    { ag_id: agPlan.id, ordre: 2, titre: 'Budget prévisionnel 2027', type_vote: 'art_24' },
    { ag_id: agPlan.id, ordre: 3, titre: 'Installation de bornes de recharge véhicules électriques', type_vote: 'art_25' },
  ])
  log('AG Ordinaire 2026 — planifiée (3 résolutions à voter)')

  // 6. Sinistres
  section('Sinistres')
  const [sinClos] = await ins<{ id: string }>('sinistres', {
    copropriete_id: coproprieteId, cabinet_id: cabinetId, gestionnaire_id: syndicId,
    reference: `SIN-2025-${cIdx + 1}01`, titre: 'Dégât des eaux — colonne montante',
    description: "Infiltration depuis la colonne montante, dégâts dans la cave C02 et le hall.",
    status: 'cloture', lots_concernes: [byLot('C02').lotId],
    date_sinistre: ymd(monthsAgo(8)), date_declaration: ymd(monthsAgo(8)), date_cloture: ymd(monthsAgo(6)),
    compagnie_assurance: cfg.assureur, numero_declaration_assurance: `${slug(cfg.assureur).toUpperCase().slice(0, 3)}-DEG-${5000 + cIdx}`,
    montant_franchise: 300, montant_indemnisation: 2800, montant_travaux_estime: 3100, montant_travaux_reel: 2950,
  }, true)
  await ins('sinistre_etapes', [
    { sinistre_id: sinClos.id, status: 'signale', titre: 'Sinistre signalé', description: 'Déclaration reçue', date_etape: iso(monthsAgo(8)), created_par: syndicId },
    { sinistre_id: sinClos.id, status: 'assurance_declaree', titre: 'Déclaration assurance', description: `Dossier transmis à ${cfg.assureur}`, date_etape: iso(monthsAgo(8)), created_par: syndicId },
    { sinistre_id: sinClos.id, status: 'expertise', titre: 'Expertise réalisée', description: 'Estimation 3 100 €', date_etape: iso(monthsAgo(7)), created_par: syndicId },
    { sinistre_id: sinClos.id, status: 'cloture', titre: 'Dossier clôturé', description: 'Travaux terminés, indemnisation reçue', date_etape: iso(monthsAgo(6)), created_par: syndicId },
  ])
  await ins('sinistre_devis', {
    sinistre_id: sinClos.id, prestataire: 'Plomberie Dupont & Fils', montant: 2950,
    description: 'Remplacement canalisation + remise en état', statut: 'accepte',
  })
  await ins('sinistre_intervenants', {
    sinistre_id: sinClos.id, nom: 'Marc Fontaine', role: 'Expert assurance',
    telephone: '06 78 90 12 34', email: 'expert@cabinet-fontaine.fr', entreprise: 'Cabinet Fontaine Expertise',
  })

  const [sinCours] = await ins<{ id: string }>('sinistres', {
    copropriete_id: coproprieteId, cabinet_id: cabinetId, gestionnaire_id: syndicId,
    reference: `SIN-2026-${cIdx + 1}01`, titre: 'Panne ascenseur',
    description: "Ascenseur bloqué entre deux étages. Technicien mandaté.",
    status: 'travaux', date_sinistre: ymd(monthsAgo(1)), date_declaration: ymd(monthsAgo(1)),
    montant_travaux_estime: 1800,
  }, true)
  await ins('sinistre_etapes', [
    { sinistre_id: sinCours.id, status: 'signale', titre: 'Panne signalée', description: 'Signalée par un résident', date_etape: iso(monthsAgo(1)), created_par: syndicId },
    { sinistre_id: sinCours.id, status: 'travaux', titre: 'Technicien mandaté', description: 'Intervention sous 48h', date_etape: iso(daysAgo(20)), created_par: syndicId },
  ])
  await ins('sinistre_devis', {
    sinistre_id: sinCours.id, prestataire: 'Ascenseurs Sud Maintenance', montant: 1800,
    description: 'Remplacement variateur + réglage', statut: 'en_attente',
  })

  // Un sinistre URGENT seulement sur la 1re copro pour varier
  if (cIdx === 0) {
    const [sinUrg] = await ins<{ id: string }>('sinistres', {
      copropriete_id: coproprieteId, cabinet_id: cabinetId, gestionnaire_id: syndicId,
      reference: `SIN-2026-${cIdx + 1}02`, titre: '⚠ Fissures façade principale — URGENT',
      description: "Fissures importantes côté rue. Périmètre de sécurité posé, expertise urgente.",
      status: 'urgence', lots_concernes: [byLot('A05').lotId, byLot('A10').lotId],
      date_sinistre: ymd(daysAgo(12)), date_declaration: ymd(daysAgo(12)),
      compagnie_assurance: cfg.assureur, montant_travaux_estime: 45000,
    }, true)
    await ins('sinistre_etapes', [
      { sinistre_id: sinUrg.id, status: 'signale', titre: 'Fissures constatées', description: 'Inspection trimestrielle', date_etape: iso(daysAgo(12)), created_par: syndicId },
      { sinistre_id: sinUrg.id, status: 'urgence', titre: 'Classé URGENT', description: 'Périmètre de sécurité', date_etape: iso(daysAgo(11)), created_par: syndicId },
    ])
    log('SIN urgent (fissures façade) ajouté')
  }
  log('Sinistres créés (clôturé + en cours)')

  // 7. Appels de charges (4 trimestres) + impayés + relances
  section('Appels de charges (4 trimestres × 20 lots)')
  const trimestres = [
    { libelle: 'Appel de charges T3 2025', dAppel: monthsAgo(9), dEch: monthsAgo(8), paye: true },
    { libelle: 'Appel de charges T4 2025', dAppel: monthsAgo(6), dEch: monthsAgo(5), paye: true },
    { libelle: 'Appel de charges T1 2026', dAppel: monthsAgo(3), dEch: monthsAgo(2), paye: false },
    { libelle: 'Appel de charges T2 2026', dAppel: monthsAgo(0), dEch: daysFromNow(20), paye: false },
  ]
  // 3 lots en impayé (varient par copro)
  const impayeLots = new Set(['A03', 'A07', 'B02'])
  let appelCount = 0
  for (const o of owners) {
    const montant = eur((o.tantiemes / 9890) * cfg.budget / 4)
    for (const trim of trimestres) {
      const estImpaye = impayeLots.has(o.lot) && !trim.paye
      const echDepassee = trim.dEch.getTime() < NOW.getTime()
      const paye = trim.paye || (!estImpaye && echDepassee)
      const montantPaye = paye ? montant : 0
      // NB : `paye` est une colonne générée (montant_paye >= montant) — ne pas l'insérer
      const [appel] = await ins<{ id: string }>('appels_charges', {
        copropriete_id: coproprieteId, lot_id: o.lotId, coproprietaire_id: o.coproId,
        libelle: trim.libelle, montant, date_appel: ymd(trim.dAppel), date_echeance: ymd(trim.dEch),
        montant_paye: montantPaye, date_paiement: paye ? ymd(trim.dEch) : null,
        nb_relances: estImpaye && trim.libelle.includes('T1') ? 1 : 0,
      }, true)
      // Relance pour les impayés T1 dont l'échéance est dépassée
      if (estImpaye && trim.libelle.includes('T1')) {
        await ins('relances', {
          cabinet_id: cabinetId, copropriete_id: coproprieteId, appel_charge_id: appel.id,
          coproprietaire_id: o.coproId, type: 'email', statut: 'envoye',
          sujet: 'Rappel : charges impayées', contenu: `Bonjour ${o.prenom} ${o.nom}, votre appel ${trim.libelle} d'un montant de ${montant}€ reste impayé.`,
          envoye_at: iso(daysAgo(15)), envoye_par: syndicId,
        })
      }
      appelCount++
    }
  }
  // Soldes impayés sur les lots
  for (const ln of impayeLots) {
    const o = byLot(ln)
    const montant = eur((o.tantiemes / 9890) * cfg.budget / 4)
    await db.from('lots').update({ montant_impaye: montant }).eq('id', o.lotId)
  }
  await db.from('coproprietes').update({ statut: 'attention' }).eq('id', coproprieteId)
  log(`${appelCount} appels créés — 3 lots en impayé + relances`)

  // 8. Votes portail (consultations)
  section('Votes & consultations portail')
  async function createVote(titre: string, description: string, statut: string, dDebut: Date, dFin: Date, options: string[], participation: number) {
    const [v] = await ins<{ id: string }>('votes', {
      copropriete_id: coproprieteId, cabinet_id: cabinetId, created_by: syndicId,
      titre, description, statut, date_debut: iso(dDebut), date_fin: iso(dFin),
    }, true)
    const opts = await ins<{ id: string }>('vote_options', options.map((label, ordre) => ({ vote_id: v.id, label, ordre })), true)
    const reponses: object[] = []
    for (const o of owners) {
      if (Math.random() > participation) continue
      // NB : vote_reponses.coproprietaire_id référence profiles(id), pas coproprietaires(id)
      reponses.push({ vote_id: v.id, option_id: pick(opts, Math.floor(Math.random() * opts.length)).id, coproprietaire_id: o.profileId })
    }
    if (reponses.length) await ins('vote_reponses', reponses)
    return reponses.length
  }
  const nOuvert = await createVote(
    'Installation de caméras de surveillance', "Le syndic propose l'installation de caméras à l'entrée (coût estimé 1 200 €).",
    'ouvert', daysAgo(10), daysFromNow(20), ['Pour', 'Contre', 'Abstention'], 0.45)
  const nClos = await createVote(
    'Choix du prestataire espaces verts', '3 devis reçus pour le contrat annuel d\'entretien.',
    'clos', monthsAgo(4), monthsAgo(3), ['Vert Provence — 1 200 €', 'Jardins du Sud — 980 €', 'NaturPaysage — 1 100 €'], 0.85)
  log(`Vote ouvert (${nOuvert} votants) + vote clos (${nClos} votants)`)

  // 9. Messagerie
  section('Messagerie syndic ↔ copropriétaires')
  const convs = [
    { o: byLot('A03'), sujet: 'Question sur mon appel de charges T1', msgs: [
      { from: 'copro', t: "Bonjour, je n'ai pas compris le montant de mon dernier appel de charges. Pouvez-vous me détailler ?", at: daysAgo(18) },
      { from: 'syndic', t: 'Bonjour, je vous transmets le détail par poste. Le montant correspond à votre quote-part de tantièmes.', at: daysAgo(17) },
    ] },
    { o: byLot('A06'), sujet: 'Suivi panne ascenseur', msgs: [
      { from: 'copro', t: "Bonjour, l'ascenseur est toujours en panne, savez-vous quand il sera réparé ?", at: daysAgo(19) },
      { from: 'syndic', t: 'Le technicien intervient sous 48h, pièce commandée. Merci de votre patience.', at: daysAgo(19) },
      { from: 'copro', t: 'Merci pour le suivi !', at: daysAgo(18) },
    ] },
    { o: byLot('B01'), sujet: 'Demande règlement de copropriété', msgs: [
      { from: 'copro', t: 'Bonjour, où puis-je trouver le règlement de copropriété ?', at: daysAgo(30) },
      { from: 'syndic', t: 'Il est disponible dans l\'espace Documents de votre portail. Bonne journée.', at: daysAgo(29) },
    ] },
  ]
  for (const c of convs) {
    const lastAt = c.msgs[c.msgs.length - 1].at
    const [conv] = await ins<{ id: string }>('conversations', {
      cabinet_id: cabinetId, copropriete_id: coproprieteId, coproprietaire_id: c.o.coproId,
      gestionnaire_id: syndicId, sujet: c.sujet, derniere_activite: iso(lastAt),
    }, true)
    for (const m of c.msgs) {
      await ins('messages', {
        conversation_id: conv.id, expediteur_id: m.from === 'syndic' ? syndicId : c.o.profileId,
        contenu: m.t, lu: true, created_at: iso(m.at),
      })
    }
  }
  log(`${convs.length} conversations créées`)

  // 10. Agenda
  section('Agenda')
  await ins('evenements', [
    { cabinet_id: cabinetId, gestionnaire_id: syndicId, copropriete_id: coproprieteId, titre: 'AG Ordinaire 2026', description: 'Assemblée générale annuelle', date_debut: iso(monthsFromNow(1)), date_fin: iso(new Date(monthsFromNow(1).getTime() + 2 * 36e5)), lieu: `Salle de quartier — ${cfg.ville}`, type: 'ag' },
    { cabinet_id: cabinetId, gestionnaire_id: syndicId, copropriete_id: coproprieteId, titre: 'Visite maintenance ascenseur', description: 'Visite semestrielle réglementaire', date_debut: iso(daysFromNow(25)), date_fin: iso(new Date(daysFromNow(25).getTime() + 2 * 36e5)), lieu: cfg.nom, type: 'travaux' },
  ])
  log('Événements agenda créés')

  // 11. Carnet d'entretien
  section("Carnet d'entretien")
  const presta = (m: string) => prestataires.find(p => p.metier === m)?.id ?? null
  await ins('entretiens', [
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('ascenseur'), titre: 'Maintenance annuelle ascenseur', description: 'Contrôle complet + lubrification', type: 'maintenance', date_intervention: iso(monthsAgo(9)), cout: 850, statut: 'realise' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('plomberie'), titre: 'Remplacement vanne colonne montante', description: "Vanne d'arrêt principale", type: 'reparation', date_intervention: iso(monthsAgo(6)), cout: 420, statut: 'realise' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('electricite'), titre: 'Mise en conformité tableau électrique', description: 'Disjoncteurs différentiels', type: 'renovation', date_intervention: iso(monthsAgo(4)), cout: 1250, statut: 'realise' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('jardinage'), titre: 'Entretien espaces verts printemps', description: 'Taille, tonte, plantations', type: 'maintenance', date_intervention: iso(monthsAgo(2)), cout: 380, statut: 'realise' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('ascenseur'), titre: 'Visite semestrielle ascenseur', description: 'Contrôle réglementaire', type: 'maintenance', date_intervention: iso(daysFromNow(25)), cout: null, statut: 'planifie' },
  ])
  log("5 entrées carnet d'entretien")

  // 12. Documents
  section('Documents')
  const docs = [
    { nom: `Règlement de copropriété — ${cfg.nom}`, categorie: 'reglement', vis: true, m: 11 },
    { nom: 'PV Assemblée Générale Ordinaire 2025', categorie: 'pv_ag', vis: true, m: 7 },
    { nom: 'Budget prévisionnel 2025', categorie: 'budget', vis: true, m: 7 },
    { nom: 'PV AG Extraordinaire — Toiture', categorie: 'pv_ag', vis: true, m: 3 },
    { nom: 'Contrat maintenance ascenseur', categorie: 'contrat', vis: false, m: 9 },
    { nom: 'Diagnostic Technique Global (DTG)', categorie: 'autre', vis: true, m: 10 },
    { nom: "Récapitulatif appels de charges T1 2026", categorie: 'appel_fonds', vis: true, m: 2 },
  ]
  await ins('documents', docs.map(d => ({
    cabinet_id: cabinetId, copropriete_id: coproprieteId, nom: d.nom,
    description: d.nom, categorie: d.categorie, taille_bytes: 200000 + Math.floor(Math.random() * 800000),
    type_mime: 'application/pdf',
    storage_path: `documents/${cabinetId}/${coproprieteId}/${slug(d.nom)}.pdf`, storage_bucket: 'documents',
    visible_coproprietaires: d.vis, upload_par: syndicId, created_at: iso(monthsAgo(d.m)),
  })))
  log(`${docs.length} documents créés`)

  // 13. Budgets prévisionnels + lignes
  section('Budgets prévisionnels')
  for (const annee of [2025, 2026]) {
    const statut = annee === 2025 ? 'approuve' : 'valide'
    const [budget] = await ins<{ id: string }>('budgets', { copropriete_id: coproprieteId, annee, statut, created_by: syndicId }, true)
    const base = cfg.budget
    const postes = [
      { poste: 'Assurance immeuble', categorie: 'assurances', part: 0.06 },
      { poste: 'Entretien ascenseur', categorie: 'entretien', part: 0.05 },
      { poste: 'Nettoyage parties communes', categorie: 'charges_generales', part: 0.09 },
      { poste: 'Entretien espaces verts', categorie: 'entretien', part: 0.05 },
      { poste: 'Électricité parties communes', categorie: 'charges_generales', part: 0.08 },
      { poste: 'Eau froide', categorie: 'charges_generales', part: 0.04 },
      { poste: 'Honoraires syndic', categorie: 'honoraires', part: 0.12 },
      { poste: 'Travaux courants', categorie: 'travaux', part: 0.06 },
      { poste: 'Divers et imprévus', categorie: 'autre', part: 0.03 },
    ]
    await ins('budget_lignes', postes.map((p, ordre) => ({
      budget_id: budget.id, poste: p.poste, categorie: p.categorie,
      montant_previsionnel: eur(base * p.part),
      ...(annee === 2025 ? { montant_reel: eur(base * p.part * (0.85 + Math.random() * 0.25)) } : {}),
      ordre: ordre + 1,
    })))
  }
  log('Budgets 2025 (approuvé) + 2026 (validé) avec lignes')

  // 14. Fonds travaux + mouvements
  section('Fonds travaux')
  const [fonds] = await ins<{ id: string }>('fonds_travaux', {
    copropriete_id: coproprieteId, annee: 2026, cotisation_annuelle: eur(cfg.budget * 0.08),
    solde_actuel: eur(cfg.budget * 0.18), objectif_5ans: eur(cfg.budget * 0.6),
    notes: 'Fonds travaux loi ALUR. Objectif ravalement + toiture.',
  }, true)
  await ins('fonds_travaux_mouvements', [
    { fonds_travaux_id: fonds.id, type_mouvement: 'cotisation', montant: eur(cfg.budget * 0.02), libelle: 'Cotisations T1 2025', date_mouvement: ymd(monthsAgo(9)) },
    { fonds_travaux_id: fonds.id, type_mouvement: 'cotisation', montant: eur(cfg.budget * 0.02), libelle: 'Cotisations T2 2025', date_mouvement: ymd(monthsAgo(6)) },
    { fonds_travaux_id: fonds.id, type_mouvement: 'retrait', montant: -eur(cfg.budget * 0.04), libelle: 'Réfection étanchéité toiture', date_mouvement: ymd(monthsAgo(3)) },
    { fonds_travaux_id: fonds.id, type_mouvement: 'cotisation', montant: eur(cfg.budget * 0.02), libelle: 'Cotisations T1 2026', date_mouvement: ymd(monthsAgo(2)) },
  ])
  log('Fonds travaux + 4 mouvements')

  // 15. Travaux + étapes
  section('Suivi des travaux')
  const travaux = await ins<{ id: string }>('travaux', [
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('peinture'), titre: 'Ravalement façade côté rue', description: 'Nettoyage, traitement fissures, peinture siloxane.', priorite: 'haute', statut: 'devis', montant_estime: 18500, created_by: syndicId, created_at: iso(monthsAgo(2)) },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: presta('electricite'), titre: 'Éclairage LED parties communes', description: 'Remplacement luminaires + détecteurs.', priorite: 'normale', statut: 'planifie', montant_estime: 3200, created_by: syndicId, created_at: iso(monthsAgo(1)) },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, prestataire_id: null, titre: 'Réfection toiture-terrasse', description: 'Étanchéité à reprendre, infiltrations 4e étage.', priorite: 'urgente', statut: 'demande', montant_estime: 12000, created_by: syndicId, created_at: iso(daysAgo(10)) },
  ], true)
  await ins('travaux_etapes', [
    { travail_id: travaux[0].id, type: 'creation', description: 'Ouverture dossier suite AGE toiture.', created_by: syndicId, created_at: iso(monthsAgo(2)) },
    { travail_id: travaux[0].id, type: 'devis', description: 'Demande de devis à 3 entreprises.', montant: 18500, created_by: syndicId, created_at: iso(monthsAgo(1)) },
  ])
  log(`${travaux.length} dossiers travaux + étapes`)

  // 16. Clés & accès
  section('Clés et accès')
  await ins('cles_acces', [
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'cle', description: 'Clé porte entrée principale', localisation: 'Entrée RDC', detenteur_nom: 'Cabinet Horizon Syndic', date_remise: iso(monthsAgo(11)), retourne: false, notes: 'Trousseau × 3' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'badge', description: 'Badge parking SS1', localisation: 'Parking sous-sol', detenteur_nom: byLot('P01').prenom + ' ' + byLot('P01').nom, date_remise: iso(monthsAgo(10)), retourne: false, notes: 'Badge magnétique' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'code', description: 'Digicode entrée', localisation: 'Interphone entrée', detenteur_nom: 'Tous copropriétaires', date_remise: iso(monthsAgo(11)), retourne: false, notes: 'Code changé en AG' },
  ])
  log('3 clés/accès')

  // 17. Obligations légales
  section('Obligations légales')
  await ins('obligations_legales', [
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'DPE', description: 'DPE collectif', date_realisation: iso(monthsAgo(18)), date_expiration: iso(monthsFromNow(96)), notes: 'Classe D' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'Vérification extincteurs', description: 'Vérification annuelle', date_realisation: iso(monthsAgo(3)), date_expiration: iso(monthsFromNow(9)), notes: '6 extincteurs' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'Contrôle ascenseur', description: 'Contrôle quinquennal', date_realisation: iso(monthsAgo(8)), date_expiration: iso(monthsFromNow(52)), notes: 'Conforme' },
    { copropriete_id: coproprieteId, cabinet_id: cabinetId, type: 'Assurance immeuble', description: `Multirisque ${cfg.assureur}`, date_realisation: iso(monthsAgo(5)), date_expiration: iso(monthsFromNow(7)), notes: 'Renouvellement tacite' },
  ])
  log('4 obligations légales')

  // 18. Archives
  section('Archives')
  await ins('archives', [
    { cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'pv_ag', nom: 'PV AG Ordinaire 2024', fichier_url: `archives/${cabinetId}/${coproprieteId}/pv-2024.pdf`, taille_octets: 234567, date_document: iso(monthsAgo(19)), retention_jusqu_au: iso(monthsFromNow(120)), created_by: syndicId },
    { cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'comptabilite', nom: 'Comptes de gestion 2024', fichier_url: `archives/${cabinetId}/${coproprieteId}/comptes-2024.pdf`, taille_octets: 456789, date_document: iso(monthsAgo(15)), retention_jusqu_au: iso(monthsFromNow(120)), created_by: syndicId },
    { cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'contrat', nom: 'Contrat syndic 2024-2026', fichier_url: `archives/${cabinetId}/${coproprieteId}/contrat-syndic.pdf`, taille_octets: 312000, date_document: iso(monthsAgo(24)), retention_jusqu_au: iso(monthsFromNow(60)), created_by: syndicId },
  ])
  log('3 archives légales')

  // 19. Relance paramètres
  await ins('relance_parametres', {
    copropriete_id: coproprieteId, actif: true,
    delai_premier_rappel: 30, delai_deuxieme_rappel: 60, delai_mise_en_demeure: 90,
    premier_rappel_email: true, deuxieme_rappel_email: true, deuxieme_rappel_sms: true,
    texte_premier_rappel: 'Bonjour,\n\nVotre appel de charges de {montant}€ (lot {lot}) est en retard de {jours} jours. Merci de régulariser.\n\nCabinet Horizon Syndic',
  }).catch(() => db.from('relance_parametres').upsert({ copropriete_id: coproprieteId, actif: true }, { onConflict: 'copropriete_id' }))

  // 20. Notifications pour le syndic (cloche dashboard)
  await ins('notifications', [
    { user_id: syndicId, cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'urgent', titre: `Sinistre en cours — ${cfg.nom}`, message: 'Panne ascenseur, technicien mandaté.', lien: '/sinistres', lu: false, created_at: iso(daysAgo(20)) },
    { user_id: syndicId, cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'alerte', titre: `Impayés détectés — ${cfg.nom}`, message: '3 lots en retard de paiement.', lien: '/impayes', lu: false, created_at: iso(daysAgo(15)) },
    { user_id: syndicId, cabinet_id: cabinetId, copropriete_id: coproprieteId, type: 'info', titre: `AG planifiée — ${cfg.nom}`, message: 'Assemblée générale ordinaire 2026 à préparer.', lien: '/assemblees', lu: cIdx > 0, created_at: iso(daysAgo(5)) },
  ])
  log('Notifications syndic créées')

  return owners
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  bigSection('COPLIO — Seed démonstration COMPLET (4 copros × 20 lots)')

  await loadExistingUsers()

  // Syndic auth
  section('Compte syndic')
  const syndicId = await getOrCreateUser(SYNDIC.email, SYNDIC.password, { prenom: SYNDIC.prenom, nom: SYNDIC.nom })
  log(`Syndic : ${SYNDIC.email}`)

  // Cabinet
  const { data: existingProfile } = await db.from('profiles').select('cabinet_id').eq('id', syndicId).maybeSingle()
  let cabinetId = existingProfile?.cabinet_id as string | undefined
  if (!cabinetId) {
    const [cab] = await ins<{ id: string }>('cabinets', {
      nom: 'Cabinet Horizon Syndic', ville: 'Lyon', adresse: '40 Rue de la République, 69002 Lyon',
      code_postal: '69002', telephone: '04 72 00 00 00', email_contact: SYNDIC.email,
      plan: 'pro', subscription_status: 'active', addon_portail_actif: true,
      max_lots: 500, max_gestionnaires: 5,
    }, true)
    cabinetId = cab.id
    log('Cabinet créé : Cabinet Horizon Syndic')
  } else {
    log('Cabinet existant réutilisé')
  }
  await db.from('profiles').upsert({
    id: syndicId, cabinet_id: cabinetId, role: 'owner',
    prenom: SYNDIC.prenom, nom: SYNDIC.nom, email: SYNDIC.email, onboarding_complete: true,
  }, { onConflict: 'id' })

  // Garde anti-doublon
  const { count } = await db.from('coproprietes').select('id', { count: 'exact', head: true }).eq('cabinet_id', cabinetId)
  if ((count ?? 0) > 0) {
    console.error(`\n⚠ Le cabinet possède déjà ${count} copropriété(s). Arrêt pour éviter les doublons.`)
    console.error('  Supprime les données existantes puis relance, ou demande un re-seed propre.')
    process.exit(1)
  }

  // Prestataires (niveau cabinet)
  section('Prestataires (cabinet)')
  const prestataires = await ins<{ id: string; metier: string }>('prestataires', [
    { cabinet_id: cabinetId, nom: 'Plomberie Dupont & Fils', metier: 'plomberie', actif: true, note: 5, email: 'contact@plomberie-dupont.fr', telephone: '04 72 23 45 67', siret: '12345678900011', adresse: '15 rue de la République, 69002 Lyon', commentaire: 'Urgences 24h/24.' },
    { cabinet_id: cabinetId, nom: 'Électricité Moreau SARL', metier: 'electricite', actif: true, note: 4, email: 'moreau-elec@gmail.com', telephone: '04 72 34 56 78', siret: '23456789000122', adresse: '8 avenue Berthelot, 69007 Lyon', commentaire: 'Certifié Qualifelec.' },
    { cabinet_id: cabinetId, nom: 'Ascenseurs Sud Maintenance', metier: 'ascenseur', actif: true, note: 4, email: 'contact@ascenseurs-sud.fr', telephone: '04 72 45 67 89', siret: '34567890000133', adresse: '22 cours Lafayette, 69003 Lyon', commentaire: 'Contrat semestriel.' },
    { cabinet_id: cabinetId, nom: 'Espaces Verts Rhône', metier: 'jardinage', actif: true, note: 5, email: 'evr@espacesverts-rhone.fr', telephone: '04 72 56 78 90', siret: '45678900001344', adresse: '5 chemin du Vallon, 69009 Lyon', commentaire: 'Passage bi-mensuel.' },
    { cabinet_id: cabinetId, nom: 'Peinture & Rénovation Lemaire', metier: 'peinture', actif: true, note: 4, email: 'lemaire.reno@outlook.fr', telephone: '06 12 34 56 78', siret: '56789000013455', adresse: '3 rue des Artisans, 69008 Lyon', commentaire: 'Spécialiste parties communes.' },
    { cabinet_id: cabinetId, nom: 'Net Propreté Services', metier: 'nettoyage', actif: true, note: 5, email: 'contact@netproprete.fr', telephone: '04 72 67 89 01', siret: '67890000134566', adresse: '12 rue Garibaldi, 69006 Lyon', commentaire: 'Nettoyage hebdomadaire.' },
  ], true)
  log(`${prestataires.length} prestataires créés`)

  // 4 copropriétés
  const allOwners: Owner[] = []
  for (let i = 0; i < COPROS.length; i++) {
    const owners = await seedCopro(COPROS[i], i, cabinetId, syndicId, prestataires)
    allOwners.push(...owners)
  }

  // ─── Résumé ────────────────────────────────────────────────────────
  bigSection('✅ SEED TERMINÉ')
  console.log('\n  SYNDIC (dashboard /login)')
  console.log(`    Email    : ${SYNDIC.email}`)
  console.log(`    Password : ${SYNDIC.password}`)
  console.log('\n  COPROPRIÉTAIRES (portail /portail) — 80 comptes')
  console.log('    Email   : <prenom>.<nom>.c<copro><lot>@horizon-demo.fr')
  console.log('    Exemple :')
  for (const o of allOwners.slice(0, 4)) {
    console.log(`      ${o.email}  →  ${o.password}`)
  }
  console.log(`    (4 copros × 20 lots = 80 copropriétaires, portail actif)`)
  console.log('')
}

main().catch(err => {
  console.error('\n❌ ERREUR:', err.message)
  process.exit(1)
})
