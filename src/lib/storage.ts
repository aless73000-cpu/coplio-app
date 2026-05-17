import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Returns a signed URL for a document, cached for 45 minutes.
 * Uses admin client (service role) so the cache key is path-based only.
 * URLs expire after 1h so we revalidate at 45min to always serve valid URLs.
 */
export const getSignedDocumentUrl = unstable_cache(
  async (bucket: string, path: string): Promise<string | null> => {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  },
  ['signed-doc-url'],
  { revalidate: 2700, tags: ['documents'] }
)
