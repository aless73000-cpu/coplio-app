/**
 * Reverts the broken withErrorHandler transformation:
 * 1. Converts `export const METHOD = withErrorHandler(async (params)... => { body })`
 *    back to `export async function METHOD(params)... { body }`
 * 2. Removes the extra } that was incorrectly included in body
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const files = process.argv.slice(2)

for (const file of files) {
  let code = readFileSync(file, 'utf-8')

  // Remove the withErrorHandler import if present
  code = code.replace(/^import \{ withErrorHandler \} from '@\/lib\/api-handler'\n/m, '')

  for (const method of METHODS) {
    // Match: export const METHOD = withErrorHandler(async (
    const re = new RegExp(
      `export const ${method} = withErrorHandler\\(async \\(`,
      'g'
    )

    let match
    while ((match = re.exec(code)) !== null) {
      const matchStart = match.index

      // Find the opening paren of params
      const parenOpen = matchStart + match[0].length - 1

      // Find the matching closing paren of params
      let pd = 1, pi = parenOpen + 1
      while (pi < code.length && pd > 0) {
        if (code[pi] === '(') pd++
        else if (code[pi] === ')') pd--
        pi++
      }
      const parenClose = pi - 1
      const params = code.slice(parenOpen + 1, parenClose)

      // Find the ` =>` and the function body opening `{`
      // After parenClose there may be a return type, then ` =>`, then ` {`
      let pos = parenClose + 1
      // skip whitespace
      while (pos < code.length && /\s/.test(code[pos])) pos++

      let returnType = ''
      if (code[pos] === ':') {
        // has return type annotation, collect until we see `=>`
        const arrowPos = code.indexOf('=>', pos)
        returnType = code.slice(pos, arrowPos).trimEnd()
        pos = arrowPos + 2 // skip '=>'
      } else if (code[pos] === '=') {
        // ` =>`
        pos += 2 // skip '=>'
      }

      // skip whitespace
      while (pos < code.length && /\s/.test(code[pos])) pos++

      const bodyOpen = pos // position of `{`
      if (code[bodyOpen] !== '{') continue

      // Find the matching closing `})`
      // We need the closing `)` after the function body's `}`
      // Count braces
      let bd = 1, bi = bodyOpen + 1
      while (bi < code.length && bd > 0) {
        if (code[bi] === '{') bd++
        else if (code[bi] === '}') bd--
        bi++
      }
      const bodyClose = bi - 1 // position of `}`

      // After bodyClose should be `)` (withErrorHandler closing paren)
      // But in broken files there may be `\n}` then `\n)` or `\n})`
      let afterBody = bodyClose + 1
      while (afterBody < code.length && /\s/.test(code[afterBody])) afterBody++

      let closingEnd
      if (code[afterBody] === ')') {
        closingEnd = afterBody + 1
      } else if (code[afterBody] === '}') {
        // Extra } from broken transformation — the real closing is the NEXT `)`
        let next = afterBody + 1
        while (next < code.length && /\s/.test(code[next])) next++
        if (code[next] === ')') {
          closingEnd = next + 1
        } else {
          console.warn(`Unexpected char at ${next}: ${JSON.stringify(code[next])} in ${file}`)
          continue
        }
      } else {
        console.warn(`No ) after body close at ${afterBody} in ${file}`)
        continue
      }

      // Reconstruct original function
      const body = code.slice(bodyOpen, bodyClose + 1) // includes { and }
      const rtStr = returnType ? `${returnType} ` : ''
      const newDecl = `export async function ${method}(${params})${rtStr}${body}`

      const before = code.slice(0, matchStart)
      const after = code.slice(closingEnd)
      code = before + newDecl + after

      re.lastIndex = before.length + newDecl.length
    }
  }

  writeFileSync(file, code, 'utf-8')
  console.log(`✅ Reverted: ${path.relative(process.cwd(), file)}`)
}
