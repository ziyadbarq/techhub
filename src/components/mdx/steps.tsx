/**
 * Steps Component for MDX
 * Numbered step-by-step instructions in documentation
 */

interface StepsProps {
  children: React.ReactNode;
}

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="border-border [&>div]:border-border my-6 space-y-0 border-l-2 pl-0 [&>div]:pb-8">
      {children}
    </div>
  );
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="group relative pl-8">
      {/* Step number circle */}
      <div className="bg-background border-border absolute top-0 -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2">
        <div className="bg-barq-yellow h-2 w-2 rounded-full" />
      </div>

      {/* Step content */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <div className="prose-sm text-muted-foreground [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
