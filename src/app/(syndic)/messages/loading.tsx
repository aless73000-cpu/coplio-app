export default function Loading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      <div className="mb-5">
        <div className="h-7 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>
      <div className="flex-1 flex gap-5 min-h-0">
        <div className="w-72 flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
            <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
          </div>
          <div className="coplio-card p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-border last:border-0">
                <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 coplio-card" />
      </div>
    </div>
  )
}
