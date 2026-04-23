import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_FROM_NUMBER!

// ─── Helpers SMS ──────────────────────────────────────────────

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: FROM,
      to: normalizePhone(to),
      body,
    })
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('Twilio error:', error)
    return { success: false, error }
  }
}

// ─── Templates SMS ────────────────────────────────────────────

export function smsRelanceImpayes({
  prenom,
  montant,
  nomCopropriete,
}: {
  prenom: string
  montant: string
  nomCopropriete: string
}) {
  return `Bonjour ${prenom}, votre syndic Coplio vous informe d'un impayé de ${montant} pour la résidence ${nomCopropriete}. Merci de régulariser votre situation. Répondez STOP pour ne plus recevoir de SMS.`
}

export function smsSinistreNotification({
  prenom,
  titre,
  status,
  nomCopropriete,
}: {
  prenom: string
  titre: string
  status: string
  nomCopropriete: string
}) {
  return `Bonjour ${prenom}, une mise à jour sur le sinistre "${titre}" (${nomCopropriete}) : statut passé à "${status}". Consultez votre portail Coplio pour plus d'infos.`
}

export function smsConvocationAG({
  prenom,
  dateAg,
  nomCopropriete,
}: {
  prenom: string
  dateAg: string
  nomCopropriete: string
}) {
  return `Bonjour ${prenom}, vous êtes convoqué(e) à l'AG de ${nomCopropriete} le ${dateAg}. Consultez votre portail Coplio pour voter en ligne.`
}

// ─── Utilitaire ───────────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Normaliser le numéro français vers le format international
  const cleaned = phone.replace(/[\s.-]/g, '')
  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('+')) {
    return '+33' + cleaned
  }
  return cleaned
}
