export default function TrustBar() {
  const stats = [
    { value: 'Lancement',  label: 'Phase early adopter',     accent: false },
    { value: 'Prix bloqué', label: 'Tarif garanti à vie',    accent: false },
    { value: '14 jours',   label: 'Essai gratuit inclus',    accent: true  },
    { value: '100 % FR',   label: 'Données hébergées en EU', accent: false },
  ]

  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-[11px] font-semibold text-gray-300 uppercase tracking-[0.2em] mb-10">
          Rejoignez les premiers syndics à moderniser leur gestion
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label, accent }) => (
            <div key={label} className="text-center">
              <div
                className="text-2xl font-bold mb-1"
                style={{ letterSpacing: '-0.02em', color: accent ? '#0A3D2B' : '#1D1D1F' }}
              >
                {value}
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
