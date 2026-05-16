/**
 * Transforms all API route.ts files to use withErrorHandler.
 *
 * Strategy: INSERT rather than RECONSTRUCT.
 * For each exported HTTP handler:
 *   export async function METHOD(params): ReturnType { body }
 * becomes:
 *   export const METHOD = withErrorHandler(async (params): ReturnType => { body })
 *
 * We do this by:
 * 1. Replacing the function declaration header up to and including the opening `{`
 * 2. Appending `)` immediately after the matching closing `}`
 */

import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

const ROOT = path.resolve(process.cwd(), 'src/app/api')
const IMPORT_LINE = "import { withErrorHandler } from '@/lib/api-handler'"
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

let filesChanged = 0
let filesSkipped = 0

/**
 * Find the position of the matching closing brace for the brace at `openPos`.
 * Uses a comment-aware, string-aware brace counter.
 */
function findMatchingBrace(code, openPos) {
  let depth = 1
  let i = openPos + 1
  while (i < code.length && depth > 0) {
    const ch = code[i]
    if (ch === '{') {
      depth++
      i++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return i
      i++
    } else if (ch === '/' && code[i + 1] === '/') {
      // line comment — skip to end of line
      i += 2
      while (i < code.length && code[i] !== '\n') i++
    } else if (ch === '/' && code[i + 1] === '*') {
      // block comment — skip to */
      i += 2
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
    } else if (ch === '`') {
      // template literal — skip content, handle ${} interpolation recursively
      i++
      while (i < code.length && code[ch] !== '`') {
        if (code[i] === '\\') { i += 2; continue }
        if (code[i] === '$' && code[i + 1] === '{') {
          // embedded expression — skip with brace counting
          i += 2
          let exprDepth = 1
          while (i < code.length && exprDepth > 0) {
            if (code[i] === '{') exprDepth++
            else if (code[i] === '}') exprDepth--
            i++
          }
          continue
        }
        if (code[i] === '`') break
        i++
      }
      i++ // skip closing backtick
    } else if (ch === '"' || ch === "'") {
      // regular string — skip content
      const quote = ch
      i++
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') i++
        i++
      }
      i++ // skip closing quote
    } else {
      i++
    }
  }
  return -1 // not found
}

function transform(src) {
  // Skip if already wrapped
  if (src.includes('withErrorHandler')) return null

  let code = src
  let changed = false

  for (const method of METHODS) {
    // Match: export async function METHOD(
    const re = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'g')
    let match

    while ((match = re.exec(code)) !== null) {
      const declStart = match.index
      const parenOpen = match.index + match[0].length - 1 // position of '('

      // Find matching closing paren (params end)
      let parenDepth = 1
      let pi = parenOpen + 1
      while (pi < code.length && parenDepth > 0) {
        if (code[pi] === '(') parenDepth++
        else if (code[pi] === ')') parenDepth--
        pi++
      }
      const parenClose = pi - 1 // position of ')'
      const params = code.slice(parenOpen + 1, parenClose)

      // Find the opening brace of the function body
      // May have a return type annotation between ')' and '{'
      let braceOpen = code.indexOf('{', parenClose + 1)
      if (braceOpen === -1) continue

      // Verify nothing odd between parenClose and braceOpen (only whitespace + type annotation)
      const between = code.slice(parenClose + 1, braceOpen)
      if (between.includes('{')) continue // nested structure, skip

      // Extract the return type annotation if present
      const returnType = between.trimStart().startsWith(':') ? between : ''

      // Find matching closing brace
      const braceClose = findMatchingBrace(code, braceOpen)
      if (braceClose === -1) continue

      // Build the replacement:
      // export const METHOD = withErrorHandler(async (params)ReturnType => { body })
      // We keep the body AS-IS (slice from braceOpen to braceClose inclusive)
      const body = code.slice(braceOpen, braceClose + 1) // includes { and }
      const returnTypeStr = returnType ? returnType.replace(/\s*$/, ' ') : ' '

      const newDecl = `export const ${method} = withErrorHandler(async (${params})${returnTypeStr}=> ${body})`

      const before = code.slice(0, declStart)
      const after = code.slice(braceClose + 1)
      code = before + newDecl + after

      // Resume search after the replacement
      re.lastIndex = before.length + newDecl.length
      changed = true
    }
  }

  if (!changed) return null

  // Add import after the last existing import
  const lines = code.split('\n')
  let lastImportIdx = -1
  for (let k = 0; k < lines.length; k++) {
    if (lines[k].startsWith('import ')) lastImportIdx = k
  }
  if (lastImportIdx === -1) {
    lines.unshift(IMPORT_LINE)
  } else {
    lines.splice(lastImportIdx + 1, 0, IMPORT_LINE)
  }

  return lines.join('\n')
}

const files = globSync(`${ROOT}/**/route.ts`)

for (const file of files) {
  const src = readFileSync(file, 'utf-8')
  const result = transform(src)
  if (result !== null) {
    writeFileSync(file, result, 'utf-8')
    const rel = path.relative(process.cwd(), file)
    console.log(`✅ ${rel}`)
    filesChanged++
  } else {
    filesSkipped++
  }
}

console.log(`\nDone: ${filesChanged} files transformed, ${filesSkipped} skipped.`)
