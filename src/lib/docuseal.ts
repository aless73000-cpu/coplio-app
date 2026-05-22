/**
 * DocuSeal API client
 * Cloud: https://api.docuseal.com  (DOCUSEAL_API_KEY requis)
 * Self-hosted: DOCUSEAL_BASE_URL + DOCUSEAL_API_KEY
 *
 * Flow pour une signature one-off (PDF URL → template → submission) :
 * 1. createTemplateFromUrl() → templateId
 * 2. createSubmission()      → { submissionId, signers[] }
 * 3. signers[i].signingUrl   → lien envoyé / affiché
 */

export interface DocuSealSigner {
  email: string
  slug: string
  signingUrl: string
  submitterId: number
}

export interface DocuSealSubmission {
  submissionId: number
  signers: DocuSealSigner[]
}

const BASE_URL =
  process.env.DOCUSEAL_BASE_URL?.replace(/\/$/, '') ?? 'https://api.docuseal.com'

function headers() {
  return {
    'X-Auth-Token': process.env.DOCUSEAL_API_KEY ?? '',
    'Content-Type': 'application/json',
  }
}

/** Crée un template DocuSeal depuis une URL PDF publique. Retourne le templateId. */
export async function createTemplateFromUrl(name: string, pdfUrl: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/templates/pdf`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      documents: [{ name, url: pdfUrl }],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DocuSeal createTemplate failed (${res.status}): ${text}`)
  }
  const data = await res.json()
  return data.id as number
}

/** Crée une submission et retourne les liens de signature par signataire. */
export async function createSubmission(
  templateId: number,
  signataires: { prenom: string; nom: string; email: string }[],
  sendEmail = true
): Promise<DocuSealSubmission> {
  const submitters = signataires.map((s, i) => ({
    role: i === 0 ? 'First Party' : `Signer ${i + 1}`,
    name: `${s.prenom} ${s.nom}`.trim(),
    email: s.email,
    send_email: sendEmail,
  }))

  const res = await fetch(`${BASE_URL}/api/submissions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ template_id: templateId, send_email: sendEmail, submitters }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DocuSeal createSubmission failed (${res.status}): ${text}`)
  }

  // Response est un tableau de submitters
  const data = await res.json() as Array<{
    id: number
    slug: string
    email: string
    submission_id: number
    embed_src?: string
  }>

  const first = data[0]
  return {
    submissionId: first.submission_id,
    signers: data.map(s => ({
      email: s.email,
      slug: s.slug,
      submitterId: s.id,
      signingUrl: `${BASE_URL}/s/${s.slug}`,
    })),
  }
}

export function isConfigured(): boolean {
  return !!process.env.DOCUSEAL_API_KEY
}
