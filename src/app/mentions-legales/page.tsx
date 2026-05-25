import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de Coplio — éditeur, hébergeur, responsable de publication.',
  alternates: { canonical: 'https://coplio.fr/mentions-legales' },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-coplio-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-coplio-text font-bold text-xl">Coplio</span>
        </div>

        <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-coplio-text text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="coplio-card prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold text-coplio-text mb-2">Mentions Légales</h1>
          <p className="text-muted-foreground text-sm mb-8">Dernière mise à jour : mai 2026</p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">1. Éditeur du site</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Le site <strong>coplio.fr</strong> est édité par :
            </p>
            <ul className="text-sm text-coplio-text leading-relaxed mt-2 space-y-1">
              <li><strong>Raison sociale :</strong> Coplio SAS</li>
              <li><strong>Forme juridique :</strong> Société par actions simplifiée</li>
              <li><strong>Capital social :</strong> En cours de constitution</li>
              <li><strong>Siège social :</strong> France</li>
              <li><strong>Email :</strong> <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline">contact@coplio.fr</a></li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">2. Directeur de la publication</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Le directeur de la publication est le représentant légal de Coplio SAS.
              Pour tout contact : <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline">contact@coplio.fr</a>
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">3. Hébergement</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Le site est hébergé par :
            </p>
            <ul className="text-sm text-coplio-text leading-relaxed mt-2 space-y-1">
              <li><strong>Vercel Inc.</strong></li>
              <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
              <li><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#111827] hover:underline">vercel.com</a></li>
            </ul>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Les données sont stockées par :
            </p>
            <ul className="text-sm text-coplio-text leading-relaxed mt-2 space-y-1">
              <li><strong>Supabase Inc.</strong> — base de données (région EU West)</li>
              <li><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#111827] hover:underline">supabase.com</a></li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">4. Propriété intellectuelle</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              L&apos;ensemble des éléments constituant le site coplio.fr (textes, graphismes, logiciels, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses) est la propriété exclusive de Coplio SAS ou fait l&apos;objet d&apos;une autorisation d&apos;utilisation.
            </p>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit et sur quelque support que ce soit, est interdite sans l&apos;autorisation préalable et écrite de Coplio SAS.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">5. Protection des données personnelles</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données personnelles.
            </p>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Pour exercer ces droits ou pour toute question relative au traitement de vos données, contactez-nous à <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline">contact@coplio.fr</a>.
            </p>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Pour plus d&apos;informations, consultez notre <Link href="/confidentialite" className="text-[#111827] hover:underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">6. Cookies</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Le site utilise uniquement des cookies strictement nécessaires au fonctionnement de l&apos;authentification (session Supabase). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé sans votre consentement.
            </p>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Les statistiques de visite sont mesurées via Plausible Analytics, outil respectueux de la vie privée ne déposant aucun cookie.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">7. Limitation de responsabilité</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Coplio SAS s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, elle ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à la disposition sur ce site.
            </p>
            <p className="text-sm text-coplio-text leading-relaxed mt-2">
              Coplio SAS se réserve le droit de corriger, à tout moment et sans préavis, le contenu de ce site.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">8. Droit applicable et juridiction</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-coplio-text mb-3">9. Contact</h2>
            <p className="text-sm text-coplio-text leading-relaxed">
              Pour toute question ou réclamation, vous pouvez nous contacter à :<br />
              <a href="mailto:contact@coplio.fr" className="text-[#111827] hover:underline">contact@coplio.fr</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
