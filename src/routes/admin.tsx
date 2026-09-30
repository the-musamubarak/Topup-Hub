import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, LayoutDashboard, ListChecks, Users, Settings2, LineChart, LogOut, ShieldAlert, Loader2, Megaphone, ScrollText } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TopUp Hub" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/transactions", label: "Transactions", icon: ListChecks },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/services", label: "Pricing", icon: Settings2 },
  { to: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-6">
        <div className="rounded-3xl bg-card p-8 text-center shadow-card animate-scale-in">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin privileges. Contact support if you think this is a mistake.
          </p>
          <Link to="/home" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-brand px-5 text-sm font-semibold text-white shadow-brand">
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="px-5 pt-6">
          <BrandLogo />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand">Admin Console</p>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as "/admin"}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-gradient-brand text-white shadow-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <Link
            to="/home"
            className="flex w-full items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft size={18} /> Back to app
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <BrandLogo showText={false} />
        <span className="text-xs font-bold uppercase tracking-wider text-brand">Admin</span>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 overflow-x-auto border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex min-w-max">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as "/admin"}
                className={cn(
                  "flex min-w-[72px] flex-col items-center gap-1 py-2 text-[10px] font-semibold",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                <Icon size={18} />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="min-h-screen pb-24 lg:pb-8 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
