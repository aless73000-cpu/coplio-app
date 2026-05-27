import { PageHeaderSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/PageSkeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={2} />
      <TableSkeleton rows={4} />
    </div>
  )
}
