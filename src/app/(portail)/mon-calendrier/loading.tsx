import { PageHeaderSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={5} />
      <CardSkeleton lines={4} />
    </div>
  )
}
