// ─── Twilio SMS — lazy init (no crash if env vars missing) ───
/* eslint-disable @typescript-eslint/no-explicit-any */
import { captureException } from '@/lib/monitoring'

let _client: any = null

function getClient() {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) return null
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio')
    _client = twilio(sid, token)
  }
  return _client
}

export async function sendSMS(to: string, body: string) {
  const client = getClient()
  if (!client) {
    return { success: false, error: 'Twilio non configuré' }
  }
  try {
    const FROM = process.env.TWILIO_FROM_NUMBER
    if (!FROM) return { success: false, error: 'TWILIO_FROM_NUMBER manquant' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await (client as any).messages.create({
      from: FROM,
      to: normalizePhone(to),
      body,
    })
    return { success: true, sid: message.sid }
  } catch (error) {
    captureException(error, { context: 'sendSMS', to })
    return { success: false, error }
  }
}

export function smsRelanceImpayes({ prenom, montant, nomCopropriete }: { prenom: string; montant: string; nomCopropriete: string }) {
  return `Bonjour ${prenom}, votre syndic Coplio vous informe d'un impayé de ${montant} pour la résidence ${nomCopropriete}. Merci de régulariser votre situation. Répondez STOP pour ne plus recevoir de SMS.`
}

export function smsSinistreNotification({ prenom, titre, status, nomCopropriete }: { prenom: string; titre: string; status: string; nomCopropriete: string }) {
  return `Bonjour ${prenom}, une mise à jour sur le sinistre "${titre}" (${nomCopropriete}) : statut passé à "${status}". Consultez votre portail Coplio pour plus d'infos.`
}

export function smsConvocationAG({ prenom, dateAg, nomCopropriete }: { prenom: string; dateAg: string; nomCopropriete: string }) {
  return `Bonjour ${prenom}, vous êtes convoqué(e) à l'AG de ${nomCopropriete} le ${dateAg}. Consultez votre portail Coplio pour voter en ligne.`
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s.-]/g, '')
  if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1)
  if (!cleaned.startsWith('+')) return '+33' + cleaned
  return cleaned
}
