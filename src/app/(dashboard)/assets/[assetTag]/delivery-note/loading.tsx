import { Skeleton } from "@/components/ui/skeleton";

/** A4-shaped placeholder; overrides the asset detail skeleton above it. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[210mm] space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="aspect-[210/297] w-full space-y-6 bg-white p-[14mm] shadow">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24 bg-neutral-200" />
          <Skeleton className="h-10 w-48 bg-neutral-200" />
        </div>
        <Skeleton className="mx-auto h-5 w-40 bg-neutral-200" />
        <Skeleton className="h-32 w-full bg-neutral-200" />
        <Skeleton className="mx-auto h-5 w-32 bg-neutral-200" />
        <Skeleton className="h-20 w-full bg-neutral-200" />
        <Skeleton className="h-24 w-full bg-neutral-200" />
      </div>
    </div>
  );
}
