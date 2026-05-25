/**
 * Route Segment Loading UI — affiché instantanément pendant que
 * le Dashboard Server Component charge ses données Supabase.
 * Évite un écran blanc et améliore le LCP perçu.
 */
export default function SyndicLoading() {
  return (
    <div className="flex min-h-screen bg-coplio-bg">
      {/* Sidebar skeleton */}
      <div className="w-60 flex-shrink-0 bg-[#374151]" />

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="h-16 bg-white border-b border-border flex items-center px-6 gap-4">
          <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="ml-auto w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* KPI cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="w-16 h-7 bg-gray-200 rounded animate-pulse" />
                  <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Charts row skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
              </div>
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Bottom row skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-6 space-y-3">
                  <div className="w-28 h-5 bg-gray-200 rounded animate-pulse" />
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="w-2/3 h-3 bg-gray-50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
