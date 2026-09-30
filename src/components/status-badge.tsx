import { cn } from "@/lib/utils";
import type { TxStatus } from "@/lib/mock-data";

export function StatusBadge({ status, className }: { status: TxStatus; className?: string }) {
  const styles: Record<TxStatus, string> = {
    success: "bg-success/10 text-success",
    pending: "bg-warning/15 text-[oklch(0.55_0.16_75)]",
    failed: "bg-destructive/10 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };
  const labels: Record<TxStatus, string> = {
    success: "Successful",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", styles[status], className)}>
      {labels[status]}
    </span>
  );
}
