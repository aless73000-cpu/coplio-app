import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression gzip/brotli activée
  compress: true,
  // Pas de X-Powered-By header
  poweredByHeader: false,

  // Réduit la taille des server bundles déployés (exclut les fichiers non nécessaires)
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@swc/core-linux-x64-gnu',
      './node_modules/@swc/core-linux-x64-musl',
      './node_modules/esbuild',
      './node_modules/webpack',
    ],
  },

  // Optimisations expérimentales
  experimental: {
    // Optimise les imports de packages (tree-shaking granulaire)
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    // Formats modernes
    formats: ['image/avif', 'image/webp'],
    // Tailles optimisées pour les breakpoints Coplio
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co'
    const supabaseHost = supabaseUrl.replace('https://', '')

    // Content Security Policy
    // Note: 'unsafe-inline' for scripts is required by Next.js (inline hydration scripts).
    // 'unsafe-eval' is removed in production; Next.js 14 no longer requires it.
    const isDev = process.env.NODE_ENV === 'development'
    const csp = [
      `default-src 'self'`,
      // Scripts: self + Stripe + inline (Next.js hydration)
      `script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net${isDev ? " 'unsafe-eval'" : ''}`,
      // Styles: self + inline (Tailwind / CSS-in-JS)
      `style-src 'self' 'unsafe-inline'`,
      // Images: self + Supabase storage + data URIs + blob (optimised images)
      `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co`,
      // Fonts: self only (Inter is self-hosted via next/font)
      `font-src 'self'`,
      // API & WebSocket connections
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com https://generativelanguage.googleapis.com https://sentry.io https://*.sentry.io https://o*.ingest.sentry.io`,
      // Stripe Elements iframe
      `frame-src https://js.stripe.com https://hooks.stripe.com`,
      // Workers (service worker for push)
      `worker-src 'self' blob:`,
      // Manifest
      `manifest-src 'self'`,
      // Prevent embedding in iframes
      `frame-ancestors 'none'`,
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      // Cache long pour les fichiers statiques Next.js (hashed)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache court pour les pages HTML (SSR)
      {
        source: '/((?!_next/static|_next/image|favicon).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
