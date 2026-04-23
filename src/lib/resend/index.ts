import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM = `${process.env.RESEND_FROM_NAME ?? 'Coplio'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@coplio.fr'}>`

// ─── Helpers d'envoi ──────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, error }
  }
}

// ─── Templates d'emails ───────────────────────────────────────

export function emailInvitationCopropriétaire({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  magicLink,
}: {
  prenom: string
  nom: string
  cabinetNom: string
  nomCopropriete: string
  magicLink: string
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accès à votre portail copropriétaire</title>
</head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1EFE8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
        <!-- Header -->
        <tr>
          <td style="background:#0F6E56;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:white;font-size:24px;font-weight:700;">🏠 Coplio</p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Votre portail copropriétaire</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#444441;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;color:#444441;line-height:1.6;">
              Le cabinet <strong>${cabinetNom}</strong> vous invite à accéder à votre portail copropriétaire
              pour la résidence <strong>${nomCopropriete}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444441;line-height:1.6;">
              Depuis votre portail, vous pouvez consulter vos charges, accéder à vos documents,
              suivre les travaux et voter lors des assemblées générales.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${magicLink}"
                     style="background:#0F6E56;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
                    Accéder à mon portail →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;text-align:center;">
              Ce lien expire dans 24 heures. Si vous n'avez pas demandé cet accès, ignorez cet email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F1EFE8;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#888;">© 2024 Coplio · Gestion de copropriété</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function emailRelanceImpayes({
  prenom,
  nom,
  montant,
  dateEcheance,
  cabinetNom,
  nomCopropriete,
  numeroLot,
  niveau, // 1 = premier rappel, 2 = deuxième, 3 = mise en demeure
}: {
  prenom: string
  nom: string
  montant: string
  dateEcheance: string
  cabinetNom: string
  nomCopropriete: string
  numeroLot: string
  niveau: 1 | 2 | 3
}) {
  const niveauConfig = {
    1: { titre: 'Rappel de paiement', bg: '#FAEEDA', color: '#854F0B', emoji: '⚠️' },
    2: { titre: 'Deuxième rappel — charges impayées', bg: '#FCEBEB', color: '#A32D2D', emoji: '⚠️⚠️' },
    3: { titre: 'Mise en demeure', bg: '#FCEBEB', color: '#A32D2D', emoji: '🚨' },
  }

  const { titre, bg, color, emoji } = niveauConfig[niveau]

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${titre}</title></head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1EFE8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr>
          <td style="background:${color};padding:24px 40px;text-align:center;">
            <p style="margin:0;color:white;font-size:20px;font-weight:700;">${emoji} ${titre}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#444441;">Madame, Monsieur <strong>${nom}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;color:#444441;line-height:1.6;">
              Sauf erreur de notre part, nous n'avons pas reçu le règlement suivant concernant
              votre lot <strong>n°${numeroLot}</strong> de la résidence <strong>${nomCopropriete}</strong> :
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:10px;padding:20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0;font-size:24px;font-weight:700;color:${color};">${montant}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:${color};">Échéance dépassée depuis le ${dateEcheance}</p>
                </td>
              </tr>
            </table>
            ${niveau === 3 ? `
            <p style="margin:0 0 16px;font-size:15px;color:#A32D2D;font-weight:600;line-height:1.6;">
              À défaut de règlement dans les 8 jours, nous nous verrons dans l'obligation d'engager
              une procédure de recouvrement judiciaire.
            </p>
            ` : ''}
            <p style="margin:0;font-size:14px;color:#888;">
              Cabinet ${cabinetNom} — Syndic de la résidence ${nomCopropriete}
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F1EFE8;padding:16px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#888;">© 2024 Coplio · Gestion de copropriété</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function emailConvocationAG({
  prenom,
  nom,
  cabinetNom,
  nomCopropriete,
  dateAg,
  heure,
  lieu,
  listeResolutions,
  lienVote,
}: {
  prenom: string
  nom: string
  cabinetNom: string
  nomCopropriete: string
  dateAg: string
  heure: string
  lieu: string
  listeResolutions: string[]
  lienVote?: string
}) {
  const resolutionsHtml = listeResolutions
    .map((r, i) => `<li style="margin-bottom:8px;font-size:14px;color:#444441;">${i + 1}. ${r}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Convocation à l'Assemblée Générale</title></head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1EFE8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr>
          <td style="background:#0F6E56;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:white;font-size:20px;font-weight:700;">📋 Convocation à l'Assemblée Générale</p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);">${nomCopropriete}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#444441;">Madame, Monsieur <strong>${prenom} ${nom}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444441;line-height:1.6;">
              Vous êtes convoqué(e) à l'Assemblée Générale de la résidence <strong>${nomCopropriete}</strong>.
            </p>

            <table width="100%" style="background:#E1F5EE;border-radius:10px;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
              <tr><td>
                <p style="margin:0 0 8px;font-weight:600;color:#0F6E56;">📅 ${dateAg} à ${heure}</p>
                <p style="margin:0;color:#0F6E56;">📍 ${lieu}</p>
              </td></tr>
            </table>

            <p style="margin:0 0 12px;font-weight:600;color:#444441;">Ordre du jour :</p>
            <ol style="margin:0 0 24px;padding-left:20px;">${resolutionsHtml}</ol>

            ${lienVote ? `
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center" style="padding-bottom:24px;">
                <a href="${lienVote}" style="background:#0F6E56;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
                  Voter en ligne →
                </a>
              </td></tr>
            </table>
            ` : ''}

            <p style="margin:0;font-size:13px;color:#888;">Cabinet ${cabinetNom}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
