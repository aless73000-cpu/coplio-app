export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="coplio-card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 rounded mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="coplio-card animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="coplio-card p-0 overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-border bg-gray-50">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-border last:border-0 flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-1/3 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6 animate-pulse">
      <div>
        <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-32" />
      </div>
      <div className="h-9 bg-gray-200 rounded-lg w-28" />
    </div>
  )
}
