import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Bots généraux
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/coproprietes',
          '/assemblees',
          '/coproprietaires',
          '/appels-charges',
          '/sinistres',
          '/travaux',
          '/documents',
          '/agenda',
          '/ia',
          '/parametres',
          '/facturation',
          '/archives',
          '/api/',
          '/admin',
          '/accueil',      // portail copropriétaire
          '/mes-charges',
          '/mes-documents',
          '/mes-assemblees',
          '/mes-votes',
          '/mes-messages',
          '/mes-signatures',
          '/mes-travaux',
          '/mon-compte',
          '/mon-calendrier',
          '/onboarding',
          '/reset-password',
        ],
      },
      // ── AI training crawlers — exclure tout ──────────────────────
      { userAgent: 'GPTBot',         disallow: '/' }, // OpenAI
      { userAgent: 'CCBot',          disallow: '/' }, // Common Crawl
      { userAgent: 'anthropic-ai',   disallow: '/' }, // Anthropic
      { userAgent: 'Google-Extended', disallow: '/' }, // Google Bard/Vertex
      { userAgent: 'PerplexityBot',  disallow: '/' }, // Perplexity
      { userAgent: 'Applebot-Extended', disallow: '/' }, // Apple AI
    ],
    sitemap: 'https://coplio.fr/sitemap.xml',
    host: 'https://coplio.fr',
  }
}
