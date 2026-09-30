import { Phone, Wifi, Tv, Zap, CreditCard, GraduationCap, Wallet, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  airtime: Phone,
  data: Wifi,
  cable: Tv,
  electricity: Zap,
  epin: CreditCard,
  exam: GraduationCap,
  wallet: Wallet,
  all: LayoutGrid,
};

export function ServiceIcon({
  type,
  className,
  size = 22,
}: {
  type: keyof typeof ICONS | string;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[type] ?? LayoutGrid;
  return <Icon width={size} height={size} className={cn(className)} strokeWidth={2.2} />;
}