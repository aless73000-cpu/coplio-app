import { NextResponse } from 'next/server'

/**
 * Wraps an API handler with a global try/catch so any unhandled error
 * returns a clean 500 JSON instead of crashing the edge function.
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (err) {
      console.error('[API Error]', err)
      return NextResponse.json(
        { error: 'Erreur serveur inattendue' },
        { status: 500 }
      )
    }
  }
}
