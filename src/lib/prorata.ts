/**
 * ═══════════════════════════════════════════════════════════════
 * PRORATA TEMPORIS — Calcul des parts de charges en cas de mutation
 * Loi du 10 juillet 1965, art. 14-1 — Décret du 17 mars 1967
 * ═══════════════════════════════════════════════════════════════
 *
 * Lors d'une vente en cours d'exercice, les charges sont réparties
 * entre vendeur et acheteur au prorata du nombre de jours de
 * détention dans l'exercice (méthode "au jour le jour").
 *
 * Conventions :
 * - Le jour d'acquisition est attribué à l'ACHETEUR
 * - L'exercice comptable va du 1er janvier au 31 décembre (configurable)
 * - Module PUR : aucune dépendance DB, testable unitairement
 */

/**
 * Calcule le nombre de jours entre deux dates (inclus/exclus).
 * @param debut  Date de début de la période
 * @param fin    Date de fin de la période
 * @returns Nombre de jours (fin incluse - debut incluse)
 */
export function joursEntre(debut: Date, fin: Date): number {
  const msParJour = 1000 * 60 * 60 * 24
  const diffMs = fin.getTime() - debut.getTime()
  return Math.round(diffMs / msParJour) + 1 // +1 : les deux bornes incluses
}

/**
 * Calcule la quote-part d'une charge pour un copropriétaire
 * qui a détenu le lot sur une partie seulement de l'exercice.
 *
 * @param montantAnnuel       Charge totale de l'exercice pour ce lot
 * @param dateEntree          Date d'acquisition du lot (ou 1er jour de l'exercice)
 * @param dateSortie          Date de cession du lot (ou dernier jour de l'exercice)
 * @param debutExercice       Premier jour de l'exercice (défaut: 1er janv.)
 * @param finExercice         Dernier jour de l'exercice (défaut: 31 déc.)
 * @returns
 *   - montant         Quote-part proratisée
 *   - joursDetention  Nombre de jours de détention dans l'exercice
 *   - joursExercice   Durée totale de l'exercice en jours
 *   - fraction        Fraction proratisée (0–1)
 */
export function calculerProrata(
  montantAnnuel: number,
  dateEntree: Date,
  dateSortie: Date,
  debutExercice?: Date,
  finExercice?: Date
): {
  montant: number
  joursDetention: number
  joursExercice: number
  fraction: number
} {
  // Exercice par défaut : année civile de dateEntree
  const annee = dateEntree.getFullYear()
  const debut = debutExercice ?? new Date(annee, 0, 1)   // 1er janvier
  const fin   = finExercice   ?? new Date(annee, 11, 31) // 31 décembre

  // Borner les dates dans l'exercice
  const entreeEffective = dateEntree < debut ? debut : dateEntree
  const sortieEffective = dateSortie > fin   ? fin   : dateSortie

  const joursExercice  = joursEntre(debut, fin)
  const joursDetention = Math.max(0, joursEntre(entreeEffective, sortieEffective))
  const fraction       = joursExercice > 0 ? joursDetention / joursExercice : 0
  const montant        = Math.round(montantAnnuel * fraction * 100) / 100 // arrondi au centime

  return { montant, joursDetention, joursExercice, fraction }
}

/**
 * Ventile une charge annuelle entre vendeur et acheteur lors d'une mutation.
 *
 * @param montantAnnuel     Charge totale pour ce lot sur l'exercice
 * @param dateMutation      Date d'acte notarié (le jour est attribué à l'acheteur)
 * @param anneeExercice     Année de l'exercice (défaut: année de la mutation)
 */
export function ventilerMutation(
  montantAnnuel: number,
  dateMutation: Date,
  anneeExercice?: number
): {
  partVendeur:   { montant: number; du: Date; au: Date; jours: number; fraction: number }
  partAcheteur:  { montant: number; du: Date; au: Date; jours: number; fraction: number }
  total: number
  controle: boolean // true si partVendeur + partAcheteur ≈ montantAnnuel (arrondi)
} {
  const annee  = anneeExercice ?? dateMutation.getFullYear()
  const debut  = new Date(annee, 0, 1)    // 1er janv
  const fin    = new Date(annee, 11, 31)  // 31 déc

  // Vendeur : du 1er janv au jour AVANT la mutation
  const veilleMutation = new Date(dateMutation)
  veilleMutation.setDate(veilleMutation.getDate() - 1)

  const partVendeur = calculerProrata(montantAnnuel, debut, veilleMutation, debut, fin)

  // Acheteur : du jour de la mutation au 31 déc
  const partAcheteur = calculerProrata(montantAnnuel, dateMutation, fin, debut, fin)

  const total    = Math.round((partVendeur.montant + partAcheteur.montant) * 100) / 100
  const controle = Math.abs(total - montantAnnuel) < 0.02 // tolérance 2 centimes (arrondis)

  return {
    partVendeur: {
      montant:  partVendeur.montant,
      du:       debut,
      au:       veilleMutation,
      jours:    partVendeur.joursDetention,
      fraction: partVendeur.fraction,
    },
    partAcheteur: {
      montant:  partAcheteur.montant,
      du:       dateMutation,
      au:       fin,
      jours:    partAcheteur.joursDetention,
      fraction: partAcheteur.fraction,
    },
    total,
    controle,
  }
}

/**
 * Calcule la quote-part d'une charge pour un lot donné selon sa clé de répartition.
 *
 * @param montantTotal          Montant total de la charge à répartir
 * @param tantièmesLot         Tantièmes du lot concerné
 * @param tantièmesTotaux      Tantièmes totaux de la copropriété (ou de la clé)
 */
export function quotePart(
  montantTotal: number,
  tantièmesLot: number,
  tantièmesTotaux: number
): number {
  if (tantièmesTotaux === 0) return 0
  return Math.round((montantTotal * tantièmesLot / tantièmesTotaux) * 100) / 100
}
