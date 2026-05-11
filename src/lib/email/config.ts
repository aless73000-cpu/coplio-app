// ═══════════════════════════════════════════════════════════════
// COPLIO — Email config
// Centralise toutes les constantes liées à l'email.
// ═══════════════════════════════════════════════════════════════

export const EMAIL_CONFIG = {
  // ─── Expéditeurs ─────────────────────────────────────────────
  from: {
    /** Email principal de la plateforme */
    default: `Coplio <${process.env.RESEND_FROM_EMAIL ?? 'noreply@coplio.fr'}>`,
    /** Support humain pour les réponses */
    support: `Coplio Support <support@coplio.fr>`,
    /** Facturation / paiements */
    billing: `Coplio Facturation <billing@coplio.fr>`,
    /** Alertes système (no-reply strict) */
    noreply: `Coplio <noreply@coplio.fr>`,
  },

  // ─── Retry ───────────────────────────────────────────────────
  retry: {
    maxAttempts: 3,
    /** Délais en ms entre chaque tentative (backoff exponentiel) */
    delays: [500, 1500, 4000],
  },

  // ─── Rate limiting (par destinataire) ────────────────────────
  // Note : en serverless (Vercel), le rate limiting in-process ne
  // persiste pas entre les invocations. Pour la production à fort
  // volume, utiliser Upstash Redis avec @upstash/ratelimit.
  rateLimit: {
    /** Max emails au même destinataire par fenêtre */
    maxPerWindow: 5,
    /** Durée de la fenêtre en millisecondes (1 heure) */
    windowMs: 60 * 60 * 1000,
  },

  // ─── Timeouts ────────────────────────────────────────────────
  timeoutMs: 10_000,

  // ─── Environnement ────────────────────────────────────────────
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  /**
   * En dev, si cette variable est définie, tous les emails sont
   * redirigés vers cette adresse au lieu du vrai destinataire.
   */
  devOverrideEmail: process.env.EMAIL_DEV_OVERRIDE ?? null,

  // ─── Branding ────────────────────────────────────────────────
  brand: {
    name: 'Coplio',
    primaryColor: '#0F6E56',
    lightColor: '#E1F5EE',
    bgColor: '#F1EFE8',
    textColor: '#444441',
    mutedColor: '#888888',
    borderColor: '#e5e5e5',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr',
    logoUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'}/icons/icon-192.png`,
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'}/unsubscribe`,
    privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'}/confidentialite`,
    supportEmail: 'support@coplio.fr',
  },
} as const
