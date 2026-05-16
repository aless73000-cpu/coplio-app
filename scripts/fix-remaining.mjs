/**
 * Fixes the remaining 5 partially-broken files.
 * These files have handlers in the form:
 *   export const METHOD = withErrorHandler(async (params) => { body }
 * where the withErrorHandler( was never properly closed.
 *
 * We revert these back to:
 *   export async function METHOD(params) { body }
 * by simply replacing the declaration header.
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const files = process.argv.slice(2)

for (const file of files) {
  let code = readFileSync(file, 'utf-8')
  let changed = false

  // Remove any leftover withErrorHandler import (already done but just in case)
  code = code.replace(/^import \{ withErrorHandler \} from '@\/lib\/api-handler'\n/m, '')

  for (const method of METHODS) {
    // Match: export const METHOD = withErrorHandler(async (
    // This is the broken declaration that was never properly closed
    const re = new RegExp(
      `(export const ${method} = withErrorHandler\\(async \\()([^)]*(?:\\([^)]*\\)[^)]*)*)(\\)\\s*(?::[^{=>]*)?)\\s*=>\\s*\\{`,
      'gs'
    )

    code = code.replace(re, (match, _prefix, params, returnTypePart) => {
      // Clean up the return type - remove from `=>` already handled by regex
      const rt = returnTypePart ? returnTypePart.replace(/^\)/, '').trim() : ''
      const rtStr = rt ? ` ${rt}` : ''
      changed = true
      return `export async function ${method}(${params})${rtStr} {`
    })
  }

  if (changed) {
    writeFileSync(file, code, 'utf-8')
    console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`)
  } else {
    console.log(`⚠️  No change: ${path.relative(process.cwd(), file)}`)
  }
}
