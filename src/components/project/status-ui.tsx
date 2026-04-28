import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusKey, statusMeta } from "@/lib/status";

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const meta = statusMeta[status];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium", meta.className, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}

export function ComplianceBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </div>
  );
}
