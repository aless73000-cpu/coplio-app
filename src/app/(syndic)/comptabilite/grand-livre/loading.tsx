import { PageHeaderSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={3} />
      <TableSkeleton rows={6} />
    </div>
  )
}
