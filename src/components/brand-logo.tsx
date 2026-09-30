import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showText = true,
  animate = false,
  size = 36,
}: {
  className?: string;
  showText?: boolean;
  animate?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark size={size} animate={animate} />
      {showText && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          TopUp <span className="text-gradient-brand">Hub</span>
        </span>
      )}
    </div>
  );
}

export function BrandMark({ size = 36, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animate && "animate-brand-pulse")}
      aria-label="TopUp Hub"
    >
      <defs>
        <linearGradient id="tuh-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EB001B" />
          <stop offset="55%" stopColor="#FF6600" />
          <stop offset="100%" stopColor="#F79E1B" />
        </linearGradient>
        <linearGradient id="tuh-bolt" x1="0" y1="48" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#tuh-grad)" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <rect x="10" y="30" width="4" height="8" rx="1.2" fill="#FFFFFF" fillOpacity="0.35" />
      <rect x="16.5" y="25" width="4" height="13" rx="1.2" fill="#FFFFFF" fillOpacity="0.45" />
      <rect x="23" y="20" width="4" height="18" rx="1.2" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="29.5" y="14" width="4" height="24" rx="1.2" fill="#FFFFFF" fillOpacity="0.7" />
      <path d="M27 8 L14 27 H22 L19 40 L34 20 H26 L29 8 Z" fill="url(#tuh-bolt)" />
    </svg>
  );
}