/**
 * COPLIO — Script de seed démonstration — PARTIE 2
 * Ajoute : prestataires, carnet d'entretien, documents, budgets,
 *          fonds travaux, sinistre devis/intervenants, relances,
 *          travaux, clés d'accès, obligations légales, archives
 *
 * Prérequis : seed-demo.ts doit avoir été exécuté avant
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qathchrashvfnugfdadc.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdGhjaHJhc2h2Zm51Z2ZkYWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg2NDQ0NSwiZXhwIjoyMDkyNDQwNDQ1fQ.FNISs-5OQYJEtje5giVwOWX2fJqxFFjhgjYCBoYpFDU'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function log(msg: string) { console.log(`  ✓ ${msg}`) }
function section(msg: string) { console.log(`\n▶ ${msg}`) }
function warn(msg: string) { console.log(`  ⚠ ${msg}`) }

function err(msg: string, e: unknown) {
  console.error(`  ✗ ${msg}`, e)
}

// ─── Helpers ─────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  COPLIO — Seed démonstration — Partie 2')
  console.log('══════════════════════════════════════════════')

  // ─── Récupérer les IDs existants ──────────────────────────────
  section('Récupération des données existantes')

  // Trouver le cabinet qui possède "Résidence Les Oliviers"
  const { data: copropriete } = await db
    .from('coproprietes')
    .select('id, cabinet_id')
    .eq('nom', 'Résidence Les Oliviers')
    .limit(1)
    .single()

  if (!copropriete) {
    // Fallback : chercher par email du syndic demo
    const { data: profile } = await db.from('profiles').select('cabinet_id').eq('email', 'syndic@demo-coplio.fr').single()
    if (!profile?.cabinet_id) {
      console.error('❌ Données démo non trouvées. Veuillez lancer seed-demo.ts en premier.')
      process.exit(1)
    }
    const { data: cp } = await db.from('coproprietes').select('id').eq('cabinet_id', profile.cabinet_id).limit(1).single()
    if (!cp) {
      console.error('❌ Copropriété du syndic démo introuvable.')
      process.exit(1)
    }
    // Redirect recursively — won't happen since we check above
    console.error('❌ Unexpected branch.')
    process.exit(1)
  }

  const coproprieteId = copropriete.id
  const cabinetId = copropriete.cabinet_id
  log(`Cabinet : ${cabinetId}`)
  log(`Copropriété : ${coproprieteId}`)

  // Récupérer le syndic (gestionnaire)
  const { data: syndic } = await db
    .from('profiles')
    .select('id')
    .eq('cabinet_id', cabinetId)
    .eq('role', 'owner')
    .limit(1)
    .single()

  const syndicId = syndic?.id ?? null
  log(`Syndic profile : ${syndicId}`)

  // Récupérer les sinistres créés
  const { data: sinistres } = await db
    .from('sinistres')
    .select('id, reference')
    .eq('copropriete_id', coproprieteId)
    .order('created_at', { ascending: true })

  const sinistre1 = sinistres?.find(s => s.reference?.includes('2025-001'))
  const sinistre2 = sinistres?.find(s => s.reference?.includes('2026-001'))
  const sinistre3 = sinistres?.find(s => s.reference?.includes('2026-002'))
  log(`Sinistres trouvés : ${sinistres?.length ?? 0}`)

  // ─── 1. PRESTATAIRES ──────────────────────────────────────────
  section('Prestataires')

  const prestatairesData = [
    {
      cabinet_id: cabinetId,
      nom: 'Plomberie Dupont & Fils',
      categorie: 'plomberie',
      email: 'contact@plomberie-dupont.fr',
      telephone: '04 91 23 45 67',
      siret: '12345678900011',
      adresse: '15 rue de la République, 13001 Marseille',
      notes: 'Intervenant prioritaire pour toute urgence plomberie. Disponible 24h/24.',
    },
    {
      cabinet_id: cabinetId,
      nom: 'Électricité Moreau SARL',
      categorie: 'electricite',
      email: 'moreau-elec@gmail.com',
      telephone: '04 91 34 56 78',
      siret: '23456789000122',
      adresse: '8 avenue du Prado, 13008 Marseille',
      notes: 'Certifié Qualifelec. Contrat maintenance annuel en cours.',
    },
    {
      cabinet_id: cabinetId,
      nom: 'Ascenseurs Sud Maintenance',
      categorie: 'ascenseur',
      email: 'contact@ascenseurs-sud.fr',
      telephone: '04 91 45 67 89',
      siret: '34567890000133',
      adresse: '22 boulevard Michelet, 13009 Marseille',
      notes: 'Contrat de maintenance ascenseur. Visite semestrielle incluse.',
    },
    {
      cabinet_id: cabinetId,
      nom: 'Espaces Verts Méditerranée',
      categorie: 'jardinage',
      email: 'evm@espacesverts-med.fr',
      telephone: '04 91 56 78 90',
      siret: '45678900001344',
      adresse: '5 chemin des Collines, 13013 Marseille',
      notes: 'Entretien espaces verts. Passage bi-mensuel.',
    },
    {
      cabinet_id: cabinetId,
      nom: 'Peinture & Rénovation Lemaire',
      categorie: 'peinture',
      email: 'lemaire.reno@outlook.fr',
      telephone: '06 12 34 56 78',
      siret: '56789000013455',
      adresse: '3 impasse des Artisans, 13011 Marseille',
      notes: 'Devis gratuit. Spécialiste parties communes immeuble.',
    },
  ]

  const { data: prestataires, error: prestErr } = await db
    .from('prestataires')
    .insert(prestatairesData)
    .select('id, nom, categorie')

  if (prestErr) {
    err('Erreur prestataires', prestErr)
  } else {
    log(`${prestataires?.length} prestataires créés`)
  }

  const plombier = prestataires?.find(p => p.categorie === 'plomberie')
  const electricien = prestataires?.find(p => p.categorie === 'electricite')
  const ascensoriste = prestataires?.find(p => p.categorie === 'ascenseur')
  const jardinier = prestataires?.find(p => p.categorie === 'jardinage')
  const peintre = prestataires?.find(p => p.categorie === 'peinture')

  // ─── 2. CARNET D'ENTRETIEN ────────────────────────────────────
  section("Carnet d'entretien")

  const entretiensData = [
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: ascensoriste?.id ?? null,
      titre: 'Maintenance annuelle ascenseur',
      description: "Visite de contrôle et maintenance complète de l'ascenseur. Remplacement du câble de sécurité et lubrification des guides.",
      type: 'maintenance',
      date_intervention: monthsAgo(5),
      cout: 850.00,
      statut: 'realise',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: plombier?.id ?? null,
      titre: 'Remplacement vanne colonne montante',
      description: "Remplacement de la vanne d'arrêt principale de la colonne montante d'eau froide. Travaux effectués un samedi pour limiter les coupures.",
      type: 'reparation',
      date_intervention: monthsAgo(4),
      cout: 420.00,
      statut: 'realise',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: electricien?.id ?? null,
      titre: 'Mise en conformité tableau électrique parties communes',
      description: "Mise en conformité du tableau électrique des parties communes. Installation de disjoncteurs différentiels et remplacement des prises défectueuses.",
      type: 'renovation',
      date_intervention: monthsAgo(3),
      cout: 1250.00,
      statut: 'realise',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: jardinier?.id ?? null,
      titre: 'Taille et entretien espaces verts printemps',
      description: "Taille des haies, tonte de la pelouse, désherbage des massifs. Plantation de nouvelles fleurs saisonnières.",
      type: 'maintenance',
      date_intervention: monthsAgo(2),
      cout: 380.00,
      statut: 'realise',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: peintre?.id ?? null,
      titre: 'Peinture cage escalier RDC → 2e étage',
      description: "Rafraîchissement peinture cage escalier du rez-de-chaussée au 2ème étage. Préparation des supports et deux couches de peinture lavable.",
      type: 'renovation',
      date_intervention: monthsAgo(1),
      cout: 2100.00,
      statut: 'realise',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      prestataire_id: ascensoriste?.id ?? null,
      titre: 'Visite semestrielle ascenseur',
      description: "Prochaine visite de contrôle semestrielle réglementaire de l'ascenseur.",
      type: 'maintenance',
      date_intervention: daysFromNow(25),
      cout: null,
      statut: 'planifie',
    },
  ]

  const { data: entretiens, error: entErr } = await db
    .from('entretiens')
    .insert(entretiensData)
    .select('id')

  if (entErr) {
    err('Erreur entretiens', entErr)
  } else {
    log(`${entretiens?.length} entrées carnet d'entretien créées`)
  }

  // ─── 3. DOCUMENTS ─────────────────────────────────────────────
  section('Documents')

  const documentsData = [
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'Règlement de copropriété — Résidence Les Oliviers',
      description: 'Règlement de copropriété initial avec dernières modifications approuvées en AG.',
      categorie: 'reglement',
      taille_bytes: 524288,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/reglement-copropriete.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(6),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'PV Assemblée Générale Ordinaire 2024',
      description: "Procès-verbal de l'AG ordinaire du 15 novembre 2024. Approbation des comptes, vote budget 2025.",
      categorie: 'pv_ag',
      taille_bytes: 256000,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/pv-ago-2024.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(6),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'Budget prévisionnel 2025 — Détail',
      description: 'Tableau détaillé du budget prévisionnel 2025 approuvé en AG. Charges courantes et charges exceptionnelles.',
      categorie: 'budget',
      taille_bytes: 189440,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/budget-previsionnel-2025.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(5),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'Contrat de maintenance ascenseur — Ascenseurs Sud',
      description: "Contrat de maintenance annuelle de l'ascenseur. Renouvellement 2025-2026.",
      categorie: 'contrat',
      taille_bytes: 312320,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/contrat-ascenseur-2025.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: false,
      upload_par: syndicId,
      created_at: monthsAgo(4),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: "Appel de charges Q1 2025 — Récapitulatif",
      description: "Récapitulatif des appels de charges du 1er trimestre 2025 avec détail par lot.",
      categorie: 'appel_fonds',
      taille_bytes: 145000,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/appel-charges-q1-2025.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(3),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: "Rapport d'expertise sinistre dégât des eaux A07",
      description: "Rapport d'expertise de l'assureur suite au sinistre dégât des eaux lot A07.",
      categorie: 'sinistre',
      taille_bytes: 478000,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/expertise-sinistre-2026-001.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: false,
      upload_par: syndicId,
      created_at: monthsAgo(2),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'PV Assemblée Générale Extraordinaire mars 2026',
      description: "Procès-verbal de l'AGE du 20 mars 2026. Vote travaux ravalement façade.",
      categorie: 'pv_ag',
      taille_bytes: 198000,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/pv-age-mars-2026.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(2),
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      nom: 'Diagnostic Technique Global (DTG) 2024',
      description: 'DTG réalisé par le cabinet DIAG-IMMO. Évaluation état général bâtiment et travaux préconisés.',
      categorie: 'autre',
      taille_bytes: 2097152,
      type_mime: 'application/pdf',
      storage_path: `documents/${cabinetId}/${coproprieteId}/dtg-2024.pdf`,
      storage_bucket: 'documents',
      visible_coproprietaires: true,
      upload_par: syndicId,
      created_at: monthsAgo(5),
    },
  ]

  const { data: documents, error: docErr } = await db
    .from('documents')
    .insert(documentsData)
    .select('id, nom, categorie')

  if (docErr) {
    err('Erreur documents', docErr)
  } else {
    log(`${documents?.length} documents créés`)
  }

  // ─── 4. BUDGETS ───────────────────────────────────────────────
  section('Budgets prévisionnels')

  // Budget 2025 (approuvé)
  const { data: budget2025, error: b25Err } = await db
    .from('budgets')
    .insert({
      copropriete_id: coproprieteId,
      annee: 2025,
      statut: 'approuve',
      created_by: syndicId,
    })
    .select('id')
    .single()

  if (b25Err) {
    err('Erreur budget 2025', b25Err)
  } else {
    log('Budget 2025 créé')
  }

  if (budget2025) {
    const lignes2025 = [
      { budget_id: budget2025.id, poste: 'Assurance immeuble', categorie: 'assurances', montant_previsionnel: 4200.00, montant_reel: 4200.00, ordre: 1 },
      { budget_id: budget2025.id, poste: 'Entretien ascenseur', categorie: 'entretien', montant_previsionnel: 2400.00, montant_reel: 850.00, ordre: 2 },
      { budget_id: budget2025.id, poste: 'Nettoyage parties communes', categorie: 'charges_generales', montant_previsionnel: 3600.00, montant_reel: 3200.00, ordre: 3 },
      { budget_id: budget2025.id, poste: 'Entretien espaces verts', categorie: 'entretien', montant_previsionnel: 2400.00, montant_reel: 760.00, ordre: 4 },
      { budget_id: budget2025.id, poste: 'Électricité parties communes', categorie: 'charges_generales', montant_previsionnel: 3800.00, montant_reel: 3100.00, ordre: 5 },
      { budget_id: budget2025.id, poste: 'Eau froide', categorie: 'charges_generales', montant_previsionnel: 1800.00, montant_reel: 1650.00, ordre: 6 },
      { budget_id: budget2025.id, poste: 'Honoraires syndic', categorie: 'honoraires', montant_previsionnel: 6000.00, montant_reel: 3000.00, ordre: 7 },
      { budget_id: budget2025.id, poste: 'Travaux peinture cage escalier', categorie: 'travaux', montant_previsionnel: 2500.00, montant_reel: 2100.00, ordre: 8 },
      { budget_id: budget2025.id, poste: 'Divers et imprévus', categorie: 'autre', montant_previsionnel: 1800.00, montant_reel: 420.00, ordre: 9 },
    ]

    const { error: l25Err } = await db.from('budget_lignes').insert(lignes2025)
    if (l25Err) err('Erreur lignes budget 2025', l25Err)
    else log(`${lignes2025.length} lignes budget 2025 créées`)
  }

  // Budget 2026 (validé)
  const { data: budget2026, error: b26Err } = await db
    .from('budgets')
    .insert({
      copropriete_id: coproprieteId,
      annee: 2026,
      statut: 'valide',
      created_by: syndicId,
    })
    .select('id')
    .single()

  if (b26Err) {
    err('Erreur budget 2026', b26Err)
  } else {
    log('Budget 2026 créé')
  }

  if (budget2026) {
    const lignes2026 = [
      { budget_id: budget2026.id, poste: 'Assurance immeuble', categorie: 'assurances', montant_previsionnel: 4500.00, ordre: 1 },
      { budget_id: budget2026.id, poste: 'Entretien ascenseur', categorie: 'entretien', montant_previsionnel: 2600.00, ordre: 2 },
      { budget_id: budget2026.id, poste: 'Nettoyage parties communes', categorie: 'charges_generales', montant_previsionnel: 3800.00, ordre: 3 },
      { budget_id: budget2026.id, poste: 'Entretien espaces verts', categorie: 'entretien', montant_previsionnel: 2800.00, ordre: 4 },
      { budget_id: budget2026.id, poste: 'Électricité parties communes', categorie: 'charges_generales', montant_previsionnel: 4200.00, ordre: 5 },
      { budget_id: budget2026.id, poste: 'Eau froide', categorie: 'charges_generales', montant_previsionnel: 2000.00, ordre: 6 },
      { budget_id: budget2026.id, poste: 'Honoraires syndic', categorie: 'honoraires', montant_previsionnel: 6500.00, ordre: 7 },
      { budget_id: budget2026.id, poste: 'Ravalement façade (tranche 1)', categorie: 'travaux', montant_previsionnel: 5500.00, ordre: 8 },
      { budget_id: budget2026.id, poste: 'Remplacement boîtes aux lettres', categorie: 'travaux', montant_previsionnel: 1800.00, ordre: 9 },
      { budget_id: budget2026.id, poste: 'Divers et imprévus', categorie: 'autre', montant_previsionnel: 500.00, ordre: 10 },
    ]

    const { error: l26Err } = await db.from('budget_lignes').insert(lignes2026)
    if (l26Err) err('Erreur lignes budget 2026', l26Err)
    else log(`${lignes2026.length} lignes budget 2026 créées`)
  }

  // ─── 5. FONDS TRAVAUX ─────────────────────────────────────────
  section('Fonds travaux')

  // Vérifier si un fonds travaux existe déjà
  const { data: existingFonds } = await db
    .from('fonds_travaux')
    .select('id')
    .eq('copropriete_id', coproprieteId)
    .single()

  let fondsId: string | null = existingFonds?.id ?? null

  if (!existingFonds) {
    const { data: fonds, error: fondsErr } = await db
      .from('fonds_travaux')
      .insert({
        copropriete_id: coproprieteId,
        annee: 2026,
        cotisation_annuelle: 6000.00,
        solde_actuel: 12750.00,
        objectif_5ans: 40000.00,
        notes: 'Fonds constitué pour les grands travaux. Objectif ravalement + toiture horizon 2028.',
      })
      .select('id')
      .single()

    if (fondsErr) {
      err('Erreur fonds travaux', fondsErr)
    } else {
      fondsId = fonds?.id ?? null
      log('Fonds travaux créé')
    }
  } else {
    log('Fonds travaux existant trouvé')
  }

  if (fondsId) {
    // Mouvements historiques
    const toDate = (iso: string) => iso.split('T')[0] // YYYY-MM-DD

    const mouvements = [
      {
        fonds_travaux_id: fondsId,
        type_mouvement: 'cotisation',
        montant: 4500.00,
        libelle: 'Cotisations fonds travaux Q1 2025 (15 lots × 300€)',
        date_mouvement: toDate(monthsAgo(5)),
      },
      {
        fonds_travaux_id: fondsId,
        type_mouvement: 'cotisation',
        montant: 4500.00,
        libelle: 'Cotisations fonds travaux Q2 2025 (15 lots × 300€)',
        date_mouvement: toDate(monthsAgo(3)),
      },
      {
        fonds_travaux_id: fondsId,
        type_mouvement: 'retrait',
        montant: -3250.00,
        libelle: 'Remplacement chaudière parties communes — Plomberie Dupont',
        date_mouvement: toDate(monthsAgo(2)),
      },
      {
        fonds_travaux_id: fondsId,
        type_mouvement: 'cotisation',
        montant: 4500.00,
        libelle: 'Cotisations fonds travaux Q3 2025 (15 lots × 300€)',
        date_mouvement: toDate(monthsAgo(1)),
      },
      {
        fonds_travaux_id: fondsId,
        type_mouvement: 'cotisation',
        montant: 2500.00,
        libelle: 'Cotisations fonds travaux Q4 2025 — versement partiel',
        date_mouvement: toDate(daysAgo(15)),
      },
    ]

    const { error: mvtErr } = await db.from('fonds_travaux_mouvements').insert(mouvements)
    if (mvtErr) err('Erreur mouvements fonds travaux', mvtErr)
    else log(`${mouvements.length} mouvements fonds travaux créés`)
  }

  // ─── 6. SINISTRE DEVIS & INTERVENANTS ─────────────────────────
  section('Sinistre devis et intervenants')

  if (sinistre1) {
    // Devis pour SIN-2025-001 (fuite tuyau)
    const { error: d1Err } = await db.from('sinistre_devis').insert([
      {
        sinistre_id: sinistre1.id,
        prestataire: 'Plomberie Dupont & Fils',
        montant: 1850.00,
        description: 'Remplacement colonne montante endommagée, remise en état cloisons, séchage et traitement anti-humidité.',
        statut: 'accepte',
      },
      {
        sinistre_id: sinistre1.id,
        prestataire: 'Travaux Secs & Peinture Martin',
        montant: 3200.00,
        description: 'Remise en état complète plafonds et murs lots A03 et parties communes. Ragréage, enduit et peinture.',
        statut: 'accepte',
      },
    ])
    if (d1Err) err(`Devis sinistre 1`, d1Err)
    else log('2 devis créés pour sinistre 1 (fuite)')

    // Intervenants pour SIN-2025-001
    const { error: i1Err } = await db.from('sinistre_intervenants').insert([
      {
        sinistre_id: sinistre1.id,
        nom: 'Marc Fontaine',
        role: 'Expert assurance',
        telephone: '06 78 90 12 34',
        email: 'm.fontaine@expertise-immo.fr',
        entreprise: 'Cabinet Fontaine Expertise',
        notes: 'Expert mandaté par Groupama. Rapport déposé le 15/01/2025.',
      },
      {
        sinistre_id: sinistre1.id,
        nom: 'Jean Dupont',
        role: 'Plombier',
        telephone: '04 91 23 45 67',
        email: 'contact@plomberie-dupont.fr',
        entreprise: 'Plomberie Dupont & Fils',
        notes: 'Intervenu en urgence pour stopper la fuite puis réparation définitive.',
      },
    ])
    if (i1Err) err('Intervenants sinistre 1', i1Err)
    else log('2 intervenants créés pour sinistre 1')
  }

  if (sinistre2) {
    // Devis pour SIN-2026-001 (infiltration façade)
    const { error: d2Err } = await db.from('sinistre_devis').insert([
      {
        sinistre_id: sinistre2.id,
        prestataire: 'Façades Méditerranée Pro',
        montant: 8500.00,
        description: "Traitement hydrofuge façade Est, rebouchage fissures, reprise joints. Echafaudage inclus.",
        statut: 'en_attente',
      },
      {
        sinistre_id: sinistre2.id,
        prestataire: 'SARL Bati-Sud Ravalement',
        montant: 9200.00,
        description: "Ravalement partiel façade Est + traitement anti-humidité. Garantie décennale.",
        statut: 'en_attente',
      },
    ])
    if (d2Err) err('Devis sinistre 2', d2Err)
    else log('2 devis créés pour sinistre 2 (infiltration)')

    const { error: i2Err } = await db.from('sinistre_intervenants').insert([
      {
        sinistre_id: sinistre2.id,
        nom: 'Sophie Renaud',
        role: 'Expert assurance',
        telephone: '06 89 01 23 45',
        email: 'renaud.expert@maaf-expertise.fr',
        entreprise: 'MAAF Expertise Immeuble',
        notes: 'Expertise en cours. Retour attendu sous 3 semaines.',
      },
    ])
    if (i2Err) err('Intervenants sinistre 2', i2Err)
    else log('1 intervenant créé pour sinistre 2')
  }

  if (sinistre3) {
    // Devis pour SIN-2026-002 (bris de glace)
    const { error: d3Err } = await db.from('sinistre_devis').insert([
      {
        sinistre_id: sinistre3.id,
        prestataire: 'Vitrage Express Marseille',
        montant: 680.00,
        description: "Remplacement vitre porte entrée principale double vitrage feuilleté anti-effraction 100x220cm.",
        statut: 'accepte',
      },
    ])
    if (d3Err) err('Devis sinistre 3', d3Err)
    else log('1 devis créé pour sinistre 3 (bris de glace)')
  }

  // ─── 7. RELANCE PARAMÈTRES ────────────────────────────────────
  section('Paramètres de relance')

  const { error: relErr } = await db
    .from('relance_parametres')
    .upsert({
      copropriete_id: coproprieteId,
      actif: true,
      delai_premier_rappel: 30,
      delai_deuxieme_rappel: 60,
      delai_mise_en_demeure: 90,
      premier_rappel_email: true,
      premier_rappel_sms: false,
      deuxieme_rappel_email: true,
      deuxieme_rappel_sms: true,
      texte_premier_rappel: "Bonjour,\n\nNous vous rappelons que votre appel de charges d'un montant de {montant}€ pour le lot {lot} est en retard de paiement depuis {jours} jours.\n\nNous vous remercions de régulariser cette situation dans les meilleurs délais.\n\nCordialement,\nCabinet Martin Syndic",
      texte_deuxieme_rappel: "Bonjour,\n\nMalgré notre premier rappel du {date_premier_rappel}, votre solde reste impayé.\n\nMontant dû : {montant}€\nLot : {lot}\n\nSans régularisation sous 30 jours, nous serons contraints d'engager une procédure de recouvrement.\n\nCordialement,\nCabinet Martin Syndic",
    }, { onConflict: 'copropriete_id' })

  if (relErr) err('Erreur relance_parametres', relErr)
  else log('Paramètres de relance configurés')

  // ─── 8. TRAVAUX ───────────────────────────────────────────────
  section('Suivi des travaux')

  const { data: travauxList, error: travErr } = await db
    .from('travaux')
    .insert([
      {
        copropriete_id: coproprieteId,
        cabinet_id: cabinetId,
        prestataire_id: peintre?.id ?? null,
        titre: 'Ravalement façade côté rue',
        description: "Ravalement complet de la façade principale donnant sur la rue. Nettoyage haute pression, traitement fissures, peinture siloxane.",
        priorite: 'haute',
        statut: 'devis',
        montant_estime: 18500.00,
        created_by: syndicId,
        created_at: monthsAgo(2),
      },
      {
        copropriete_id: coproprieteId,
        cabinet_id: cabinetId,
        prestataire_id: electricien?.id ?? null,
        titre: 'Installation éclairage LED parties communes',
        description: "Remplacement de tous les luminaires des parties communes par des LED avec détecteurs de présence. Économies d'énergie estimées à 60%.",
        priorite: 'normale',
        statut: 'planifie',
        montant_estime: 3200.00,
        montant_final: null,
        created_by: syndicId,
        created_at: monthsAgo(1),
      },
      {
        copropriete_id: coproprieteId,
        cabinet_id: cabinetId,
        prestataire_id: null,
        titre: 'Réfection toiture-terrasse',
        description: "Étanchéité toiture-terrasse à reprendre. Des infiltrations ont été constatées au 4ème étage. Devis en attente.",
        priorite: 'urgente',
        statut: 'demande',
        montant_estime: 12000.00,
        created_by: syndicId,
        created_at: daysAgo(10),
      },
    ])
    .select('id, titre')

  if (travErr) err('Erreur travaux', travErr)
  else log(`${travauxList?.length} travaux créés`)

  if (travauxList?.[0]) {
    await db.from('travaux_etapes').insert([
      {
        travail_id: travauxList[0].id,
        type: 'creation',
        description: 'Ouverture du dossier travaux ravalement façade suite décision AG extraordinaire mars 2026.',
        created_by: syndicId,
        created_at: monthsAgo(2),
      },
      {
        travail_id: travauxList[0].id,
        type: 'devis',
        description: 'Demande de devis envoyée à 3 entreprises spécialisées.',
        montant: 18500.00,
        created_by: syndicId,
        created_at: monthsAgo(1),
      },
    ])
    log('Étapes travaux ravalement créées')
  }

  // ─── 9. CLÉS D'ACCÈS ─────────────────────────────────────────
  section("Clés et accès")

  const { error: clesErr } = await db.from('cles_acces').insert([
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'cle',
      description: 'Clé porte entrée principale',
      localisation: 'Porte d\'entrée RDC',
      detenteur_nom: 'Cabinet Martin Syndic',
      date_remise: monthsAgo(6),
      retourne: false,
      notes: 'Trousseau × 3 clés. Numérotées C-001, C-002, C-003.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'badge',
      description: 'Badge parking SS1',
      localisation: 'Accès parking sous-sol',
      detenteur_nom: 'Jean-Pierre Moreau (lot P01)',
      date_remise: monthsAgo(5),
      retourne: false,
      notes: 'Badge magnétique. Code : 1234.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'code',
      description: 'Code digicode entrée',
      localisation: 'Interphone / digicode entrée',
      detenteur_nom: 'Tous copropriétaires',
      date_remise: monthsAgo(6),
      retourne: false,
      notes: 'Code actuel : 4521A. Changé lors de la dernière AG.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'cle',
      description: 'Clé locale technique chaufferie',
      localisation: 'Sous-sol — local chaufferie',
      detenteur_nom: 'Plomberie Dupont & Fils',
      date_remise: monthsAgo(3),
      retourne: false,
      notes: 'Remise au plombier pour intervention. À récupérer.',
    },
  ])

  if (clesErr) err('Erreur clés accès', clesErr)
  else log('4 clés/accès créés')

  // ─── 10. OBLIGATIONS LÉGALES ──────────────────────────────────
  section('Obligations légales')

  const { error: oblErr } = await db.from('obligations_legales').insert([
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'DPE',
      description: 'Diagnostic de Performance Énergétique collectif — Classe D',
      date_realisation: monthsAgo(18),
      date_expiration: daysFromNow(365 * 8),
      notes: 'DPE collectif obligatoire. Prochain renouvellement dans 8 ans. Note : D (261 kWh/m².an).',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'Vérification extincteurs',
      description: "Vérification annuelle extincteurs parties communes",
      date_realisation: monthsAgo(3),
      date_expiration: daysFromNow(275),
      notes: '6 extincteurs vérifiés. Prochain passage prévu dans 9 mois.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'Contrôle ascenseur',
      description: 'Contrôle technique quinquennal ascenseur par organisme agréé',
      date_realisation: monthsAgo(8),
      date_expiration: daysFromNow(365 * 4),
      notes: 'Contrôle conforme. Prochain contrôle quinquennal dans 4 ans.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'Assurance immeuble',
      description: 'Assurance multirisque immeuble — Groupama Pro',
      date_realisation: monthsAgo(5),
      date_expiration: daysFromNow(210),
      notes: 'Police n° GRP-2025-78432. Renouvellement tacite. Échéance annuelle.',
    },
    {
      copropriete_id: coproprieteId,
      cabinet_id: cabinetId,
      type: 'Carnet d\'entretien',
      description: 'Mise à jour annuelle du carnet d\'entretien',
      date_realisation: daysAgo(30),
      date_expiration: daysFromNow(335),
      notes: 'Carnet numérique mis à jour. Prochain bilan annuel dans 11 mois.',
    },
  ])

  if (oblErr) err('Erreur obligations légales', oblErr)
  else log('5 obligations légales créées')

  // ─── 11. ARCHIVES ─────────────────────────────────────────────
  section('Archives légales')

  const { error: archErr } = await db.from('archives').insert([
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      type: 'pv_ag',
      nom: 'PV Assemblée Générale Ordinaire 2023',
      fichier_url: `archives/${cabinetId}/${coproprieteId}/pv-ago-2023.pdf`,
      taille_octets: 234567,
      date_document: monthsAgo(18),
      retention_jusqu_au: daysFromNow(365 * 10),
      created_by: syndicId,
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      type: 'comptabilite',
      nom: 'Comptes de gestion 2023 — Bilan annuel',
      fichier_url: `archives/${cabinetId}/${coproprieteId}/comptes-2023.pdf`,
      taille_octets: 456789,
      date_document: monthsAgo(15),
      retention_jusqu_au: daysFromNow(365 * 10),
      created_by: syndicId,
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      type: 'contrat',
      nom: 'Contrat syndic 2023-2025 — Cabinet Martin',
      fichier_url: `archives/${cabinetId}/${coproprieteId}/contrat-syndic-2023-2025.pdf`,
      taille_octets: 312000,
      date_document: monthsAgo(24),
      retention_jusqu_au: daysFromNow(365 * 5),
      created_by: syndicId,
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      type: 'sinistre',
      nom: 'Dossier sinistre dégât des eaux 2024 — Lot A03',
      fichier_url: `archives/${cabinetId}/${coproprieteId}/sinistre-degat-eaux-2024.pdf`,
      taille_octets: 892000,
      date_document: monthsAgo(12),
      retention_jusqu_au: daysFromNow(365 * 5),
      created_by: syndicId,
    },
    {
      cabinet_id: cabinetId,
      copropriete_id: coproprieteId,
      type: 'reglement',
      nom: 'Règlement de copropriété original 1998',
      fichier_url: `archives/${cabinetId}/${coproprieteId}/reglement-original-1998.pdf`,
      taille_octets: 1234567,
      date_document: new Date('1998-06-15').toISOString(),
      retention_jusqu_au: daysFromNow(365 * 30),
      created_by: syndicId,
    },
  ])

  if (archErr) err('Erreur archives', archErr)
  else log('5 archives créées')

  // ─── Résumé ───────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════')
  console.log('  ✅ Seed Partie 2 terminé !')
  console.log('══════════════════════════════════════════════')
  console.log('\n  Ajouté :')
  console.log('  • 5 prestataires (plombier, électricien, ascensoriste, jardinier, peintre)')
  console.log("  • 6 entrées carnet d'entretien")
  console.log('  • 8 documents (PV AG, budget, contrats, sinistres...)')
  console.log('  • Budget 2025 (approuvé) + Budget 2026 (validé) avec lignes')
  console.log('  • Fonds travaux + 5 mouvements historiques')
  console.log('  • Devis sinistres (5 devis) + intervenants (4)')
  console.log('  • Paramètres de relance automatique')
  console.log('  • 3 dossiers travaux (ravalement, LED, toiture)')
  console.log("  • 4 clés/accès")
  console.log('  • 5 obligations légales')
  console.log('  • 5 archives légales')
  console.log('')
}

main().catch(e => {
  console.error('❌ Erreur fatale :', e)
  process.exit(1)
})
