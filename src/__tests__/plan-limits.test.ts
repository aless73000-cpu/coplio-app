/**
 * Tests — Cohérence des limites de plan
 *
 * Vérifie que PLAN_LIMITS (enforcement) et PLANS_CONFIG (UI/landing)
 * sont parfaitement alignés. Tout écart = risque légal (client paie X, obtient Y).
 *
 * Bug corrigé : Starter était à 50 lots dans PLAN_LIMITS vs 75 affiché
 * Bug corrigé : Pro était à 200 lots dans PLAN_LIMITS vs 400 affiché
 */
import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '@/lib/stripe'
import { PLANS_CONFIG } from '@/types'

describe('PLAN_LIMITS vs PLANS_CONFIG — cohérence critique', () => {
  it('Starter : max_lots identique entre enforcement et config UI', () => {
    expect(PLAN_LIMITS.starter.max_lots).toBe(PLANS_CONFIG.starter.max_lots)
  })

  it('Starter : max_gestionnaires identique entre enforcement et config UI', () => {
    expect(PLAN_LIMITS.starter.max_gestionnaires).toBe(PLANS_CONFIG.starter.max_gestionnaires)
  })

  it('Pro : max_lots identique entre enforcement et config UI', () => {
    expect(PLAN_LIMITS.pro.max_lots).toBe(PLANS_CONFIG.pro.max_lots)
  })

  it('Pro : max_gestionnaires identique entre enforcement et config UI', () => {
    expect(PLAN_LIMITS.pro.max_gestionnaires).toBe(PLANS_CONFIG.pro.max_gestionnaires)
  })

  it('Expert : max_lots identique entre enforcement et config UI', () => {
    expect(PLAN_LIMITS.expert.max_lots).toBe(PLANS_CONFIG.expert.max_lots)
  })

  it('Starter est bien limité à 75 lots (valeur commerciale annoncée)', () => {
    expect(PLAN_LIMITS.starter.max_lots).toBe(75)
  })

  it('Pro est bien limité à 400 lots (valeur commerciale annoncée)', () => {
    expect(PLAN_LIMITS.pro.max_lots).toBe(400)
  })

  it('Trial est inférieur ou égal à Starter (trial ne dépasse pas le plan payant)', () => {
    expect(PLAN_LIMITS.trial.max_lots).toBeLessThanOrEqual(PLAN_LIMITS.starter.max_lots)
    expect(PLAN_LIMITS.trial.max_gestionnaires).toBeLessThanOrEqual(PLAN_LIMITS.starter.max_gestionnaires)
  })

  it('les plans sont en ordre croissant de capacité', () => {
    expect(PLAN_LIMITS.starter.max_lots).toBeLessThan(PLAN_LIMITS.pro.max_lots)
    expect(PLAN_LIMITS.pro.max_lots).toBeLessThan(PLAN_LIMITS.expert.max_lots)
    expect(PLAN_LIMITS.starter.max_gestionnaires).toBeLessThanOrEqual(PLAN_LIMITS.pro.max_gestionnaires)
    expect(PLAN_LIMITS.pro.max_gestionnaires).toBeLessThanOrEqual(PLAN_LIMITS.expert.max_gestionnaires)
  })

  it('tous les plans ont des valeurs positives', () => {
    for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
      expect(limits.max_lots, `${plan}.max_lots doit être > 0`).toBeGreaterThan(0)
      expect(limits.max_gestionnaires, `${plan}.max_gestionnaires doit être > 0`).toBeGreaterThan(0)
    }
  })
})
