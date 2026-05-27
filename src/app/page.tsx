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
import { StickyBanner } from '@/components/landing/StickyBanner'
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

// Skeleton animé qui imite la structure de FeaturesShowcase.
// Fixe le même height que le composant réel pour éviter le CLS,
// mais donne un signal visuel de chargement plutôt qu'un grand vide blanc.
const FeaturesShowcaseFallback = () => (
  <section className="bg-[#F5F5F7] py-24" aria-hidden="true">
    <div className="max-w-6xl mx-auto px-6 animate-pulse">
      {/* Titre */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="h-4 w-24 bg-gray-300 rounded-full" />
        <div className="h-8 w-72 bg-gray-300 rounded-xl" />
        <div className="h-4 w-56 bg-gray-200 rounded-full" />
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        {[80, 96, 72, 88, 64, 80].map((w, i) => (
          <div key={i} className={`h-9 w-${w} bg-gray-200 rounded-xl`} style={{ width: w * 4 }} />
        ))}
      </div>
      {/* Content area */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  </section>
)
const FeaturesShowcase = dynamic(
  () => import('@/components/landing/FeaturesShowcase'),
  { ssr: false, loading: FeaturesShowcaseFallback }
)

export default function LandingPage() {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <div className="min-h-screen bg-white antialiased text-[#1D1D1F]">
        {/* Animations définies dans globals.css — suppression du inline <style> (meilleur LCP) */}
        <Nav />
        <StickyBanner />
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
