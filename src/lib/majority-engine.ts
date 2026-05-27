/**
 * ═══════════════════════════════════════════════════════════════
 * MAJORITY ENGINE — Moteur de calcul des majorités AG
 * Loi du 10 juillet 1965 (Art. 24, 25, 25-1, 26) + Unanimité
 * ═══════════════════════════════════════════════════════════════
 *
 * Ce module est la source de vérité pour le calcul des résultats
 * de vote en AG. Il est PUR (aucune dépendance externe, testable
 * unitairement) et ne fait aucun accès DB.
 *
 * BASES DE CALCUL :
 *   Art. 24  → tantièmes des présents + représentés (tantiemes_presents)
 *   Art. 25  → tous les tantièmes de la copropriété (tantiemes_totaux)
 *   Art. 25-1 → passerelle Art. 25 → Art. 24 si ≥ 1/3 des tantièmes totaux
 *   Art. 26  → double majorité : nb copropriétaires + 2/3 des tantièmes totaux
 *   Unanimité → aucune voix contre, aucune abstention
 */

export type VoteType = 'art_24' | 'art_25' | 'art_26' | 'unanimite'

export interface MajorityInput {
  /** Type de majorité défini sur la résolution */
  type_vote: VoteType

  /** Tantièmes cumulés des votes POUR (somme multi-lots par copropriétaire) */
  tantiemes_pour: number
  /** Tantièmes cumulés des votes CONTRE */
  tantiemes_contre: number

  /** Nombre de copropriétaires ayant voté POUR (1 par copropriétaire, pas par lot) */
  voix_pour: number
  /** Nombre de copropriétaires ayant voté CONTRE */
  voix_contre: number
  /** Nombre de copropriétaires s'étant abstenus */
  voix_abstention: number

  /**
   * Tantièmes des copropriétaires présents, représentés ou votants par correspondance.
   * Base de calcul pour Art. 24.
   * Correspond à assemblees_generales.tantiemes_presents.
   */
  tantiemes_presents: number

  /**
   * Tantièmes totaux de la copropriété (toutes les parties).
   * Base de calcul pour Art. 25 et Art. 26.
   * Correspond à coproprietes."tantièmes_totaux".
   */
  tantiemes_totaux_copropriete: number

  /**
   * Nombre total de copropriétaires dans la copropriété.
   * Utilisé pour la double majorité Art. 26 (condition nb personnes).
   * Correspond à coproprietes.nb_copropriétaires.
   */
  nombre_coproprietaires?: number
}

export interface MajorityResult {
  /** true = résolution adoptée, false = rejetée */
  adoptee: boolean

  /**
   * true si la résolution Art. 25 n'est pas adoptée mais obtient ≥ 1/3 des
   * tantièmes totaux → doit être immédiatement resoumise au vote Art. 24
   * lors de la même AG (Art. 25-1 Loi 1965).
   */
  passerelle_25_1: boolean

  /** Explication lisible du résultat */
  raison: string

  /** Détail des chiffres pour affichage/audit */
  details: {
    type_vote: VoteType
    base_calcul: number
    seuil: number
    obtenu: number
    seuil_passerelle?: number  // pour Art. 25 : seuil du 1/3
  }
}

/**
 * Calcule si une résolution est adoptée selon le type de majorité.
 * Appeler après chaque vote pour mettre à jour ag_resolutions.adoptee.
 */
export function calculateMajority(input: MajorityInput): MajorityResult {
  const {
    type_vote,
    tantiemes_pour,
    voix_pour,
    voix_contre,
    voix_abstention,
    tantiemes_presents,
    tantiemes_totaux_copropriete,
    nombre_coproprietaires = 0,
  } = input

  // Garde-fou : éviter les divisions par zéro
  if (tantiemes_totaux_copropriete === 0) {
    return {
      adoptee: false,
      passerelle_25_1: false,
      raison: 'Calcul impossible : tantièmes totaux de la copropriété = 0',
      details: { type_vote, base_calcul: 0, seuil: 0, obtenu: 0 },
    }
  }

  switch (type_vote) {
    // ─── Art. 24 ─────────────────────────────────────────────────
    // Majorité des voix des copropriétaires présents, représentés
    // ou ayant voté par correspondance.
    // Adopté si tantiemes_pour > tantiemes_presents / 2
    case 'art_24': {
      const base = tantiemes_presents
      const seuil = base / 2
      const adoptee = tantiemes_pour > seuil

      return {
        adoptee,
        passerelle_25_1: false,
        raison: adoptee
          ? `Art. 24 adopté : ${tantiemes_pour} tantièmes pour > ${seuil} (50% des ${base} tantièmes présents)`
          : `Art. 24 rejeté : ${tantiemes_pour} tantièmes pour ≤ ${seuil} (50% des ${base} tantièmes présents)`,
        details: { type_vote, base_calcul: base, seuil, obtenu: tantiemes_pour },
      }
    }

    // ─── Art. 25 + passerelle 25-1 ───────────────────────────────
    // Majorité absolue de tous les copropriétaires de l'immeuble.
    // Adopté si tantiemes_pour > tantiemes_totaux / 2.
    //
    // Art. 25-1 : si la résolution n'est pas adoptée mais recueille
    // au moins 1/3 des tantièmes totaux → resoumission immédiate en Art. 24.
    case 'art_25': {
      const base = tantiemes_totaux_copropriete
      const seuil = base / 2
      const seuil_passerelle = base / 3
      const adoptee = tantiemes_pour > seuil
      const passerelle_25_1 = !adoptee && tantiemes_pour >= seuil_passerelle

      let raison: string
      if (adoptee) {
        raison = `Art. 25 adopté : ${tantiemes_pour} tantièmes pour > ${seuil.toFixed(0)} (50% des ${base} tantièmes totaux)`
      } else if (passerelle_25_1) {
        raison = `Art. 25 non adopté — passerelle Art. 25-1 déclenchée : ${tantiemes_pour} tantièmes ≥ ${seuil_passerelle.toFixed(0)} (1/3 des tantièmes). Resoumission en Art. 24 obligatoire.`
      } else {
        raison = `Art. 25 rejeté : ${tantiemes_pour} tantièmes pour < ${seuil_passerelle.toFixed(0)} (1/3 des tantièmes totaux — seuil passerelle non atteint)`
      }

      return {
        adoptee,
        passerelle_25_1,
        raison,
        details: { type_vote, base_calcul: base, seuil, obtenu: tantiemes_pour, seuil_passerelle },
      }
    }

    // ─── Art. 26 — Double majorité ───────────────────────────────
    // Exige deux conditions cumulatives :
    //   1. Majorité en nombre : voix_pour > (présents+représentés) / 2
    //   2. Majorité en tantièmes : tantiemes_pour ≥ 2/3 des tantièmes totaux
    case 'art_26': {
      const voix_total = voix_pour + voix_contre + voix_abstention
      const seuil_voix = voix_total / 2
      const seuil_tantiemes = (tantiemes_totaux_copropriete * 2) / 3

      const condition_voix = voix_pour > seuil_voix
      const condition_tantiemes = tantiemes_pour >= seuil_tantiemes
      const adoptee = condition_voix && condition_tantiemes

      const raison = adoptee
        ? `Art. 26 adopté : ${voix_pour} voix > ${seuil_voix.toFixed(1)} (condition 1) ET ${tantiemes_pour} tantièmes ≥ ${seuil_tantiemes.toFixed(0)} (condition 2)`
        : [
            !condition_voix && `condition 1 (voix) non satisfaite : ${voix_pour} voix ≤ ${seuil_voix.toFixed(1)}`,
            !condition_tantiemes && `condition 2 (tantièmes) non satisfaite : ${tantiemes_pour} < ${seuil_tantiemes.toFixed(0)} (2/3 des ${tantiemes_totaux_copropriete} tantièmes totaux)`,
          ].filter(Boolean).join(' — ')

      return {
        adoptee,
        passerelle_25_1: false,
        raison,
        details: { type_vote, base_calcul: tantiemes_totaux_copropriete, seuil: seuil_tantiemes, obtenu: tantiemes_pour },
      }
    }

    // ─── Unanimité ───────────────────────────────────────────────
    // Aucune voix contre, aucune abstention parmi les présents.
    case 'unanimite': {
      const adoptee = voix_contre === 0 && voix_abstention === 0 && voix_pour > 0
      const voix_total = voix_pour + voix_contre + voix_abstention

      return {
        adoptee,
        passerelle_25_1: false,
        raison: adoptee
          ? `Unanimité : ${voix_pour} voix pour, aucune opposition`
          : `Unanimité non atteinte : ${voix_contre} contre, ${voix_abstention} abstentions`,
        details: { type_vote, base_calcul: voix_total, seuil: voix_total, obtenu: voix_pour },
      }
    }

    default:
      return {
        adoptee: false,
        passerelle_25_1: false,
        raison: `Type de vote non reconnu : ${type_vote as string}`,
        details: { type_vote: type_vote as VoteType, base_calcul: 0, seuil: 0, obtenu: 0 },
      }
  }
}

/**
 * Vérifie si le quorum est atteint pour l'ouverture de l'AG.
 * Quorum = tantiemes_presents > tantiemes_totaux / 4 (usage courant).
 * Note : la Loi 1965 ne fixe pas de quorum légal obligatoire pour
 * l'AGO, mais la plupart des règlements de copropriété en prévoient un.
 */
export function checkQuorum(
  tantiemes_presents: number,
  tantiemes_totaux: number,
  quorum_fraction = 0.25 // 25% par défaut
): { atteint: boolean; pourcentage: number; message: string } {
  const pourcentage = tantiemes_totaux > 0 ? (tantiemes_presents / tantiemes_totaux) * 100 : 0
  const seuil = tantiemes_totaux * quorum_fraction
  const atteint = tantiemes_presents >= seuil

  return {
    atteint,
    pourcentage: Math.round(pourcentage * 10) / 10,
    message: atteint
      ? `Quorum atteint : ${pourcentage.toFixed(1)}% des tantièmes présents (seuil : ${(quorum_fraction * 100).toFixed(0)}%)`
      : `Quorum insuffisant : ${pourcentage.toFixed(1)}% des tantièmes présents (seuil : ${(quorum_fraction * 100).toFixed(0)}%)`,
  }
}
