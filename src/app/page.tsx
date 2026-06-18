import type { Metadata } from 'next'
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

// ISR : la landing (publique, sans cookies/headers) est rendue statiquement et
// régénérée toutes les heures → plus aucune requête DB par visiteur (le compteur
// "offre fondateur" tolère 1h de fraîcheur). Gros gain LCP + charge serveur.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Coplio — Logiciel de gestion de copropriété pour syndics indépendants',
  description:
    'Coplio simplifie la gestion de copropriété pour les syndics indépendants. Portail copropriétaire, AG en ligne, suivi des impayés, sinistres — tout en un. Essai gratuit 30 jours, sans carte bancaire.',
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    url: APP_URL,
    title: 'Coplio — Gestion de copropriété pour syndics indépendants',
    description:
      'Simplifiez votre gestion de copropriété. Portail copropriétaire inclus, AG en ligne, relances automatiques. Essai gratuit 30 jours.',
  },
}

import Nav            from '@/components/landing/Nav'
import { StickyBanner } from '@/components/landing/StickyBanner'
import Hero           from '@/components/landing/Hero'
import TrustBar       from '@/components/landing/TrustBar'
import DemoSection    from '@/components/landing/DemoSection'
import BentoFeatures  from '@/components/landing/BentoFeatures'
import HowItWorks     from '@/components/landing/HowItWorks'
import ProblemSolution from '@/components/landing/ProblemSolution'
import Tarifs         from '@/components/landing/Tarifs'
import QuiSommesNous  from '@/components/landing/QuiSommesNous'
import FAQ            from '@/components/landing/FAQ'
import CtaFinal       from '@/components/landing/CtaFinal'
import Footer         from '@/components/landing/Footer'
import VideoDemo      from '@/components/landing/VideoDemo'

// FeaturesShowcase est chargé via un wrapper Client (Next 15 interdit
// dynamic({ ssr: false }) dans un Server Component).
import FeaturesShowcase from '@/components/landing/FeaturesShowcaseClient'

export default async function LandingPage() {
  // Nombre réel d'abonnés payants (non-trial) pour l'offre fondateur
  let founderTaken = 47 // fallback statique si la requête échoue
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('cabinets')
      .select('id', { count: 'exact', head: true })
      .not('plan', 'eq', 'trial')
      .not('subscription_status', 'in', '("canceled","incomplete_expired")')
    if (count !== null) founderTaken = Math.min(count, 50)
  } catch { /* non bloquant */ }

  return (
    <>
      <SoftwareApplicationJsonLd />
      <div className="min-h-screen bg-white antialiased text-[#1D1D1F]">
        {/* Animations définies dans globals.css — suppression du inline <style> (meilleur LCP) */}
        <Nav />
        <StickyBanner />
        <Hero />
        <TrustBar />
        <VideoDemo />
        <DemoSection />
        <FeaturesShowcase />
        <BentoFeatures />
        <HowItWorks />
        <ProblemSolution />
        <Tarifs founderTaken={founderTaken} />
        <QuiSommesNous />
        <FAQ />
        <CtaFinal />
        <Footer />
      </div>
    </>
  )
}
