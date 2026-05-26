/**
 * Génération sécurisée de mots de passe temporaires.
 *
 * Utilise `crypto.randomBytes()` (CSPRNG) au lieu de `Math.random()` (PRNG non sécurisé).
 * Les mots de passe sont envoyés par email aux copropriétaires lors de leur invitation au portail.
 */
import { randomBytes } from 'crypto'

const CHARSET_UPPER  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'  // sans 0, O, I, l pour éviter ambiguïtés
const CHARSET_LOWER  = 'abcdefghjkmnpqrstuvwxyz'
const CHARSET_DIGITS = '23456789'
const CHARSET_ALL    = CHARSET_UPPER + CHARSET_LOWER + CHARSET_DIGITS

/**
 * Génère un mot de passe temporaire de 12 caractères :
 * - Au moins 2 majuscules, 2 minuscules, 2 chiffres
 * - Sans caractères ambigus (0, O, 1, I, l)
 * - Mélange cryptographiquement sécurisé via crypto.randomBytes()
 */
export function generateTempPassword(): string {
  const pickFrom = (charset: string): string => {
    // Rejeter les valeurs hors plage pour éviter le modulo bias
    const max = Math.floor(256 / charset.length) * charset.length
    let byte: number
    do {
      byte = randomBytes(1)[0]
    } while (byte >= max)
    return charset[byte % charset.length]
  }

  const required = [
    pickFrom(CHARSET_UPPER),
    pickFrom(CHARSET_UPPER),
    pickFrom(CHARSET_LOWER),
    pickFrom(CHARSET_LOWER),
    pickFrom(CHARSET_DIGITS),
    pickFrom(CHARSET_DIGITS),
  ]

  const extra = Array.from({ length: 6 }, () => pickFrom(CHARSET_ALL))

  // Mélange Fischer-Yates avec crypto.randomBytes()
  const chars = [...required, ...extra]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
