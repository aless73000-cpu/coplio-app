import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Returns a signed URL for a document, cached for 10 minutes.
 * URL validity = 15 min (900s) > cache TTL = 10 min (600s) so we never
 * serve an expired URL. Keeping the window short limits exposure if a
 * document is deleted or access is revoked.
 *
 * Uses admin client (service role) because this is a server-only utility
 * called exclusively from authenticated server components/actions.
 */
export const getSignedDocumentUrl = unstable_cache(
  async (bucket: string, path: string): Promise<string | null> => {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 900)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  },
  ['signed-doc-url'],
  { revalidate: 600, tags: ['documents'] }
)
