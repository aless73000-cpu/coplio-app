import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Bots généraux
        userAgent: '*',
        allow: '/',
        disallow: [
          // ── Espace syndic ────────────────────────────────────────
          '/dashboard',
          '/coproprietes',
          '/coproprietaires',
          '/appels-charges',
          '/messages',
          '/sinistres',
          '/documents',
          '/assemblees',
          '/impayes',
          '/agenda',
          '/comptabilite',
          '/prestataires',
          '/ia',
          '/votes',
          '/relances-config',
          '/archives',
          '/signatures',
          '/carnet-entretien',
          '/equipe',
          '/notifications',
          '/travaux',
          '/parametres',
          '/facturation',
          '/importer',
          '/modeles',
          '/lots',
          // ── Espace portail copropriétaire ─────────────────────────
          '/accueil',
          '/mes-charges',
          '/mes-documents',
          '/mes-assemblees',
          '/mes-votes',
          '/mes-messages',
          '/mes-signatures',
          '/mes-travaux',
          '/mes-contacts',
          '/mes-notifications',
          '/mon-compte',
          '/mon-calendrier',
          '/signaler',
          '/espace-conseil',
          // ── Auth & système ────────────────────────────────────────
          '/onboarding',
          '/reset-password',
          '/api/',
          '/admin',
        ],
      },
      // ── AI training crawlers — exclure tout ──────────────────────
      { userAgent: 'GPTBot',            disallow: '/' }, // OpenAI
      { userAgent: 'CCBot',             disallow: '/' }, // Common Crawl
      { userAgent: 'anthropic-ai',      disallow: '/' }, // Anthropic
      { userAgent: 'Google-Extended',   disallow: '/' }, // Google Bard/Vertex
      { userAgent: 'PerplexityBot',     disallow: '/' }, // Perplexity
      { userAgent: 'Applebot-Extended', disallow: '/' }, // Apple AI
      { userAgent: 'Bytespider',        disallow: '/' }, // ByteDance/TikTok
      { userAgent: 'Diffbot',           disallow: '/' }, // Diffbot
      { userAgent: 'omgili',            disallow: '/' }, // Webz.io
    ],
    sitemap: 'https://coplio.fr/sitemap.xml',
    host: 'https://coplio.fr',
  }
}
