import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Returns a signed URL for a document, cached for 55 minutes.
 * URL validity = 1 h (3600s) > cache TTL = 55 min (3300s) so we never
 * serve an expired URL.
 *
 * Uses admin client (service role) because this is a server-only utility
 * called exclusively from authenticated server components/actions.
 */
export const getSignedDocumentUrl = unstable_cache(
  async (bucket: string, path: string): Promise<string | null> => {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  },
  ['signed-doc-url'],
  { revalidate: 3300, tags: ['documents'] }
)
