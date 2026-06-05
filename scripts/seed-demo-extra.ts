/**
 * COPLIO — Seed démonstration : modules restants
 * Complète le cabinet de démo (demo@coplio.fr) avec les fonctionnalités non
 * couvertes par seed-demo-full.ts :
 *   • Comptabilité : exercices, journaux, écritures équilibrées validées,
 *     factures fournisseurs (+ lignes + paiements), comptes & relevés bancaires
 *   • Locataires : comptes tenant rattachés à un propriétaire + docs visibles
 *   • Équipe : gestionnaires (role manager) du cabinet
 *   • CRM : prospects (pipeline commercial)
 *
 * Prérequis : seed-demo-full.ts exécuté avant.
 * Usage : SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo-extra.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes. Usage :\n  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo-extra.ts')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

function log(m: string) { console.log(`    ✓ ${m}`) }
function section(m: string) { console.log(`\n  ▶ ${m}`) }
function big(m: string) { console.log(`\n${'═'.repeat(62)}\n  ${m}\n${'═'.repeat(62)}`) }

async function ins<T = unknown>(table: string, rows: object | object[], select = false): Promise<T[]> {
  if (select) {
    const { data, error } = await db.from(table).insert(rows as never).select()
    if (error) throw new Error(`[${table}] ${error.message}`)
    return (data ?? []) as T[]
  }
  const { error } = await db.from(table).insert(rows as never)
  if (error) throw new Error(`[${table}] ${error.message}`)
  return []
}

const userCache = new Map<string, string>()
async function loadUsers() {
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
  const ex = userCache.get(email)
  if (ex) return ex
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  userCache.set(email, data.user.id)
  return data.user.id
}

async function main() {
  big('COPLIO — Seed démonstration : modules restants')
  await loadUsers()

  // ── Récupération du cabinet de démo ──────────────────────────────
  const { data: cab } = await db.from('cabinets').select('id').eq('email_contact', 'demo@coplio.fr').maybeSingle()
  if (!cab?.id) { console.error('❌ Cabinet demo@coplio.fr introuvable. Lance seed-demo-full.ts d’abord.'); process.exit(1) }
  const cabinetId = cab.id
  const { data: syndic } = await db.from('profiles').select('id').eq('cabinet_id', cabinetId).eq('role', 'owner').single()
  const syndicId = syndic!.id
  const { data: copros } = await db.from('coproprietes').select('id, nom').eq('cabinet_id', cabinetId).order('created_at')
  const coproList = copros!

  // Garde anti-doublon : si des exercices existent déjà, on stoppe
  const { count: nbEx } = await db.from('exercices').select('id', { count: 'exact', head: true }).in('copropriete_id', coproList.map(c => c.id))
  if ((nbEx ?? 0) > 0) {
    console.error(`\n⚠ Des exercices comptables existent déjà (${nbEx}). Le script extra a déjà tourné — arrêt pour éviter les doublons.`)
    process.exit(1)
  }

  // ── Plan comptable standard (numero → id) ────────────────────────
  const { data: comptes } = await db.from('comptes_comptables').select('id, numero').is('cabinet_id', null)
  const C = (numero: string): string => {
    const c = comptes!.find(x => x.numero === numero)
    if (!c) throw new Error(`Compte ${numero} introuvable dans le plan comptable`)
    return c.id
  }

  // ── CRM Prospects (cabinet) ──────────────────────────────────────
  section('CRM — Prospects')
  await ins('prospects', [
    { cabinet_id: cabinetId, nom: 'Résidence Les Cèdres', adresse: '12 rue Bossuet', ville: 'Lyon', code_postal: '69006', nb_lots: 32, contact_nom: 'M. Rousseau (président CS)', contact_email: 'cs.cedres@example.fr', contact_telephone: '06 11 22 33 44', statut: 'proposition', probabilite: 60, montant_potentiel: 9600, notes: 'Mécontents de leur syndic actuel. Devis envoyé.', prochain_rdv: new Date(Date.now() + 7 * 864e5).toISOString() },
    { cabinet_id: cabinetId, nom: 'Le Hameau du Lac', adresse: '5 allée des Saules', ville: 'Écully', code_postal: '69130', nb_lots: 18, contact_nom: 'Mme Petit', contact_email: 'hameau.lac@example.fr', contact_telephone: '06 22 33 44 55', statut: 'nego', probabilite: 80, montant_potentiel: 6400, notes: 'Négociation honoraires en cours.' },
    { cabinet_id: cabinetId, nom: 'Copropriété Garibaldi', adresse: '88 rue Garibaldi', ville: 'Lyon', code_postal: '69003', nb_lots: 45, contact_nom: 'M. Lemoine', contact_email: 'garibaldi@example.fr', contact_telephone: '06 33 44 55 66', statut: 'contact', probabilite: 30, montant_potentiel: 13500, notes: 'Premier contact pris au salon de la copropriété.' },
    { cabinet_id: cabinetId, nom: 'Villa Montchat', adresse: '3 cours Richard Vitton', ville: 'Lyon', code_postal: '69003', nb_lots: 12, contact_nom: 'Mme Garnier', contact_email: 'villa.montchat@example.fr', contact_telephone: '06 44 55 66 77', statut: 'gagne', probabilite: 100, montant_potentiel: 4800, notes: 'Contrat signé ! Reprise au 1er janvier.' },
    { cabinet_id: cabinetId, nom: 'Le Clos Fleuri', adresse: '21 rue Duguesclin', ville: 'Lyon', code_postal: '69006', nb_lots: 24, contact_nom: 'M. Bernard', contact_email: 'clos.fleuri@example.fr', contact_telephone: '06 55 66 77 88', statut: 'perdu', probabilite: 0, montant_potentiel: 7200, notes: 'A choisi un concurrent moins cher.' },
  ])
  log('5 prospects créés (pipeline lead → gagné/perdu)')

  // ── Équipe — gestionnaires ───────────────────────────────────────
  section('Équipe — gestionnaires')
  const team = [
    { prenom: 'Lucas', nom: 'Bertrand', email: 'lucas.bertrand@horizon-demo.fr' },
    { prenom: 'Emma', nom: 'Rousseau', email: 'emma.rousseau@horizon-demo.fr' },
  ]
  for (const t of team) {
    const id = await getOrCreateUser(t.email, 'Gestion#2026!', { prenom: t.prenom, nom: t.nom, role: 'manager' })
    await db.from('profiles').upsert({
      id, cabinet_id: cabinetId, role: 'manager', prenom: t.prenom, nom: t.nom, email: t.email, onboarding_complete: true,
    }, { onConflict: 'id' })
    log(`Gestionnaire : ${t.prenom} ${t.nom} (${t.email})`)
  }

  // ── Fournisseurs (cabinet) ───────────────────────────────────────
  section('Fournisseurs comptables')
  const fournisseurs = await ins<{ id: string; nom: string }>('fournisseurs', [
    { cabinet_id: cabinetId, nom: 'Plomberie Dupont & Fils', siret: '12345678900011', email: 'compta@plomberie-dupont.fr', telephone: '04 72 23 45 67', ville: 'Lyon', code_postal: '69002', compte_comptable: '401000', delai_paiement: 30, mode_paiement: 'virement', actif: true },
    { cabinet_id: cabinetId, nom: 'Cabinet Horizon Syndic (honoraires)', siret: '99999999900099', email: 'compta@horizon-syndic.fr', ville: 'Lyon', code_postal: '69002', compte_comptable: '401000', delai_paiement: 0, mode_paiement: 'prelevement', actif: true },
    { cabinet_id: cabinetId, nom: 'AXA Assurances', siret: '77788899900022', email: 'pro@axa.fr', ville: 'Paris', code_postal: '75008', compte_comptable: '401000', delai_paiement: 30, mode_paiement: 'prelevement', actif: true },
    { cabinet_id: cabinetId, nom: 'Espaces Verts Rhône', siret: '45678900001344', email: 'compta@ev-rhone.fr', ville: 'Lyon', code_postal: '69009', compte_comptable: '401000', delai_paiement: 45, mode_paiement: 'virement', actif: true },
  ], true)
  const fSyndic = fournisseurs.find(f => f.nom.includes('honoraires'))!
  const fAxa = fournisseurs.find(f => f.nom.includes('AXA'))!
  const fPlomberie = fournisseurs.find(f => f.nom.includes('Plomberie'))!
  log(`${fournisseurs.length} fournisseurs créés`)

  // ── Par copropriété : compta + locataires ────────────────────────
  let tenantCount = 0
  for (let ci = 0; ci < coproList.length; ci++) {
    const copro = coproList[ci]
    big(`COMPTABILITÉ — ${copro.nom}`)
    const coproId = copro.id

    // Lots + propriétaires de la copro (pour locataires)
    const { data: lots } = await db.from('lots').select('id, numero').eq('copropriete_id', coproId)
    const lotByNum = new Map(lots!.map(l => [l.numero, l.id]))

    // Exercices
    const [ex2025] = await ins<{ id: string }>('exercices', { copropriete_id: coproId, annee: 2025, date_debut: '2025-01-01', date_fin: '2025-12-31', statut: 'cloture', date_cloture: '2026-02-28' }, true)
    const [ex2026] = await ins<{ id: string }>('exercices', { copropriete_id: coproId, annee: 2026, date_debut: '2026-01-01', date_fin: '2026-12-31', statut: 'en_cours' }, true)
    log('Exercices 2025 (clôturé) + 2026 (en cours)')

    // Journaux
    const journaux = await ins<{ id: string; code: string }>('journaux', [
      { copropriete_id: coproId, code: 'AC', libelle: 'Achats', type_journal: 'achats' },
      { copropriete_id: coproId, code: 'BQ', libelle: 'Banque', type_journal: 'banque', compte_contrepartie: '512100' },
      { copropriete_id: coproId, code: 'OD', libelle: 'Opérations diverses', type_journal: 'operations_diverses' },
      { copropriete_id: coproId, code: 'AN', libelle: 'À-nouveaux', type_journal: 'a_nouveau' },
    ], true)
    const J = (code: string) => journaux.find(j => j.code === code)!.id
    log('Journaux AC / BQ / OD / AN')

    // Helper : écriture équilibrée validée
    type Ligne = { compte: string; debit?: number; credit?: number; libelle?: string }
    async function ecriture(journalCode: string, date: string, libelle: string, piece: string, lignes: Ligne[], factureId?: string) {
      const [e] = await ins<{ id: string }>('ecritures_comptables', {
        copropriete_id: coproId, journal_id: J(journalCode), exercice_id: ex2026.id,
        date_ecriture: date, numero_piece: piece, libelle, statut: 'brouillon', created_by: syndicId,
        ...(factureId ? { facture_id: factureId } : {}),
      }, true)
      await ins('lignes_ecriture', lignes.map((l, i) => ({
        ecriture_id: e.id, compte_id: C(l.compte), libelle: l.libelle ?? libelle,
        debit: l.debit ?? 0, credit: l.credit ?? 0, ordre: i,
      })))
      const { error } = await db.from('ecritures_comptables').update({ statut: 'valide' }).eq('id', e.id)
      if (error) throw new Error(`valider écriture: ${error.message}`)
      return e.id
    }

    // 1. Appel de provisions T1 2026 (OD)
    await ecriture('OD', '2026-01-05', 'Appel de provisions sur charges générales T1 2026', 'AP-2026-T1', [
      { compte: '450100', debit: 18000, libelle: 'Copropriétaires — appel T1' },
      { compte: '7020', credit: 18000, libelle: 'Provisions charges générales' },
    ])

    // 2. Encaissement charges (BQ)
    await ecriture('BQ', '2026-01-20', 'Encaissement appels de charges T1', 'BQ-2026-001', [
      { compte: '512100', debit: 15600, libelle: 'Virements reçus copropriétaires' },
      { compte: '450100', credit: 15600, libelle: 'Règlement copropriétaires' },
    ])

    // 3. Facture honoraires syndic (AC) + facture + paiement
    const honoHt = 1500, honoTva = +(honoHt * 0.2).toFixed(2), honoTtc = +(honoHt * 1.2).toFixed(2)
    const [factHono] = await ins<{ id: string }>('factures', {
      copropriete_id: coproId, fournisseur_id: fSyndic.id, exercice_id: ex2026.id,
      numero_facture: `HONO-2026-${ci + 1}`, type_document: 'facture', date_document: '2026-01-31',
      date_echeance: '2026-02-28', montant_ht: honoHt, taux_tva: 20, montant_tva: honoTva, montant_ttc: honoTtc,
      compte_charge_id: C('6222'), statut: 'paye', libelle: 'Honoraires de gestion T1 2026', created_by: syndicId,
    }, true)
    await ins('lignes_facture', { facture_id: factHono.id, description: 'Honoraires de gestion courante T1 2026', quantite: 1, prix_unitaire_ht: honoHt, taux_tva: 20, montant_ht: honoHt, montant_tva: honoTva, montant_ttc: honoTtc, compte_charge_id: C('6222'), ordre: 0 })
    const ecrHono = await ecriture('AC', '2026-01-31', 'Facture honoraires syndic T1', `HONO-2026-${ci + 1}`, [
      { compte: '6222', debit: honoHt, libelle: 'Honoraires syndic' },
      { compte: '4456', debit: honoTva, libelle: 'TVA déductible' },
      { compte: '401000', credit: honoTtc, libelle: 'Fournisseur syndic' },
    ], factHono.id)
    await ins('paiements_facture', { facture_id: factHono.id, date_paiement: '2026-02-05', montant: honoTtc, mode_paiement: 'prelevement', reference: 'PREL-HONO', ecriture_id: ecrHono })
    // Paiement fournisseur (BQ)
    await ecriture('BQ', '2026-02-05', 'Paiement honoraires syndic', 'BQ-2026-002', [
      { compte: '401000', debit: honoTtc, libelle: 'Règlement fournisseur' },
      { compte: '512100', credit: honoTtc, libelle: 'Virement émis' },
    ])

    // 4. Facture assurance (AC, non encore payée)
    const assHt = 3500, assTva = +(assHt * 0.2).toFixed(2), assTtc = +(assHt * 1.2).toFixed(2)
    const [factAss] = await ins<{ id: string }>('factures', {
      copropriete_id: coproId, fournisseur_id: fAxa.id, exercice_id: ex2026.id,
      numero_facture: `AXA-2026-${1000 + ci}`, type_document: 'facture', date_document: '2026-03-01',
      date_echeance: '2026-03-31', montant_ht: assHt, taux_tva: 20, montant_tva: assTva, montant_ttc: assTtc,
      compte_charge_id: C('616'), statut: 'comptabilise', libelle: 'Prime assurance multirisque immeuble', created_by: syndicId,
    }, true)
    await ins('lignes_facture', { facture_id: factAss.id, description: 'Prime annuelle multirisque immeuble', quantite: 1, prix_unitaire_ht: assHt, taux_tva: 20, montant_ht: assHt, montant_tva: assTva, montant_ttc: assTtc, compte_charge_id: C('616'), ordre: 0 })
    await ecriture('AC', '2026-03-01', 'Facture assurance immeuble', `AXA-2026-${1000 + ci}`, [
      { compte: '616', debit: assHt, libelle: 'Prime assurance' },
      { compte: '4456', debit: assTva, libelle: 'TVA déductible' },
      { compte: '401000', credit: assTtc, libelle: 'Fournisseur AXA' },
    ], factAss.id)

    // 5. Facture plomberie (entretien) reçue
    const ploHt = 420, ploTva = +(ploHt * 0.2).toFixed(2), ploTtc = +(ploHt * 1.2).toFixed(2)
    const [factPlo] = await ins<{ id: string }>('factures', {
      copropriete_id: coproId, fournisseur_id: fPlomberie.id, exercice_id: ex2026.id,
      numero_facture: `PLB-2026-${ci + 1}`, type_document: 'facture', date_document: '2026-02-15',
      date_echeance: '2026-03-15', montant_ht: ploHt, taux_tva: 20, montant_tva: ploTva, montant_ttc: ploTtc,
      compte_charge_id: C('6151'), statut: 'recu', libelle: 'Réparation colonne montante', created_by: syndicId,
    }, true)
    await ins('lignes_facture', { facture_id: factPlo.id, description: 'Remplacement vanne + main d’œuvre', quantite: 1, prix_unitaire_ht: ploHt, taux_tva: 20, montant_ht: ploHt, montant_tva: ploTva, montant_ttc: ploTtc, compte_charge_id: C('6151'), ordre: 0 })
    log('5 écritures validées + 3 factures (payée / comptabilisée / reçue) + paiement')

    // 6. Compte bancaire + relevé
    const [cb] = await ins<{ id: string }>('comptes_bancaires', {
      copropriete_id: coproId, compte_id: C('512100'), libelle: 'Compte courant syndic', iban: `FR76 3000 4000 010${ci} 0000 0000 ${100 + ci}`, bic: 'BNPAFRPP', banque: 'BNP Paribas', solde_initial: 8000, actif: true,
    }, true)
    const [rel] = await ins<{ id: string }>('releves_bancaires', {
      compte_bancaire_id: cb.id, copropriete_id: coproId, date_debut: '2026-01-01', date_fin: '2026-01-31',
      solde_debut: 8000, solde_fin: 22000, statut: 'en_cours', created_by: syndicId,
    }, true)
    await ins('lignes_releve', [
      { releve_id: rel.id, date_operation: '2026-01-20', libelle: 'VIR COPROPRIETAIRES T1', montant: 15600, statut_lettrage: 'lettre', ordre: 0 },
      { releve_id: rel.id, date_operation: '2026-01-31', libelle: 'PRLV HONORAIRES SYNDIC', montant: -1800, statut_lettrage: 'non_lettre', ordre: 1 },
      { releve_id: rel.id, date_operation: '2026-01-15', libelle: 'FRAIS BANCAIRES', montant: -25, statut_lettrage: 'ignore', ordre: 2 },
    ])
    log('Compte bancaire + relevé (3 opérations)')

    // ── Locataires (2 par copro, sur lots A05 & B03) ───────────────
    section('Locataires')
    for (const lotNum of ['A05', 'B03']) {
      const lotId = lotByNum.get(lotNum)
      if (!lotId) continue
      // propriétaire du lot
      const { data: owner } = await db.from('profiles').select('id').eq('cabinet_id', cabinetId).eq('lot_id', lotId).eq('role', 'owner_resident').maybeSingle()
      if (!owner?.id) continue
      const prenom = lotNum === 'A05' ? 'Léa' : 'Hugo'
      const nom = lotNum === 'A05' ? 'Moreau' : 'Lefèvre'
      const email = `locataire.c${ci + 1}${lotNum.toLowerCase()}@horizon-demo.fr`
      const tid = await getOrCreateUser(email, `Locataire#${ci + 1}${lotNum}!`, { prenom, nom, role: 'tenant' })
      await db.from('profiles').upsert({
        id: tid, cabinet_id: null, role: 'tenant', prenom, nom, email, lot_id: lotId,
        landlord_id: owner.id, onboarding_complete: true,
      }, { onConflict: 'id' })
      tenantCount++
    }
    // Rendre quelques documents visibles aux locataires
    await db.from('documents').update({ visible_locataires: true })
      .eq('copropriete_id', coproId).in('categorie', ['reglement', 'pv_ag'])
    log('2 locataires rattachés + documents rendus visibles aux locataires')
  }

  big('✅ SEED EXTRA TERMINÉ')
  console.log(`\n  • CRM : 5 prospects`)
  console.log(`  • Équipe : 2 gestionnaires (mot de passe Gestion#2026!)`)
  console.log(`  • Comptabilité : exercices, journaux, écritures validées, factures, banque (× ${coproList.length} copros)`)
  console.log(`  • Locataires : ${tenantCount} comptes (portail /portail, mot de passe Locataire#<copro><lot>!)`)
  console.log('')
}

main().catch(e => { console.error('\n❌ ERREUR:', e.message); process.exit(1) })
