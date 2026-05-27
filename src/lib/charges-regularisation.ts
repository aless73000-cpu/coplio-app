/**
 * ═══════════════════════════════════════════════════════════════
 * CHARGES REGULARISATION ENGINE
 * Loi du 10 juillet 1965, art. 14-1 (régularisation annuelle)
 * Décret du 17 mars 1967, art. 10 (clés de répartition)
 * ═══════════════════════════════════════════════════════════════
 *
 * Processus de clôture d'exercice :
 * 1. Pour chaque ligne de budget, ventiler le montant réel par lot
 *    selon la clé de répartition (tantièmes généraux, spéciaux, etc.)
 * 2. Pour chaque lot, comparer la somme des appels provisionnels
 *    encaissés avec la quote-part réelle des charges
 * 3. Calculer le solde : trop-perçu (à rembourser) ou complément (à réclamer)
 * 4. Gérer le prorata temporis pour les lots ayant changé de propriétaire
 *    en cours d'exercice
 *
 * Module PUR : aucune dépendance DB, testable unitairement.
 */

import { calculerProrata, quotePart } from './prorata'

// ── Types d'entrée ─────────────────────────────────────────────

export interface LigneBudget {
  id: string
  poste: string
  categorie: string
  cle_repartition: string
  montant_previsionnel: number
  /** Montant réel dépensé sur l'exercice — obligatoire pour la régularisation */
  montant_reel: number
}

export interface LotExercice {
  lot_id: string
  coproprietaire_id: string | null
  tantiemes: number
  copropriete_id: string
  /** Somme des appels provisionnels encaissés sur l'exercice pour ce lot */
  montant_provisionnel_encaisse: number
  /** Date d'entrée dans le lot (début d'exercice si détenu depuis le début) */
  date_entree: Date
  /** Date de sortie (fin d'exercice si encore détenu) */
  date_sortie: Date
}

export interface TantièmesParCle {
  [cle_repartition: string]: {
    tantiemes_lot: number
    tantiemes_totaux_cle: number
  }
}

export interface ResultatRegularisation {
  lot_id: string
  coproprietaire_id: string | null
  montant_reel_ventile: number      // quote-part réelle des charges sur l'exercice
  montant_provisionnel: number      // ce qui a été appelé
  solde: number                     // montant_provisionnel - montant_reel_ventile
  // solde > 0 = trop-perçu (à rembourser au copropriétaire)
  // solde < 0 = complément dû par le copropriétaire
  prorata_jours: number
  prorata_fraction: number
  detail_par_poste: Array<{
    ligne_id: string
    poste: string
    cle_repartition: string
    montant_brut: number      // avant prorata
    montant_final: number     // après prorata
  }>
}

// ── Moteur principal ────────────────────────────────────────────

/**
 * Calcule les régularisations pour tous les lots d'un exercice.
 *
 * @param lignes        Lignes de budget avec montants réels
 * @param lots          Lots avec détention sur l'exercice (avec prorata si mutation)
 * @param tantièmesParCle  Tantièmes par clé de répartition (pour les totaux)
 * @param debutExercice    Premier jour de l'exercice
 * @param finExercice      Dernier jour de l'exercice
 */
export function calculerRegularisations(
  lignes: LigneBudget[],
  lots: LotExercice[],
  tantièmesParCle: TantièmesParCle,
  debutExercice: Date,
  finExercice: Date
): ResultatRegularisation[] {
  const joursExercice = Math.round(
    (finExercice.getTime() - debutExercice.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  return lots.map((lot) => {
    // Fraction de détention (prorata temporis)
    const { fraction, joursDetention } = calculerProrata(
      1, // montant factice pour obtenir juste la fraction
      lot.date_entree,
      lot.date_sortie,
      debutExercice,
      finExercice
    )

    let montantReel = 0
    const detailParPoste: ResultatRegularisation['detail_par_poste'] = []

    for (const ligne of lignes) {
      const cle = ligne.cle_repartition
      const tantièmes = tantièmesParCle[cle]

      if (!tantièmes || tantièmes.tantiemes_totaux_cle === 0) continue

      // Quote-part brute selon tantièmes (sans prorata)
      const montantBrut = quotePart(
        ligne.montant_reel,
        tantièmes.tantiemes_lot,
        tantièmes.tantiemes_totaux_cle
      )

      // Appliquer le prorata temporis si le lot n'a pas été détenu toute l'année
      const montantFinal = Math.round(montantBrut * fraction * 100) / 100

      montantReel += montantFinal

      detailParPoste.push({
        ligne_id:        ligne.id,
        poste:           ligne.poste,
        cle_repartition: cle,
        montant_brut:    montantBrut,
        montant_final:   montantFinal,
      })
    }

    const solde = Math.round((lot.montant_provisionnel_encaisse - montantReel) * 100) / 100

    return {
      lot_id:               lot.lot_id,
      coproprietaire_id:    lot.coproprietaire_id,
      montant_reel_ventile: Math.round(montantReel * 100) / 100,
      montant_provisionnel: lot.montant_provisionnel_encaisse,
      solde,
      prorata_jours:        joursDetention,
      prorata_fraction:     Math.round(fraction * 10000) / 10000,
      detail_par_poste:     detailParPoste,
    }
  })
}

/**
 * Valide que la somme des régularisations de tous les lots = montant réel total.
 * Utile pour le contrôle de cohérence avant de notifier les copropriétaires.
 */
export function validerEquilibre(
  resultats: ResultatRegularisation[],
  montantRéelTotal: number
): { equilibre: boolean; ecart: number; message: string } {
  const somme = resultats.reduce((s, r) => s + r.montant_reel_ventile, 0)
  const ecart = Math.abs(Math.round((somme - montantRéelTotal) * 100) / 100)
  const equilibre = ecart < 0.10 // tolérance 10 centimes (arrondis multiples)

  return {
    equilibre,
    ecart,
    message: equilibre
      ? `Équilibre vérifié : somme des quotes-parts = ${somme.toFixed(2)} € (tolérance ±0,10 €)`
      : `Déséquilibre détecté : somme des quotes-parts ${somme.toFixed(2)} € ≠ total réel ${montantRéelTotal.toFixed(2)} € (écart : ${ecart.toFixed(2)} €)`,
  }
}
