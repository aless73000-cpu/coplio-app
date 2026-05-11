import { GridSkeleton, PageHeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <GridSkeleton count={6} />
    </div>
  )
}
