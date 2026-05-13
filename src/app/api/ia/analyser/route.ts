import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string) ?? 'reglement'

  if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop grand (max 5MB)' }, { status: 400 })

  const typeLabels: Record<string, string> = {
    reglement: 'règlement de copropriété',
    contrat: 'contrat prestataire',
    devis: 'devis de travaux',
    autre: 'document',
  }

  const prompt = `Analyse ce ${typeLabels[type] ?? 'document'} et extrais les informations clés sous forme structurée.

Pour un règlement de copropriété, extrais :
- Parties communes et privatives principales
- Règles d'usage (animaux, travaux, location, etc.)
- Répartition des charges (si mentionnée)
- Obligations des copropriétaires
- Points de vigilance ou clauses inhabituelles

Pour un contrat prestataire, extrais :
- Objet du contrat et prestataire
- Durée et conditions de résiliation
- Prix, révision tarifaire
- Garanties et responsabilités
- Clauses importantes / pièges à éviter

Pour un devis, extrais :
- Nature et détail des travaux
- Montant HT, TVA, TTC
- Délais d'exécution
- Garanties incluses
- Ce qui n'est PAS inclus

Réponds en français avec des sections claires, des bullet points. Sois précis et pratique.`

  const client = new Anthropic({ apiKey })

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    try {
      const message = await client.beta.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        betas: ['pdfs-2024-09-25'],
        messages: [{
          role: 'user',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as unknown as Anthropic.Beta.BetaContentBlockParam,
            { type: 'text', text: prompt },
          ],
        }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return NextResponse.json({ analyse: text, nom_fichier: file.name })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur IA inconnue'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } else {
    // Fichier non-PDF (Word, texte, etc.) — on informe l'utilisateur
    return NextResponse.json(
      { error: 'Seuls les fichiers PDF sont pris en charge pour l\'analyse. Veuillez convertir votre document en PDF.' },
      { status: 400 }
    )
  }
}
