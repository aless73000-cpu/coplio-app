/**
 * Tests — Régularisation des charges (Loi 1965 art. 14-1)
 *
 * Clôture d'exercice : ventilation du réel par lot + solde vs provisions.
 * Test de NON-RÉGRESSION : du code mort a été retiré de calculerRegularisations
 * (le calcul par lot reste celui de resultatsFinaux). Un bug ici = mauvais
 * remboursement / appel de fonds aux copropriétaires.
 */
import { describe, it, expect } from 'vitest'
import {
  calculerRegularisations,
  validerEquilibre,
  type LigneBudget,
  type LotExercice,
  type TantièmesParCle,
} from '@/lib/charges-regularisation'

const DEBUT = new Date(2023, 0, 1)
const FIN = new Date(2023, 11, 31)

const lignes: LigneBudget[] = [
  { id: 'l1', poste: 'Eau', categorie: 'general', cle_repartition: 'general', montant_previsionnel: 1000, montant_reel: 1200 },
]

function lot(overrides: Partial<LotExercice>): LotExercice {
  return {
    lot_id: 'lot-A',
    coproprietaire_id: 'copro-A',
    tantiemes: 500,
    copropriete_id: 'c1',
    montant_provisionnel_encaisse: 0,
    date_entree: DEBUT,
    date_sortie: FIN,
    ...overrides,
  }
}

describe('calculerRegularisations — détention pleine année', () => {
  it('ventile le réel selon les tantièmes et calcule le solde (trop-perçu)', () => {
    const tantiemes: TantièmesParCle = { general: { tantiemes_lot: 100, tantiemes_totaux_cle: 1000 } }
    const [res] = calculerRegularisations(
      lignes,
      [lot({ montant_provisionnel_encaisse: 130 })],
      tantiemes,
      DEBUT, FIN,
    )
    expect(res.montant_reel_ventile).toBe(120) // quotePart(1200, 100, 1000)
    expect(res.prorata_fraction).toBe(1)
    expect(res.solde).toBe(10) // 130 encaissé - 120 dû → trop-perçu à rembourser
  })

  it('solde négatif = complément dû par le copropriétaire', () => {
    const tantiemes: TantièmesParCle = { general: { tantiemes_lot: 100, tantiemes_totaux_cle: 1000 } }
    const [res] = calculerRegularisations(
      lignes, [lot({ montant_provisionnel_encaisse: 100 })], tantiemes, DEBUT, FIN,
    )
    expect(res.solde).toBe(-20) // 100 - 120
  })

  it('ignore les clés de répartition sans tantièmes (pas de crash)', () => {
    const tantiemes: TantièmesParCle = {} // clé 'general' absente
    const [res] = calculerRegularisations(lignes, [lot({})], tantiemes, DEBUT, FIN)
    expect(res.montant_reel_ventile).toBe(0)
    expect(res.detail_par_poste).toHaveLength(0)
  })
})

describe('calculerRegularisations — prorata mutation', () => {
  it('applique le prorata temporis si le lot change de mains en cours d\'année', () => {
    const tantiemes: TantièmesParCle = { general: { tantiemes_lot: 100, tantiemes_totaux_cle: 1000 } }
    // Détenu seulement du 1er janv au 30 juin (~moitié de l'année)
    const [res] = calculerRegularisations(
      lignes,
      [lot({ date_entree: DEBUT, date_sortie: new Date(2023, 5, 30), montant_provisionnel_encaisse: 0 })],
      tantiemes, DEBUT, FIN,
    )
    expect(res.prorata_fraction).toBeGreaterThan(0.45)
    expect(res.prorata_fraction).toBeLessThan(0.55)
    // ~60 € au lieu de 120 € (la moitié)
    expect(res.montant_reel_ventile).toBeCloseTo(120 * res.prorata_fraction, 1)
  })
})

describe('validerEquilibre — cohérence comptable', () => {
  it('la somme des quotes-parts égale le réel total → équilibre', () => {
    const tantiemes: TantièmesParCle = { general: { tantiemes_lot: 500, tantiemes_totaux_cle: 1000 } }
    const resultats = calculerRegularisations(
      lignes,
      [
        lot({ lot_id: 'A', tantiemes: 500 }),
        lot({ lot_id: 'B', tantiemes: 500 }),
      ],
      tantiemes, DEBUT, FIN,
    )
    // 2 lots à 500/1000 → chacun quotePart(1200,500,1000)=600 → somme 1200
    const v = validerEquilibre(resultats, 1200)
    expect(v.equilibre).toBe(true)
    expect(v.ecart).toBeLessThan(0.1)
  })

  it('détecte un déséquilibre', () => {
    const tantiemes: TantièmesParCle = { general: { tantiemes_lot: 100, tantiemes_totaux_cle: 1000 } }
    const resultats = calculerRegularisations(lignes, [lot({})], tantiemes, DEBUT, FIN)
    // 1 seul lot (120 €) comparé au total réel 1200 € → déséquilibre attendu
    const v = validerEquilibre(resultats, 1200)
    expect(v.equilibre).toBe(false)
    expect(v.ecart).toBeGreaterThan(1000)
  })
})
