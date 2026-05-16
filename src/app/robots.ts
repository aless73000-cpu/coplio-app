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
        ],
      },
      {
        // GPTBot (OpenAI) — exclure toutes les pages app
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        // CCBot (Common Crawl, utilisé pour entraînement LLM)
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://coplio.fr/sitemap.xml',
    host: 'https://coplio.fr',
  }
}
