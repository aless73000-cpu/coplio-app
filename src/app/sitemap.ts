import { MetadataRoute } from 'next'

const BASE = 'https://coplio.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // ── Pages marketing — priorité haute ─────────────────────────
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/tarifs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Pages auth ───────────────────────────────────────────────
    {
      url: `${BASE}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/portail`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },

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
