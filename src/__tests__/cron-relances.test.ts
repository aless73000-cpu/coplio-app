/**
 * Tests — Cron relances impayés
 *
 * Vérifie la logique des paliers J+30 / J+60 / J+90 et les règles
 * d'anti-doublon (pas de renvoi dans les 25 derniers jours).
 *
 * Aucun appel réseau — la logique est extraite en fonctions pures.
 */
import { describe, it, expect } from 'vitest'

// ─── Logique extraite du cron (fonctions pures) ──────────────

const NIVEAUX = [
  { joursMin: 30, joursMax: 59, niveau: 1 },
  { joursMin: 60, joursMax: 89, niveau: 2 },
  { joursMin: 90, joursMax: 999, niveau: 3 },
] as const

type Niveau = 1 | 2 | 3

function getPalier(joursDepuisEcheance: number): { niveau: Niveau } | null {
  return NIVEAUX.find(n =>
    joursDepuisEcheance >= n.joursMin && joursDepuisEcheance <= n.joursMax
  ) ?? null
}

interface AppelCharges {
  nb_relances: number
  derniere_relance_at: string | null
}

function shouldSendRelance(
  appel: AppelCharges,
  joursDepuisEcheance: number,
  today: Date
): { send: boolean; reason?: string } {
  const palier = getPalier(joursDepuisEcheance)

  if (!palier) return { send: false, reason: 'hors palier' }

  // Ne pas envoyer si déjà relancé dans les 25 derniers jours
  if (appel.derniere_relance_at) {
    const derniereRelance = new Date(appel.derniere_relance_at)
    const joursDepuisRelance = Math.floor(
      (today.getTime() - derniereRelance.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (joursDepuisRelance < 25) return { send: false, reason: 'relancé récemment' }
  }

  // Ne pas envoyer un niveau inférieur à ce qui a déjà été envoyé
  if ((appel.nb_relances ?? 0) >= palier.niveau) {
    return { send: false, reason: 'niveau déjà envoyé' }
  }

  return { send: true }
}

const TODAY = new Date('2026-06-01T08:00:00Z')

// ─── Tests : getPalier ────────────────────────────────────────

describe('getPalier — détection du palier selon les jours écoulés', () => {
  it('J+29 → pas de palier (trop tôt)', () => {
    expect(getPalier(29)).toBeNull()
  })

  it('J+30 → palier 1', () => {
    expect(getPalier(30)?.niveau).toBe(1)
  })

  it('J+45 → palier 1', () => {
    expect(getPalier(45)?.niveau).toBe(1)
  })

  it('J+59 → palier 1 (dernier jour)', () => {
    expect(getPalier(59)?.niveau).toBe(1)
  })

  it('J+60 → palier 2', () => {
    expect(getPalier(60)?.niveau).toBe(2)
  })

  it('J+75 → palier 2', () => {
    expect(getPalier(75)?.niveau).toBe(2)
  })

  it('J+89 → palier 2 (dernier jour)', () => {
    expect(getPalier(89)?.niveau).toBe(2)
  })

  it('J+90 → palier 3', () => {
    expect(getPalier(90)?.niveau).toBe(3)
  })

  it('J+365 → palier 3 (très en retard)', () => {
    expect(getPalier(365)?.niveau).toBe(3)
  })
})

// ─── Tests : shouldSendRelance — règle d'envoi ────────────────

describe('shouldSendRelance — logique complète d\'envoi', () => {
  it('envoie niveau 1 à J+30 si aucune relance précédente', () => {
    const result = shouldSendRelance(
      { nb_relances: 0, derniere_relance_at: null },
      30,
      TODAY
    )
    expect(result.send).toBe(true)
  })

  it('envoie niveau 2 à J+60 si niveau 1 déjà envoyé il y a 30 jours', () => {
    const result = shouldSendRelance(
      { nb_relances: 1, derniere_relance_at: '2026-05-02T08:00:00Z' },
      60,
      TODAY
    )
    expect(result.send).toBe(true)
  })

  it('n\'envoie pas si déjà relancé il y a 10 jours (< 25j)', () => {
    const result = shouldSendRelance(
      { nb_relances: 1, derniere_relance_at: '2026-05-22T08:00:00Z' },
      40,
      TODAY
    )
    expect(result.send).toBe(false)
    expect(result.reason).toBe('relancé récemment')
  })

  it('n\'envoie pas le niveau 1 si déjà envoyé (nb_relances >= 1)', () => {
    const result = shouldSendRelance(
      { nb_relances: 1, derniere_relance_at: '2026-04-01T08:00:00Z' },
      35,
      TODAY
    )
    expect(result.send).toBe(false)
    expect(result.reason).toBe('niveau déjà envoyé')
  })

  it('n\'envoie pas si hors palier (J+15)', () => {
    const result = shouldSendRelance(
      { nb_relances: 0, derniere_relance_at: null },
      15,
      TODAY
    )
    expect(result.send).toBe(false)
    expect(result.reason).toBe('hors palier')
  })

  it('envoie niveau 3 à J+90 si niveaux 1 et 2 déjà envoyés', () => {
    const result = shouldSendRelance(
      { nb_relances: 2, derniere_relance_at: '2026-04-15T08:00:00Z' },
      92,
      TODAY
    )
    expect(result.send).toBe(true)
  })

  it('ne renvoie pas niveau 3 si déjà envoyé', () => {
    const result = shouldSendRelance(
      { nb_relances: 3, derniere_relance_at: '2026-03-01T08:00:00Z' },
      150,
      TODAY
    )
    expect(result.send).toBe(false)
    expect(result.reason).toBe('niveau déjà envoyé')
  })

  it('la fenêtre anti-doublon est strictement inférieure à 25 jours', () => {
    // Il y a exactement 24 jours → ne doit pas envoyer (24 < 25)
    const relanceDate24j = new Date(TODAY)
    relanceDate24j.setDate(relanceDate24j.getDate() - 24)

    const result24j = shouldSendRelance(
      { nb_relances: 1, derniere_relance_at: relanceDate24j.toISOString() },
      60,
      TODAY
    )
    expect(result24j.send).toBe(false)
    expect(result24j.reason).toBe('relancé récemment')

    // Il y a exactement 25 jours → doit envoyer (25 n'est PAS < 25)
    const relanceDate25j = new Date(TODAY)
    relanceDate25j.setDate(relanceDate25j.getDate() - 25)

    const result25j = shouldSendRelance(
      { nb_relances: 1, derniere_relance_at: relanceDate25j.toISOString() },
      60,
      TODAY
    )
    expect(result25j.send).toBe(true)
  })
})
