/**
 * Tests — Inscription (auth register)
 *
 * Vérifie la validation des données d'inscription, le schéma Zod,
 * la logique de quota et la génération de mots de passe temporaires.
 *
 * L'appel réseau à Supabase est mocké dans setup.ts.
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateTempPassword } from '@/lib/passwords'

// ─── Schéma extrait de /api/auth/register/route.ts ───────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  prenom: z.string().min(2),
  nom: z.string().min(2),
  nomCabinet: z.string().min(2),
})

// ─── Tests : validation Zod ───────────────────────────────────

describe('registerSchema — validation des données d\'inscription', () => {
  const valid = {
    email: 'test@cabinet.fr',
    password: 'MotDePasse123',
    prenom: 'Jean',
    nom: 'Dupont',
    nomCabinet: 'Cabinet Dupont',
  }

  it('accepte des données valides', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'pasunemail' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe trop court (< 8 chars)', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'court' })
    expect(result.success).toBe(false)
  })

  it('rejette un prénom trop court (< 2 chars)', () => {
    const result = registerSchema.safeParse({ ...valid, prenom: 'J' })
    expect(result.success).toBe(false)
  })

  it('rejette un nom de cabinet trop court (< 2 chars)', () => {
    const result = registerSchema.safeParse({ ...valid, nomCabinet: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejette si email manquant', () => {
    const { email: _, ...without } = valid
    expect(registerSchema.safeParse(without).success).toBe(false)
  })

  it('accepte un email avec sous-domaine', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'admin@mail.syndic.fr' })
    expect(result.success).toBe(true)
  })

  it('rejette un mot de passe exactement 7 chars', () => {
    const result = registerSchema.safeParse({ ...valid, password: '1234567' })
    expect(result.success).toBe(false)
  })

  it('accepte un mot de passe exactement 8 chars', () => {
    const result = registerSchema.safeParse({ ...valid, password: '12345678' })
    expect(result.success).toBe(true)
  })
})

// ─── Tests : generateTempPassword (lib/passwords.ts) ─────────

describe('generateTempPassword — sécurité et format', () => {
  it('génère exactement 12 caractères', () => {
    expect(generateTempPassword()).toHaveLength(12)
  })

  it('ne contient pas de caractères ambigus (0, O, I, l, 1)', () => {
    // Exécuter 100 fois pour augmenter la confiance
    for (let i = 0; i < 100; i++) {
      const pwd = generateTempPassword()
      expect(pwd).not.toMatch(/[0OIl1]/)
    }
  })

  it('contient au moins une majuscule', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/[A-Z]/)
    }
  })

  it('contient au moins une minuscule', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/[a-z]/)
    }
  })

  it('contient au moins un chiffre', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/[0-9]/)
    }
  })

  it('génère des mots de passe différents à chaque appel (unicité)', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generateTempPassword()))
    // 50 appels doivent produire au moins 49 valeurs uniques
    expect(passwords.size).toBeGreaterThanOrEqual(49)
  })

  it('ne contient que des caractères alphanumériques non ambigus', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/^[A-HJ-NP-Za-hj-km-z2-9]+$/)
    }
  })
})

// ─── Tests : quota (logique plan-guard) ──────────────────────

describe('checkQuota — logique de blocage selon le plan', () => {
  // Logique extraite de plan-guard pour les tests unitaires
  function canRegister(
    trialEndsAt: string | null,
    subscriptionStatus: string,
    plan: string
  ): boolean {
    if (plan === 'trial') {
      if (!trialEndsAt) return false
      return new Date(trialEndsAt) > new Date()
    }
    return subscriptionStatus === 'active'
  }

  it('autorise si trial actif', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(canRegister(futureDate, 'trialing', 'trial')).toBe(true)
  })

  it('bloque si trial expiré', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(canRegister(pastDate, 'trialing', 'trial')).toBe(false)
  })

  it('autorise si abonnement actif', () => {
    expect(canRegister(null, 'active', 'pro')).toBe(true)
  })

  it('bloque si abonnement past_due', () => {
    expect(canRegister(null, 'past_due', 'pro')).toBe(false)
  })

  it('bloque si abonnement annulé', () => {
    expect(canRegister(null, 'canceled', 'starter')).toBe(false)
  })
})
