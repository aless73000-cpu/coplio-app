import FAQItem from './FAQItem'

const items = [
  {
    q: "Est-ce que je dois fournir ma carte bancaire pour l'essai gratuit ?",
    a: "Non. Vous démarrez votre essai de 14 jours sans aucune carte bancaire. Vous ne payez que si vous décidez de continuer à l'issue de la période d'essai.",
  },
  {
    q: 'Puis-je importer mes données existantes ?',
    a: 'Oui. Vous pouvez importer vos copropriétaires et vos lots via un fichier CSV. Notre équipe peut aussi vous accompagner gratuitement pour la migration si vous avez un volume important.',
  },
  {
    q: "Que se passe-t-il à la fin de l'essai gratuit ?",
    a: "Vous recevez un rappel 7 jours avant la fin de votre essai. Si vous ne souscrivez pas, votre accès est simplement suspendu — vos données sont conservées 30 jours supplémentaires.",
  },
  {
    q: 'Mes copropriétaires doivent-ils payer pour accéder au portail ?',
    a: 'Non. Le portail copropriétaire est inclus dans tous les plans, sans surcoût. Vos copropriétaires accèdent gratuitement à leur espace personnel.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace. Le changement prend effet immédiatement, avec un ajustement au prorata.',
  },
  {
    q: 'Où sont hébergées mes données ?',
    a: "Toutes vos données sont hébergées en Europe (Union Européenne), en conformité avec le RGPD. Elles ne sont jamais revendues ni partagées avec des tiers.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#111827] uppercase tracking-[0.18em]">FAQ</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">Questions fréquentes</h2>
          <p className="text-gray-500 text-lg">
            Vous ne trouvez pas votre réponse ?{' '}
            <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline font-semibold">
              Écrivez-nous
            </a>
          </p>
        </div>
        <div className="space-y-2">
          {items.map(({ q, a }) => <FAQItem key={q} question={q} answer={a} />)}
        </div>
      </div>
    </section>
  )
}
