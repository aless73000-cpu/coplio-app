import { CardSkeleton, PageHeaderSkeleton } from '@/components/ui/PageSkeleton'
export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={4} />
      <CardSkeleton lines={3} />
    </div>
  )
}
