import { Card, Skeleton } from "@/components/design";

export default function InboxLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton width="6rem" height="0.75rem" />
        <Skeleton width="14rem" height="2rem" />
        <Skeleton width="22rem" height="1rem" />
      </header>

      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-[var(--color-hairline-soft)]">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-start gap-4 px-5 py-4">
              <Skeleton rounded="full" width="2.25rem" height="2.25rem" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton width="6rem" height="0.875rem" />
                  <Skeleton width="3rem" height="1.25rem" rounded="full" />
                </div>
                <Skeleton width="80%" height="1rem" />
                <Skeleton width="55%" height="0.75rem" />
              </div>
              <Skeleton width="5rem" height="2rem" rounded="md" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
