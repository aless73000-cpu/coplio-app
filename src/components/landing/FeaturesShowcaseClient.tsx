'use client'

import dynamic from 'next/dynamic'

// Skeleton animé qui imite la structure de FeaturesShowcase.
// Fixe le même height que le composant réel pour éviter le CLS,
// mais donne un signal visuel de chargement plutôt qu'un grand vide blanc.
function FeaturesShowcaseFallback() {
  return (
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
            <div key={i} className="h-9 bg-gray-200 rounded-xl" style={{ width: w * 4 }} />
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
}

// ssr: false est autorisé ici car ce wrapper est un Client Component (Next 15)
const FeaturesShowcase = dynamic(
  () => import('@/components/landing/FeaturesShowcase'),
  { ssr: false, loading: FeaturesShowcaseFallback }
)

export default function FeaturesShowcaseClient() {
  return <FeaturesShowcase />
}
