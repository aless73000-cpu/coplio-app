import { MetadataRoute } from 'next'

const BASE = 'https://coplio.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Pages marketing — priorité haute ─────────────────────────
    {
      url: BASE,
      lastModified: new Date('2026-05-31'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/tarifs`,
      lastModified: new Date('2026-05-31'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/register`,
      lastModified: new Date('2026-05-31'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Note : /login, /portail, /forgot-password et /reset-password exclus du sitemap
    // (faible valeur SEO — ne pas consommer de crawl budget)

    // ── Pages légales ────────────────────────────────────────────
    {
      url: `${BASE}/cgu`,
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/confidentialite`,
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/mentions-legales`,
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
