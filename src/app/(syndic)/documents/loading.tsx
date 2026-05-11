import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  )
}
