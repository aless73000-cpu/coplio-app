/**
 * COPLIO — Script de seed démonstration
 * Crée : 1 syndic, 1 cabinet, 1 copropriété, 15 lots, 15 copropriétaires
 * + 6 mois d'historique (AG, sinistres, appels de charges, votes, messages)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qathchrashvfnugfdadc.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdGhjaHJhc2h2Zm51Z2ZkYWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg2NDQ0NSwiZXhwIjoyMDkyNDQwNDQ1fQ.FNISs-5OQYJEtje5giVwOWX2fJqxFFjhgjYCBoYpFDU'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function log(msg: string) { console.log(`  ✓ ${msg}`) }
function section(msg: string) { console.log(`\n▶ ${msg}`) }

// ─── Données ─────────────────────────────────────────────────────

const SYNDIC = {
  email: 'syndic@demo-coplio.fr',
  password: 'Demo@Coplio2024',
  prenom: 'Thomas',
  nom: 'Martin',
}

const LOTS_DATA = [
  { numero: 'A01', type: 'appartement', etage: 'RDC', surface: 35, tantiemes: 450 },
  { numero: 'A02', type: 'appartement', etage: 'RDC', surface: 42, tantiemes: 520 },
  { numero: 'A03', type: 'appartement', etage: '1er', surface: 55, tantiemes: 680 },
  { numero: 'A04', type: 'appartement', etage: '1er', surface: 58, tantiemes: 720 },
  { numero: 'A05', type: 'appartement', etage: '2e',  surface: 62, tantiemes: 770 },
  { numero: 'A06', type: 'appartement', etage: '2e',  surface: 65, tantiemes: 810 },
  { numero: 'A07', type: 'appartement', etage: '3e',  surface: 70, tantiemes: 870 },
  { numero: 'A08', type: 'appartement', etage: '3e',  surface: 48, tantiemes: 600 },
  { numero: 'A09', type: 'appartement', etage: '4e',  surface: 80, tantiemes: 990 },
  { numero: 'A10', type: 'appartement', etage: '4e',  surface: 75, tantiemes: 930 },
  { numero: 'C01', type: 'cave',        etage: 'SS1', surface: 8,  tantiemes: 40  },
  { numero: 'C02', type: 'cave',        etage: 'SS1', surface: 7,  tantiemes: 35  },
  { numero: 'C03', type: 'cave',        etage: 'SS1', surface: 9,  tantiemes: 45  },
  { numero: 'P01', type: 'parking',     etage: 'SS1', surface: 12, tantiemes: 60  },
  { numero: 'P02', type: 'parking',     etage: 'SS1', surface: 12, tantiemes: 60  },
]

const COPROS_DATA = [
  { prenom: 'Jean-Pierre', nom: 'Moreau',   email: 'jp.moreau@demo-coplio.fr',    lot: 'A01', password: 'Portail#01!' },
  { prenom: 'Marie',       nom: 'Lefèvre',  email: 'marie.lefevre@demo-coplio.fr', lot: 'A02', password: 'Portail#02!' },
  { prenom: 'Thomas',      nom: 'Petit',    email: 't.petit@demo-coplio.fr',       lot: 'A03', password: 'Portail#03!' },
  { prenom: 'Sophie',      nom: 'Bernard',  email: 's.bernard@demo-coplio.fr',     lot: 'A04', password: 'Portail#04!' },
  { prenom: 'Laurent',     nom: 'Dubois',   email: 'l.dubois@demo-coplio.fr',      lot: 'A05', password: 'Portail#05!' },
  { prenom: 'Isabelle',    nom: 'Roux',     email: 'i.roux@demo-coplio.fr',        lot: 'A06', password: 'Portail#06!' },
  { prenom: 'Philippe',    nom: 'Martin',   email: 'ph.martin@demo-coplio.fr',     lot: 'A07', password: 'Portail#07!' },
  { prenom: 'Nathalie',    nom: 'Simon',    email: 'n.simon@demo-coplio.fr',       lot: 'A08', password: 'Portail#08!' },
  { prenom: 'François',    nom: 'Girard',   email: 'f.girard@demo-coplio.fr',      lot: 'A09', password: 'Portail#09!' },
  { prenom: 'Catherine',   nom: 'Laurent',  email: 'c.laurent@demo-coplio.fr',     lot: 'A10', password: 'Portail#10!' },
  { prenom: 'Michel',      nom: 'Fontaine', email: 'm.fontaine@demo-coplio.fr',    lot: 'C01', password: 'Portail#11!' },
  { prenom: 'Anne-Marie',  nom: 'Legrand',  email: 'am.legrand@demo-coplio.fr',    lot: 'C02', password: 'Portail#12!' },
  { prenom: 'Jacques',     nom: 'Mercier',  email: 'j.mercier@demo-coplio.fr',     lot: 'C03', password: 'Portail#13!' },
  { prenom: 'Sylvie',      nom: 'Blanc',    email: 's.blanc@demo-coplio.fr',       lot: 'P01', password: 'Portail#14!' },
  { prenom: 'Pierre',      nom: 'Garnier',  email: 'p.garnier@demo-coplio.fr',     lot: 'P02', password: 'Portail#15!' },
]

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 COPLIO — Seed démonstration\n')

  // ── 1. Syndic ──────────────────────────────────────────────────
  section('Création du compte syndic')
  let syndicId: string
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const existingSyndic = existingUsers?.users?.find(u => u.email === SYNDIC.email)
  if (existingSyndic) {
    syndicId = existingSyndic.id
    log(`Auth existant réutilisé: ${SYNDIC.email}`)
  } else {
    const { data: syndicAuth, error: syndicErr } = await db.auth.admin.createUser({
      email: SYNDIC.email,
      password: SYNDIC.password,
      email_confirm: true,
      user_metadata: { prenom: SYNDIC.prenom, nom: SYNDIC.nom },
    })
    if (syndicErr) throw new Error(`Syndic auth: ${syndicErr.message}`)
    syndicId = syndicAuth.user.id
    log(`Auth créé: ${SYNDIC.email}`)
  }

  // ── 2. Cabinet ────────────────────────────────────────────────
  section('Création du cabinet')
  let cabinetId: string
  const { data: existingProfile } = await db.from('profiles').select('cabinet_id').eq('id', syndicId).single()
  if (existingProfile?.cabinet_id) {
    cabinetId = existingProfile.cabinet_id
    log(`Cabinet existant réutilisé`)
  } else {
    const { data: cabinet, error: cabErr } = await db.from('cabinets').insert({
      nom: 'Cabinet Martin Syndic',
      ville: 'Marseille',
      adresse: '12 Rue de la République, 13001 Marseille',
      code_postal: '13001',
      telephone: '04 91 00 00 00',
      email_contact: SYNDIC.email,
      plan: 'pro',
      subscription_status: 'active',
      addon_portail_actif: true,
      max_lots: 500,
      max_gestionnaires: 5,
    }).select().single()
    if (cabErr) throw new Error(`Cabinet: ${cabErr.message}`)
    cabinetId = cabinet.id
    log(`Cabinet créé: ${cabinet.nom}`)
  }

  // ── 3. Profil syndic (upsert car trigger auto peut déjà l'avoir créé)
  const { error: profErr } = await db.from('profiles').upsert({
    id: syndicId,
    cabinet_id: cabinetId,
    role: 'owner',
    prenom: SYNDIC.prenom,
    nom: SYNDIC.nom,
    email: SYNDIC.email,
    onboarding_complete: true,
  }, { onConflict: 'id' })
  if (profErr) throw new Error(`Profil syndic: ${profErr.message}`)
  log('Profil syndic configuré')

  // ── 4. Copropriété ────────────────────────────────────────────
  section('Création de la copropriété')
  const { data: copropriete, error: coprErr } = await db.from('coproprietes').insert({
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    nom: 'Résidence Les Oliviers',
    adresse: '15 Allée des Palmiers',
    code_postal: '13008',
    ville: 'Marseille',
    annee_construction: 1985,
    nb_etages: 4,
    assureur: 'AXA Immobilier',
    numero_contrat_assurance: 'AXA-2024-78542',
    expiration_assurance: '2026-12-31',
    iban: 'FR76 3000 4000 0100 0000 0000 123',
    banque: 'BNP Paribas',
    statut: 'attention',
  }).select().single()
  if (coprErr) throw new Error(`Copropriété: ${coprErr.message}`)
  const coproprieteId = copropriete.id
  log(`Copropriété créée: ${copropriete.nom}`)

  // ── 5. Lots ───────────────────────────────────────────────────
  section('Création des 15 lots')
  const { data: lots, error: lotsErr } = await db.from('lots').insert(
    LOTS_DATA.map(l => ({
      copropriete_id: coproprieteId,
      numero: l.numero,
      type: l.type,
      etage: l.etage,
      surface: l.surface,
      tantiemes: l.tantiemes,
      solde_compte: 0,
    }))
  ).select()
  if (lotsErr) throw new Error(`Lots: ${lotsErr.message}`)
  const lotMap = new Map(lots!.map(l => [l.numero, l.id]))
  log(`15 lots créés (A01-A10, C01-C03, P01-P02)`)

  // ── 6. Copropriétaires ────────────────────────────────────────
  section('Création des 15 copropriétaires + portails')
  const coproMap = new Map<string, string>() // email → coproprietaire_id
  const coproProfileMap = new Map<string, string>() // email → profile_id

  for (const c of COPROS_DATA) {
    const lotId = lotMap.get(c.lot)!

    // Auth user
    const { data: authUser, error: authErr } = await db.auth.admin.createUser({
      email: c.email,
      password: c.password,
      email_confirm: true,
      user_metadata: { prenom: c.prenom, nom: c.nom, role: 'owner_resident' },
    })
    if (authErr) throw new Error(`Auth copro ${c.email}: ${authErr.message}`)
    const authId = authUser.user.id

    // Profile (upsert car trigger auto peut l'avoir créé)
    await db.from('profiles').upsert({
      id: authId,
      cabinet_id: cabinetId,
      role: 'owner_resident',
      prenom: c.prenom,
      nom: c.nom,
      email: c.email,
      lot_id: lotId,
      onboarding_complete: true,
    }, { onConflict: 'id' })

    // Coproprietaire
    const { data: copro, error: coproErr } = await db.from('coproprietaires').insert({
      cabinet_id: cabinetId,
      profile_id: authId,
      prenom: c.prenom,
      nom: c.nom,
      email: c.email,
      portail_actif: true,
      invitation_envoyee_at: new Date('2025-11-01').toISOString(),
    }).select().single()
    if (coproErr) throw new Error(`Copro ${c.email}: ${coproErr.message}`)

    // Liaison lot
    await db.from('coproprietaire_lots').insert({
      coproprietaire_id: copro.id,
      lot_id: lotId,
      date_acquisition: '2020-01-01',
    })

    coproMap.set(c.email, copro.id)
    coproProfileMap.set(c.email, authId)
    log(`${c.prenom} ${c.nom} — lot ${c.lot} — portail actif`)
  }

  // ── 7. Assemblées Générales ────────────────────────────────────
  section('Assemblées Générales (historique 6 mois)')

  // AG 1 — AG Ordinaire 2025 (terminée, 18 nov 2025)
  const { data: ag1, error: ag1Err } = await db.from('assemblees_generales').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    titre: 'Assemblée Générale Ordinaire 2025',
    type: 'ordinaire',
    status: 'terminee',
    date_ag: '2025-11-18T18:00:00+01:00',
    lieu: 'Salle communale — 3 Rue du Port, 13008 Marseille',
    tantiemes_presents: 6240,
    tantiemes_requis: 4000,
    convocations_envoyees_at: '2025-10-18T09:00:00+01:00',
  }).select().single()
  if (ag1Err) throw new Error(`AG1: ${ag1Err.message}`)

  await db.from('ag_resolutions').insert([
    { ag_id: ag1.id, ordre: 1, titre: 'Approbation des comptes de l\'exercice 2025', type_vote: 'art_24', voix_pour: 9, voix_contre: 1, voix_abstention: 1, tantiemes_pour: 5200, tantiemes_contre: 450, adoptee: true },
    { ag_id: ag1.id, ordre: 2, titre: 'Vote du budget prévisionnel 2026 — 84 000 €', type_vote: 'art_24', voix_pour: 10, voix_contre: 0, voix_abstention: 1, tantiemes_pour: 5650, tantiemes_contre: 0, adoptee: true },
    { ag_id: ag1.id, ordre: 3, titre: 'Ravalement de la façade principale', type_vote: 'art_25', voix_pour: 5, voix_contre: 5, voix_abstention: 1, tantiemes_pour: 3800, tantiemes_contre: 3890, adoptee: false },
  ])
  log('AG Ordinaire 2025 (18/11/2025) — terminée — 3 résolutions')

  // AG 2 — AG Extraordinaire (terminée, 15 mars 2026)
  const { data: ag2, error: ag2Err } = await db.from('assemblees_generales').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    titre: 'Assemblée Générale Extraordinaire — Remplacement chaudière',
    type: 'extraordinaire',
    status: 'terminee',
    date_ag: '2026-03-15T14:00:00+01:00',
    lieu: 'Résidence Les Oliviers — Hall d\'entrée',
    tantiemes_presents: 7100,
    tantiemes_requis: 5001,
    convocations_envoyees_at: '2026-02-13T09:00:00+01:00',
  }).select().single()
  if (ag2Err) throw new Error(`AG2: ${ag2Err.message}`)

  await db.from('ag_resolutions').insert([
    { ag_id: ag2.id, ordre: 1, titre: 'Remplacement de la chaudière collective — 18 500 €', type_vote: 'art_25', voix_pour: 12, voix_contre: 1, voix_abstention: 0, tantiemes_pour: 6500, tantiemes_contre: 600, adoptee: true },
    { ag_id: ag2.id, ordre: 2, titre: 'Choix du prestataire : Thermique Pro Marseille', type_vote: 'art_24', voix_pour: 11, voix_contre: 2, voix_abstention: 0, tantiemes_pour: 6100, tantiemes_contre: 1000, adoptee: true },
  ])
  log('AG Extraordinaire (15/03/2026) — terminée — 2 résolutions')

  // AG 3 — AG Ordinaire 2026 (planifiée, 15 juin 2026)
  const { data: ag3, error: ag3Err } = await db.from('assemblees_generales').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    titre: 'Assemblée Générale Ordinaire 2026',
    type: 'ordinaire',
    status: 'planifiee',
    date_ag: '2026-06-15T18:00:00+02:00',
    lieu: 'Salle communale — 3 Rue du Port, 13008 Marseille',
  }).select().single()
  if (ag3Err) throw new Error(`AG3: ${ag3Err.message}`)

  await db.from('ag_resolutions').insert([
    { ag_id: ag3.id, ordre: 1, titre: 'Approbation des comptes de l\'exercice 2026', type_vote: 'art_24' },
    { ag_id: ag3.id, ordre: 2, titre: 'Budget prévisionnel 2027', type_vote: 'art_24' },
    { ag_id: ag3.id, ordre: 3, titre: 'Ravalement façade — nouveau vote', type_vote: 'art_25' },
    { ag_id: ag3.id, ordre: 4, titre: 'Installation digicode sécurisé entrée', type_vote: 'art_24' },
  ])
  log('AG Ordinaire 2026 (15/06/2026) — planifiée — 4 résolutions')

  // ── 8. Sinistres ───────────────────────────────────────────────
  section('Sinistres (3 dossiers)')

  const lotC02 = lotMap.get('C02')!
  const lotA05 = lotMap.get('A05')!
  const lotA09 = lotMap.get('A09')!

  const { data: sin1 } = await db.from('sinistres').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    reference: 'SIN-2025-001',
    titre: 'Dégât des eaux — Cave C02',
    description: 'Infiltration d\'eau depuis la canalisation principale. Dégâts sur les murs et plafond de la cave C02.',
    status: 'cloture',
    lots_concernes: [lotC02],
    date_sinistre: '2025-11-05',
    date_declaration: '2025-11-06',
    date_cloture: '2026-01-20',
    compagnie_assurance: 'AXA Immobilier',
    numero_declaration_assurance: 'AXA-2025-DEG-44521',
    montant_franchise: 300,
    montant_indemnisation: 2800,
    montant_travaux_estime: 3100,
    montant_travaux_reel: 2950,
  }).select().single()

  if (sin1) {
    await db.from('sinistre_etapes').insert([
      { sinistre_id: sin1.id, status: 'signale', titre: 'Sinistre signalé', description: 'Déclaration reçue de Anne-Marie Legrand', date_etape: '2025-11-06T09:00:00+01:00', created_par: syndicId },
      { sinistre_id: sin1.id, status: 'assurance_declaree', titre: 'Déclaration assurance envoyée', description: 'Dossier transmis à AXA Immobilier', date_etape: '2025-11-08T14:00:00+01:00', created_par: syndicId },
      { sinistre_id: sin1.id, status: 'expertise', titre: 'Expertise réalisée', description: 'Expert AXA sur place — estimation 3 100 €', date_etape: '2025-11-20T10:00:00+01:00', created_par: syndicId },
      { sinistre_id: sin1.id, status: 'travaux', titre: 'Travaux démarrés', description: 'Plomberie Martin & Fils — remplacement canalisation', date_etape: '2025-12-10T08:00:00+01:00', created_par: syndicId },
      { sinistre_id: sin1.id, status: 'cloture', titre: 'Dossier clôturé', description: 'Travaux terminés, indemnisation reçue (2 800 €)', date_etape: '2026-01-20T11:00:00+01:00', created_par: syndicId },
    ])
    log('SIN-2025-001 : Dégât des eaux cave C02 — clôturé')
  }

  const { data: sin2 } = await db.from('sinistres').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    reference: 'SIN-2026-001',
    titre: 'Panne ascenseur — Blocage cabin',
    description: 'L\'ascenseur est bloqué entre le 2e et 3e étage. Technicien Otis contacté. Réparation en cours.',
    status: 'travaux',
    date_sinistre: '2026-01-14',
    date_declaration: '2026-01-14',
    montant_travaux_estime: 1800,
  }).select().single()

  if (sin2) {
    await db.from('sinistre_etapes').insert([
      { sinistre_id: sin2.id, status: 'signale', titre: 'Panne signalée', description: 'Ascenseur bloqué signalé par Thomas Petit (A03)', date_etape: '2026-01-14T07:30:00+01:00', created_par: syndicId },
      { sinistre_id: sin2.id, status: 'travaux', titre: 'Technicien Otis mandaté', description: 'Intervention prévue sous 48h — devis 1 800 €', date_etape: '2026-01-15T09:00:00+01:00', created_par: syndicId },
    ])
    log('SIN-2026-001 : Panne ascenseur — en cours de travaux')
  }

  const { data: sin3 } = await db.from('sinistres').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    gestionnaire_id: syndicId,
    reference: 'SIN-2026-002',
    titre: '⚠ Fissures façade principale — URGENT',
    description: 'Apparition de fissures importantes sur la façade principale (côté rue). Expertise urgente requise. Risque de chute d\'enduit.',
    status: 'urgence',
    lots_concernes: [lotA05, lotA09],
    date_sinistre: '2026-04-10',
    date_declaration: '2026-04-10',
    compagnie_assurance: 'AXA Immobilier',
    montant_travaux_estime: 45000,
  }).select().single()

  if (sin3) {
    await db.from('sinistre_etapes').insert([
      { sinistre_id: sin3.id, status: 'signale', titre: 'Fissures signalées', description: 'Constatées lors de l\'inspection trimestrielle', date_etape: '2026-04-10T14:00:00+02:00', created_par: syndicId },
      { sinistre_id: sin3.id, status: 'urgence', titre: 'Classé URGENT', description: 'Périmètre de sécurité mis en place. Expertise d\'urgence commandée.', date_etape: '2026-04-11T09:00:00+02:00', created_par: syndicId },
    ])
    log('SIN-2026-002 : Fissures façade — URGENT')
  }

  // ── 9. Appels de charges ───────────────────────────────────────
  section('Appels de charges (4 trimestres × 15 lots)')

  const trimestres = [
    { libelle: 'Appel de charges T3 2025', date_appel: '2025-07-01', date_echeance: '2025-10-01', paye: true },
    { libelle: 'Appel de charges T4 2025', date_appel: '2025-10-01', date_echeance: '2026-01-01', paye: true },
    { libelle: 'Appel de charges T1 2026', date_appel: '2026-01-01', date_echeance: '2026-04-01', paye: false },
    { libelle: 'Appel de charges T2 2026', date_appel: '2026-04-01', date_echeance: '2026-07-01', paye: false },
  ]

  // Copros qui ont des impayés :
  // Thomas Petit (A03) — T1 et T2 2026 non payés
  // Philippe Martin (A07) — T2 2026 non payé
  // Sylvie Blanc (P01) — T1 et T2 2026 non payés
  const impayesEmails = new Set([
    't.petit@demo-coplio.fr',
    'ph.martin@demo-coplio.fr',
    's.blanc@demo-coplio.fr',
  ])

  let appelCount = 0
  for (const c of COPROS_DATA) {
    const lotId = lotMap.get(c.lot)!
    const lot = LOTS_DATA.find(l => l.numero === c.lot)!
    const coproId = coproMap.get(c.email)!

    // Montant trimestriel proportionnel aux tantièmes (budget annuel 80 000€)
    const montant = parseFloat(((lot.tantiemes / 8580) * 80000 / 4).toFixed(2))

    for (const trim of trimestres) {
      const isImpayes = impayesEmails.has(c.email) && !trim.paye
      const montantPaye = trim.paye ? montant : (isImpayes ? 0 : montant)

      await db.from('appels_charges').insert({
        copropriete_id: coproprieteId,
        lot_id: lotId,
        coproprietaire_id: coproId,
        libelle: trim.libelle,
        montant,
        date_appel: trim.date_appel,
        date_echeance: trim.date_echeance,
        montant_paye: montantPaye,
        date_paiement: trim.paye ? trim.date_echeance : null,
        nb_relances: isImpayes && trim.libelle.includes('T1') ? 1 : 0,
      })
      appelCount++
    }
  }

  // Mettre à jour les soldes des lots avec impayés
  const lotsImpayes = ['A03', 'A07', 'P01']
  for (const num of lotsImpayes) {
    const lotId = lotMap.get(num)!
    const lot = LOTS_DATA.find(l => l.numero === num)!
    const montantTrim = parseFloat(((lot.tantiemes / 8580) * 80000 / 4).toFixed(2))
    const nbTrimImpayes = num === 'A07' ? 1 : 2
    await db.from('lots').update({ montant_impaye: montantTrim * nbTrimImpayes }).eq('id', lotId)
  }

  log(`${appelCount} appels de charges créés — 3 copropriétaires en impayé (A03, A07, P01)`)

  // ── 10. Votes portail copropriétaires ──────────────────────────
  section('Votes & consultations')

  const { data: vote1 } = await db.from('votes').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    created_by: syndicId,
    titre: 'Installation caméra de surveillance — entrée principale',
    description: 'Suite aux incidents signalés, le syndic propose l\'installation d\'une caméra à l\'entrée. Coût estimé : 450 €.',
    statut: 'ouvert',
    date_debut: new Date('2026-05-01').toISOString(),
    date_fin: new Date('2026-06-01').toISOString(),
  }).select().single()

  if (vote1) {
    const { data: opts1 } = await db.from('vote_options').insert([
      { vote_id: vote1.id, label: 'Pour', ordre: 0 },
      { vote_id: vote1.id, label: 'Contre', ordre: 1 },
      { vote_id: vote1.id, label: 'Abstention', ordre: 2 },
    ]).select()

    // 7 copros ont déjà voté
    if (opts1) {
      const optPour = opts1[0].id
      const optContre = opts1[1].id
      const votes = [
        { email: 'jp.moreau@demo-coplio.fr', option: optPour },
        { email: 'marie.lefevre@demo-coplio.fr', option: optPour },
        { email: 's.bernard@demo-coplio.fr', option: optPour },
        { email: 'l.dubois@demo-coplio.fr', option: optPour },
        { email: 'i.roux@demo-coplio.fr', option: optContre },
        { email: 'ph.martin@demo-coplio.fr', option: optContre },
        { email: 'n.simon@demo-coplio.fr', option: optPour },
      ]
      for (const v of votes) {
        await db.from('vote_reponses').insert({
          vote_id: vote1.id,
          option_id: v.option,
          coproprietaire_id: coproMap.get(v.email)!,
        })
      }
    }
    log('Vote ouvert : Caméra surveillance (7/15 ont voté)')
  }

  const { data: vote2 } = await db.from('votes').insert({
    copropriete_id: coproprieteId,
    cabinet_id: cabinetId,
    created_by: syndicId,
    titre: 'Choix prestataire entretien espaces verts',
    description: 'Renouvellement du contrat annuel d\'entretien. 3 devis reçus : Vert Provence (1200€), Jardins du Sud (980€), NaturPaysage (1100€).',
    statut: 'clos',
    date_debut: new Date('2026-03-01').toISOString(),
    date_fin: new Date('2026-04-01').toISOString(),
  }).select().single()

  if (vote2) {
    const { data: opts2 } = await db.from('vote_options').insert([
      { vote_id: vote2.id, label: 'Vert Provence — 1 200 €', ordre: 0 },
      { vote_id: vote2.id, label: 'Jardins du Sud — 980 €', ordre: 1 },
      { vote_id: vote2.id, label: 'NaturPaysage — 1 100 €', ordre: 2 },
    ]).select()

    if (opts2) {
      const responses = [
        { email: 'jp.moreau@demo-coplio.fr', option: opts2[1].id },
        { email: 'marie.lefevre@demo-coplio.fr', option: opts2[1].id },
        { email: 't.petit@demo-coplio.fr', option: opts2[1].id },
        { email: 's.bernard@demo-coplio.fr', option: opts2[0].id },
        { email: 'l.dubois@demo-coplio.fr', option: opts2[1].id },
        { email: 'i.roux@demo-coplio.fr', option: opts2[2].id },
        { email: 'ph.martin@demo-coplio.fr', option: opts2[1].id },
        { email: 'n.simon@demo-coplio.fr', option: opts2[1].id },
        { email: 'f.girard@demo-coplio.fr', option: opts2[2].id },
        { email: 'c.laurent@demo-coplio.fr', option: opts2[1].id },
        { email: 'm.fontaine@demo-coplio.fr', option: opts2[1].id },
        { email: 'am.legrand@demo-coplio.fr', option: opts2[0].id },
        { email: 'j.mercier@demo-coplio.fr', option: opts2[1].id },
        { email: 's.blanc@demo-coplio.fr', option: opts2[1].id },
        { email: 'p.garnier@demo-coplio.fr', option: opts2[2].id },
      ]
      for (const r of responses) {
        await db.from('vote_reponses').insert({
          vote_id: vote2.id,
          option_id: r.option,
          coproprietaire_id: coproMap.get(r.email)!,
        })
      }
    }
    log('Vote clôturé : Prestataire espaces verts (15/15 ont voté — Jardins du Sud élu)')
  }

  // ── 11. Messages ───────────────────────────────────────────────
  section('Messagerie (conversations syndic ↔ copropriétaires)')

  const convData = [
    {
      email: 't.petit@demo-coplio.fr',
      sujet: 'Question sur mon impayé T4 2025',
      messages: [
        { expediteur: 't.petit@demo-coplio.fr', contenu: 'Bonjour, je n\'ai pas reçu mon appel de charges T4 2025. Pouvez-vous me renvoyer la quittance ?', at: '2026-01-10T10:00:00+01:00' },
        { expediteur: SYNDIC.email, contenu: 'Bonjour M. Petit, je vous renvoie la quittance par email. Le montant dû est de 633,70 €. Merci de régulariser avant le 31 janvier.', at: '2026-01-10T14:30:00+01:00' },
        { expediteur: 't.petit@demo-coplio.fr', contenu: 'Merci pour le rappel. Je vais procéder au virement cette semaine.', at: '2026-01-11T09:00:00+01:00' },
      ],
    },
    {
      email: 'am.legrand@demo-coplio.fr',
      sujet: 'Sinistre cave C02 — suivi travaux',
      messages: [
        { expediteur: 'am.legrand@demo-coplio.fr', contenu: 'Bonjour, quand les travaux pour la cave vont-ils commencer ? L\'humidité est toujours présente.', at: '2025-11-25T11:00:00+01:00' },
        { expediteur: SYNDIC.email, contenu: 'Bonjour Mme Legrand, l\'expertise AXA a eu lieu le 20/11. Les travaux sont planifiés pour le 10 décembre. L\'entreprise Plomberie Martin & Fils interviendra.', at: '2025-11-25T15:00:00+01:00' },
        { expediteur: 'am.legrand@demo-coplio.fr', contenu: 'Parfait merci pour le suivi !', at: '2025-11-26T09:30:00+01:00' },
      ],
    },
    {
      email: 'f.girard@demo-coplio.fr',
      sujet: 'Demande de document — règlement copropriété',
      messages: [
        { expediteur: 'f.girard@demo-coplio.fr', contenu: 'Bonjour, pourriez-vous me transmettre le règlement de copropriété ? Je ne le retrouve plus.', at: '2026-02-15T16:00:00+01:00' },
        { expediteur: SYNDIC.email, contenu: 'Bonjour M. Girard, le règlement est disponible dans l\'espace Documents de votre portail copropriétaire. Vous pouvez le télécharger directement.', at: '2026-02-16T09:00:00+01:00' },
      ],
    },
  ]

  for (const conv of convData) {
    const coproId = coproMap.get(conv.email)!
    const coproProfileId = coproProfileMap.get(conv.email)!

    const { data: conversation } = await db.from('conversations').insert({
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      coproprietaire_id: coproId,
      gestionnaire_id: syndicId,
      sujet: conv.sujet,
      derniere_activite: conv.messages[conv.messages.length - 1].at,
    }).select().single()

    if (conversation) {
      for (const msg of conv.messages) {
        const expediteurId = msg.expediteur === SYNDIC.email ? syndicId : coproProfileId
        await db.from('messages').insert({
          conversation_id: conversation.id,
          expediteur_id: expediteurId,
          contenu: msg.contenu,
          lu: true,
          created_at: msg.at,
        })
      }
    }
    log(`Conversation: "${conv.sujet}"`)
  }

  // ── 12. Événements agenda ──────────────────────────────────────
  section('Agenda (événements)')
  await db.from('evenements').insert([
    {
      cabinet_id: cabinetId,
      gestionnaire_id: syndicId,
      copropriete_id: coproprieteId,
      titre: 'AG Ordinaire 2026',
      description: 'Assemblée Générale Ordinaire annuelle — Résidence Les Oliviers',
      date_debut: '2026-06-15T18:00:00+02:00',
      date_fin: '2026-06-15T20:00:00+02:00',
      lieu: 'Salle communale — 3 Rue du Port, 13008 Marseille',
      type: 'ag',
    },
    {
      cabinet_id: cabinetId,
      gestionnaire_id: syndicId,
      copropriete_id: coproprieteId,
      titre: 'Visite expert fissures façade',
      description: 'Expert bâtiment — inspection fissures (SIN-2026-002)',
      date_debut: '2026-05-28T09:00:00+02:00',
      date_fin: '2026-05-28T11:00:00+02:00',
      lieu: 'Résidence Les Oliviers — façade principale',
      type: 'sinistre',
    },
    {
      cabinet_id: cabinetId,
      gestionnaire_id: syndicId,
      copropriete_id: coproprieteId,
      titre: 'Intervention Otis — réparation ascenseur',
      description: 'Technicien Otis pour réparation ascenseur (SIN-2026-001)',
      date_debut: '2026-01-16T08:00:00+01:00',
      date_fin: '2026-01-16T12:00:00+01:00',
      lieu: 'Résidence Les Oliviers — local technique',
      type: 'travaux',
    },
  ])
  log('3 événements créés dans l\'agenda')

  // ── Résumé final ───────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('✅ SEED TERMINÉ AVEC SUCCÈS')
  console.log('═'.repeat(60))
  console.log('\n📋 IDENTIFIANTS\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ SYNDIC                                                    │')
  console.log('│ Email    : syndic@demo-coplio.fr                         │')
  console.log('│ Password : Demo@Coplio2024                               │')
  console.log('│ URL      : /login                                        │')
  console.log('└─────────────────────────────────────────────────────────┘')
  console.log('\n┌─────────────────────────────────────────────────────────┐')
  console.log('│ COPROPRIÉTAIRES (portail : /portail)                     │')
  console.log('├────────────┬────────────────┬──────────────────────┬─────┤')
  console.log('│ Prénom Nom │ Email          │ Mot de passe         │ Lot │')
  console.log('├────────────┼────────────────┼──────────────────────┼─────┤')
  for (const c of COPROS_DATA) {
    const name = `${c.prenom} ${c.nom}`.substring(0, 18).padEnd(18)
    const email = c.email.substring(0, 30).padEnd(30)
    console.log(`│ ${name} │ ${email} │ ${c.password}  │ ${c.lot} │`)
  }
  console.log('└─────────────────────────────────────────────────────────┘')
  console.log('')
}

main().catch(err => {
  console.error('\n❌ ERREUR:', err.message)
  process.exit(1)
})
