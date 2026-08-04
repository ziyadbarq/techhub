import { Card, Skeleton, SkeletonText } from "@/components/design";

export default function RequestLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton width="9rem" height="0.75rem" />
          <Skeleton width="20rem" height="2rem" />
          <Skeleton width="14rem" height="0.875rem" />
        </div>
        <Skeleton width="6rem" height="2rem" rounded="full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <Skeleton width="6rem" height="0.875rem" />
            <div className="mt-3">
              <SkeletonText lines={4} />
            </div>
          </Card>
          <Card>
            <Skeleton width="8rem" height="0.875rem" />
            <ul className="mt-4 space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Skeleton rounded="full" width="1.75rem" height="1.75rem" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height="0.875rem" />
                    <Skeleton width="40%" height="0.75rem" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Skeleton width="6rem" height="0.875rem" />
            <div className="mt-3 space-y-2">
              <Skeleton width="100%" height="2.5rem" rounded="md" />
              <Skeleton width="100%" height="2.5rem" rounded="md" />
              <Skeleton width="100%" height="2.5rem" rounded="md" />
            </div>
          </Card>
          <Card>
            <Skeleton width="5rem" height="0.875rem" />
            <div className="mt-3">
              <SkeletonText lines={3} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
