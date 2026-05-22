import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

const LOT_TYPES = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre'] as const
type LotType = typeof LOT_TYPES[number]

function normalizeLotType(raw: string): LotType {
  const s = raw.toLowerCase().trim()
  if (LOT_TYPES.includes(s as LotType)) return s as LotType
  if (s.startsWith('app') || s.includes('appart')) return 'appartement'
  if (s.startsWith('mai') || s.includes('villa')) return 'maison'
  if (s.includes('local') || s.includes('comm') || s.includes('bureau')) return 'local_commercial'
  if (s.includes('park') || s.includes('garage') || s.includes('box')) return 'parking'
  if (s.includes('cave') || s.includes('sous')) return 'cave'
  return 'autre'
}

/**
 * Normalise une clé de colonne pour la comparaison :
 * - Supprime les accents
 * - Met en minuscule
 * - Retire les caractères spéciaux (espaces, tirets, parenthèses, points, °, ², /)
 */
function normalizeKey(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // supprime accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // garde seulement lettres et chiffres
}

/**
 * Cherche une valeur dans un objet en testant une liste de mots-clés
 * après normalisation des clés réelles.
 */
function findCol(row: Record<string, unknown>, keywords: string[]): string {
  const entries = Object.entries(row)
  for (const kw of keywords) {
    const normKw = normalizeKey(kw)
    const found = entries.find(([k]) => normalizeKey(k) === normKw)
    if (found) return String(found[1] ?? '').trim()
    // Recherche partielle : la clé contient le mot-clé
    const partial = entries.find(([k]) => normalizeKey(k).includes(normKw))
    if (partial) return String(partial[1] ?? '').trim()
  }
  return ''
}

/**
 * Détecte quelle feuille contient les lots et laquelle les copropriétaires
 * en cherchant des noms de colonnes caractéristiques dans la première ligne.
 */
function detectSheets(wb: ExcelJS.Workbook): {
  lotsSheet: ExcelJS.Worksheet | null
  coprosSheet: ExcelJS.Worksheet | null
} {
  const LOT_KEYWORDS = ['numero', 'tantiemes', 'tantieme', 'lot', 'surface']
  const COPRO_KEYWORDS = ['prenom', 'nom', 'email', 'coproprietaire', 'proprietaire']

  let lotsSheet: ExcelJS.Worksheet | null = null
  let coprosSheet: ExcelJS.Worksheet | null = null

  for (const ws of wb.worksheets) {
    const sheetName = normalizeKey(ws.name)

    // Détection par nom de feuille
    if (!lotsSheet && (sheetName.includes('lot') && !sheetName.includes('copro'))) {
      lotsSheet = ws
      continue
    }
    if (!coprosSheet && (
      sheetName.includes('copro') || sheetName.includes('proprio') ||
      sheetName.includes('resident') || sheetName.includes('owner') ||
      sheetName.includes('habitant') || sheetName.includes('proprietaire')
    )) {
      coprosSheet = ws
      continue
    }
  }

  // Fallback : détection par contenu des colonnes
  for (const ws of wb.worksheets) {
    const headerRow = ws.getRow(1).values as (string | undefined)[]
    const headers = headerRow.slice(1).map(h => normalizeKey(String(h ?? '')))

    const hasLotCols = LOT_KEYWORDS.filter(k => headers.some(h => h.includes(k))).length >= 2
    const hasCoproCols = COPRO_KEYWORDS.filter(k => headers.some(h => h.includes(k))).length >= 2

    if (!lotsSheet && hasLotCols && !hasCoproCols) lotsSheet = ws
    else if (!coprosSheet && hasCoproCols) coprosSheet = ws
  }

  // Dernier recours : première feuille = lots, deuxième = copros
  if (!lotsSheet && wb.worksheets[0]) lotsSheet = wb.worksheets[0]
  if (!coprosSheet && wb.worksheets[1]) coprosSheet = wb.worksheets[1]

  return { lotsSheet, coprosSheet }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const copropriete_id = formData.get('copropriete_id') as string | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    if (!copropriete_id) return NextResponse.json({ error: 'Copropriété non sélectionnée' }, { status: 400 })

    const admin = createAdminClient()
    const { data: copropriete } = await admin
      .from('coproprietes')
      .select('id')
      .eq('id', copropriete_id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()
    if (!copropriete) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(arrayBuffer)

    // Helper : convertit une feuille en tableau d'objets
    const sheetToJson = (ws: ExcelJS.Worksheet): Record<string, unknown>[] => {
      const headerRow = ws.getRow(1).values as (string | undefined)[]
      const headers = headerRow.slice(1)
      const result: Record<string, unknown>[] = []
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const vals = row.values as unknown[]
        const obj: Record<string, unknown> = {}
        headers.forEach((h, i) => { if (h) obj[h] = vals[i + 1] ?? '' })
        result.push(obj)
      })
      return result
    }

    const { lotsSheet, coprosSheet } = detectSheets(wb)

    // ─── Importer les Lots ──────────────────────────────────────
    const lotsCreated: { numero: string; id: string }[] = []
    const errors: string[] = []

    if (lotsSheet) {
      const rawLots = sheetToJson(lotsSheet)

      for (const row of rawLots) {
        const numero = findCol(row, ['numero', 'num', 'n°', 'lot', 'n° lot', 'numero lot', 'numéro', 'numéro lot', 'ref', 'reference', 'id lot'])
        if (!numero) continue

        const typeRaw = findCol(row, ['type', 'type lot', 'categorie', 'catégorie', 'nature'])
        const etage = findCol(row, ['etage', 'niveau', 'floor', 'niv', 'étage']) || undefined
        const surfaceRaw = findCol(row, ['surface', 'surface_m2', 'superficie', 'm2', 'm²', 'surface m2', 'surface (m2)', 'superficie (m2)'])
        const tantièmesRaw = findCol(row, ['tantiemes', 'tantième', 'tantiemes', 'quote part', 'quote-part', 'quotepart', 'millièmes', 'milliemes', 'parts'])

        const surface = surfaceRaw ? parseFloat(surfaceRaw.replace(',', '.')) || undefined : undefined
        const tantiemes = tantièmesRaw ? parseInt(tantièmesRaw.replace(/\s/g, ''), 10) || 0 : 0

        if (!tantiemes || tantiemes < 1) {
          errors.push(`Lot ${numero} : tantièmes invalides ou manquants — ignoré`)
          continue
        }

        const { data: lot, error } = await admin
          .from('lots')
          .insert({
            copropriete_id,
            numero,
            type: normalizeLotType(typeRaw || 'appartement'),
            ...(etage ? { etage } : {}),
            ...(surface ? { surface } : {}),
            tantiemes,
          })
          .select('id, numero')
          .single()

        if (error) {
          errors.push(`Lot ${numero} : ${error.message}`)
        } else if (lot) {
          lotsCreated.push({ id: lot.id, numero: lot.numero })
        }
      }
    }

    // ─── Importer les Copropriétaires ────────────────────────────
    let coprosCreated = 0

    if (coprosSheet) {
      const rawCopros = sheetToJson(coprosSheet)

      // Construire aussi un index des lots existants en BDD (pour les re-imports partiels)
      const { data: existingLots } = await admin
        .from('lots')
        .select('id, numero')
        .eq('copropriete_id', copropriete_id)

      const allLots = new Map<string, string>()
      existingLots?.forEach(l => allLots.set(l.numero.toLowerCase(), l.id))
      lotsCreated.forEach(l => allLots.set(l.numero.toLowerCase(), l.id)) // nouveaux en priorité

      for (const row of rawCopros) {
        const prenom = findCol(row, ['prenom', 'prénom', 'first name', 'firstname', 'givenname', 'given name', 'first'])
        const nom = findCol(row, ['nom', 'last name', 'lastname', 'surname', 'name', 'family name'])
        const email = findCol(row, ['email', 'mail', 'e-mail', 'courriel', 'adresse mail', 'adresse email'])
        const telephone = findCol(row, ['telephone', 'téléphone', 'tel', 'tél', 'phone', 'mobile', 'portable', 'gsm'])
        const adresse = findCol(row, ['adresse', 'address', 'domicile', 'adresse correspondance', 'adresse de correspondance'])
        const lotsRaw = findCol(row, ['lots', 'lot', 'lot_numero', 'numero lot', 'numéro lot', 'n° lot', 'lots associes', 'lots associés'])

        if (!prenom && !nom) continue

        // Vérifier doublon par email
        if (email) {
          const { data: existing } = await admin
            .from('coproprietaires')
            .select('id')
            .eq('cabinet_id', profile.cabinet_id)
            .eq('email', email.toLowerCase())
            .single()
          if (existing) {
            errors.push(`${prenom} ${nom} (${email}) : déjà enregistré — ignoré`)
            continue
          }
        }

        const { data: copro, error: coproError } = await admin
          .from('coproprietaires')
          .insert({
            cabinet_id: profile.cabinet_id,
            prenom: prenom || '—',
            nom: nom || '—',
            ...(email ? { email: email.toLowerCase() } : {}),
            ...(telephone ? { telephone } : {}),
            ...(adresse ? { adresse_correspondance: adresse } : {}),
          })
          .select('id')
          .single()

        if (coproError || !copro) {
          errors.push(`${prenom} ${nom} : erreur lors de la création`)
          continue
        }
        coprosCreated++

        // Lier les lots
        if (lotsRaw) {
          const lotNumeros = lotsRaw.split(/[\s,;|/]+/).filter(Boolean)
          for (const lotNum of lotNumeros) {
            const lotId = allLots.get(lotNum.toLowerCase())
            if (lotId) {
              await admin.from('coproprietaire_lots').insert({
                coproprietaire_id: copro.id,
                lot_id: lotId,
              })
            } else {
              errors.push(`${prenom} ${nom} : lot "${lotNum}" introuvable — lien ignoré`)
            }
          }
        }
      }
    }

    return NextResponse.json({
      lots_created: lotsCreated.length,
      copros_created: coprosCreated,
      errors,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 })
  }
}
