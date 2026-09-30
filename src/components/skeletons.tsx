import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function WalletCardSkeleton() {
  return (
    <div className="rounded-3xl bg-gradient-brand p-5 shadow-brand">
      <div className="h-3 w-24 skeleton bg-white/30" />
      <div className="mt-3 h-8 w-40 skeleton bg-white/30" />
      <div className="mt-6 h-10 w-32 skeleton bg-white/30" />
    </div>
  );
}

export function TxRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
      <Skeleton className="h-10 w-10 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export function TxListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <TxRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-6 w-24" />
    </div>
  );
}
