/**
 * Helper de test — faux client Supabase pour tester les route handlers.
 *
 * `from(table)` renvoie un query builder chaînable. Chaque table reçoit une
 * FILE de résultats, consommés dans l'ordre des appels `from(table)` (permet
 * de simuler plusieurs requêtes sur la même table : ex. SELECT puis INSERT).
 */
import { vi } from 'vitest'

export type QueryResult = { data?: unknown; error?: unknown; count?: number }

function makeBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt',
    'order', 'limit', 'range', 'not', 'is', 'match', 'ilike', 'contains',
  ]
  for (const m of chainMethods) builder[m] = vi.fn(() => builder)
  // Terminaux : .single()/.maybeSingle() résolvent vers le résultat
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  // Thenable : `await builder` (ex. .insert(...) sans .single()) résout le résultat
  builder.then = (onfulfilled: (r: QueryResult) => unknown) =>
    Promise.resolve(result).then(onfulfilled)
  return builder
}

export function mockSupabase(opts: {
  user?: { id: string } | null
  tables?: Record<string, QueryResult[]>
}) {
  const queues: Record<string, QueryResult[]> = {}
  for (const [t, arr] of Object.entries(opts.tables ?? {})) queues[t] = [...arr]

  const from = vi.fn((table: string) => {
    const q = queues[table]
    const result = q && q.length ? q.shift()! : { data: null, error: null }
    return makeBuilder(result)
  })

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }) },
    from,
  }
}
