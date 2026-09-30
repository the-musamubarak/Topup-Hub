import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Receipt, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function TabsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-4 items-center rounded-3xl border border-border/60 bg-card/95 px-2 py-2 shadow-elevated backdrop-blur">
          {tabs.map((t) => {
            const active = pathname === t.to || pathname.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                    active
                      ? "bg-gradient-brand text-white shadow-brand"
                      : "text-muted-foreground group-hover:bg-muted",
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
