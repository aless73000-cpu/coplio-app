'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { Reveal } from './Reveal'

// Mets ton URL Loom ou YouTube ici (ou via env var NEXT_PUBLIC_DEMO_VIDEO_URL)
const DEMO_VIDEO_URL =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? null

// Pour YouTube: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0'
// Pour Loom:    'https://www.loom.com/embed/VIDEO_ID?autoplay=1'

export default function VideoDemo() {
  const [open, setOpen] = useState(false)

  // Si pas de vidéo configurée, n'affiche pas la section
  if (!DEMO_VIDEO_URL) return <VideoDemoPlaceholder />

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3 text-slate-400">
            Démo produit
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#374151] mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Voyez Coplio en 3 minutes
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Un tour rapide des fonctionnalités clés — de l&apos;inscription à la gestion complète d&apos;une copropriété.
          </p>
        </Reveal>

        <Reveal delay={100}>
          {/* Thumbnail cliquable */}
          <button
            onClick={() => setOpen(true)}
            className="w-full aspect-video rounded-2xl overflow-hidden relative group
                       border border-slate-200 shadow-xl shadow-black/[0.06]
                       bg-gradient-to-br from-slate-800 to-slate-900 hover:shadow-2xl
                       transition-all duration-300 hover:-translate-y-0.5 focus:outline-none"
            aria-label="Lancer la vidéo de démonstration"
          >
            {/* Faux screenshot du dashboard */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-2 w-3/4 h-2/3 opacity-20">
                <div className="w-1/4 bg-white/20 rounded-l-lg" />
                <div className="flex-1 space-y-2 pt-2 pr-2">
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-12 bg-white/20 rounded-lg" />
                    ))}
                  </div>
                  <div className="h-24 bg-white/20 rounded-lg mt-4" />
                </div>
              </div>
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Bouton Play */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center
                              shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Play className="w-6 h-6 text-[#374151] ml-1" fill="currentColor" />
              </div>
            </div>

            {/* Label durée */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md">
              ~3 min
            </div>
          </button>
        </Reveal>
      </div>

      {/* Modal vidéo */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <iframe
              src={DEMO_VIDEO_URL}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full
                         flex items-center justify-center text-white transition-colors"
              aria-label="Fermer la vidéo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/** Placeholder affiché quand aucune vidéo n'est configurée */
function VideoDemoPlaceholder() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3 text-slate-400">
            Démo produit
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#374151] mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Voyez Coplio en 3 minutes
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Un tour rapide des fonctionnalités clés — de l&apos;inscription à la gestion complète d&apos;une copropriété.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="w-full aspect-video rounded-2xl overflow-hidden relative
                          border-2 border-dashed border-slate-300 bg-slate-100
                          flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-slate-400 ml-1" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-medium text-sm">Vidéo de démonstration</p>
              <p className="text-slate-400 text-xs mt-1">
                Configurez{' '}
                <code className="bg-slate-200 px-1 rounded text-[11px]">NEXT_PUBLIC_DEMO_VIDEO_URL</code>
                {' '}dans Vercel pour activer cette section
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
