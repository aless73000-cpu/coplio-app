import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

export const metadata: Metadata = {
  title: 'Coplio — Logiciel de gestion de copropriété pour syndics indépendants',
  description:
    'Coplio simplifie la gestion de copropriété pour les syndics indépendants. Portail copropriétaire, AG en ligne, suivi des impayés, sinistres — tout en un. Essai gratuit 14 jours, sans carte bancaire.',
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    url: APP_URL,
    title: 'Coplio — Gestion de copropriété pour syndics indépendants',
    description:
      'Simplifiez votre gestion de copropriété. Portail copropriétaire inclus, AG en ligne, relances automatiques. Essai gratuit 14 jours.',
  },
}

import Nav            from '@/components/landing/Nav'
import Hero           from '@/components/landing/Hero'
import TrustBar       from '@/components/landing/TrustBar'
import BentoFeatures  from '@/components/landing/BentoFeatures'
import HowItWorks     from '@/components/landing/HowItWorks'
import ProblemSolution from '@/components/landing/ProblemSolution'
import Tarifs         from '@/components/landing/Tarifs'
import QuiSommesNous  from '@/components/landing/QuiSommesNous'
import FAQ            from '@/components/landing/FAQ'
import CtaFinal       from '@/components/landing/CtaFinal'
import Footer         from '@/components/landing/Footer'

// Hauteur réservée pendant le chargement → évite le CLS (Cumulative Layout Shift)
const FeaturesShowcaseFallback = () => (
  <div className="min-h-[700px] bg-[#F4F2EB]" aria-hidden="true" />
)
const FeaturesShowcase = dynamic(
  () => import('@/components/landing/FeaturesShowcase'),
  { ssr: false, loading: FeaturesShowcaseFallback }
)

export default function LandingPage() {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <div className="min-h-screen bg-white antialiased text-[#1C1C1A]">
        {/* Animations définies dans globals.css — suppression du inline <style> (meilleur LCP) */}
        <Nav />
        <Hero />
        <TrustBar />
        <FeaturesShowcase />
        <BentoFeatures />
        <HowItWorks />
        <ProblemSolution />
        <Tarifs />
        <QuiSommesNous />
        <FAQ />
        <CtaFinal />
        <Footer />
      </div>
    </>
  )
}
