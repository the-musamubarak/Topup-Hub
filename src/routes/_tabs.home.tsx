import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Eye, EyeOff, Plus, ArrowRight, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/auth.functions";
import { getMyTransactions, getMyWallet } from "@/lib/wallet.functions";
import { listMyBroadcasts, markBroadcastRead } from "@/lib/broadcasts.functions";
import { BrandLogo } from "@/components/brand-logo";
import { ServiceIcon } from "@/components/service-icon";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatNaira, type Transaction } from "@/lib/mock-data";

export const Route = createFileRoute("/_tabs/home")({
  head: () => ({
    meta: [{ title: "Home — TopUp Hub" }],
  }),
  component: Home,
});

const quickActions = [
  { key: "airtime", label: "Airtime" },
  { key: "data", label: "Data" },
  { key: "cable", label: "Cable TV" },
  { key: "electricity", label: "Electricity" },
] as const;

function Home() {
  const [hide, setHide] = useState(false);
  const [banner, setBanner] = useState(true);
  const [profile, setProfile] = useState<{ full_name?: string | null; phone?: string | null; email?: string | null; referral_code?: string | null; biometric_enabled?: boolean | null } | null>(null);
  const [balanceKobo, setBalanceKobo] = useState<number | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const profileFn = useServerFn(getMyProfile);
  const walletFn = useServerFn(getMyWallet);
  const txFn = useServerFn(getMyTransactions);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [profileResult, walletResult, txResult] = await Promise.allSettled([
        profileFn(),
        walletFn(),
        txFn(),
      ]);

      if (!mounted) return;

      if (profileResult.status === "fulfilled") setProfile(profileResult.value.profile as any);
      if (walletResult.status === "fulfilled") setBalanceKobo(walletResult.value.balance_kobo ?? 0);
      if (txResult.status === "fulfilled") setRecent(txResult.value.slice(0, 5));

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [profileFn, walletFn, txFn]);

  const displayName = profile?.full_name ?? "Customer";
  const balanceAmount = balanceKobo !== null ? balanceKobo / 100 : 0;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-11 w-11 rounded-full skeleton" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white shadow-brand">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Good afternoon 👋</p>
            {loading ? (
              <div className="mt-1 h-4 w-24 rounded skeleton" />
            ) : (
              <p className="text-sm font-bold text-foreground">Hi, {displayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BrandLogo showText={false} />
          <BellWidget />
        </div>
      </header>

      {/* Wallet card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand p-5 text-white shadow-brand">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Wallet balance</p>
            <button
              onClick={() => setHide(!hide)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur"
            >
              {hide ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {loading ? (
            <div className="mt-2 h-9 w-40 rounded skeleton bg-white/20" />
          ) : (
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {hide ? "₦ ••••••" : formatNaira(balanceAmount)}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2">
            <Button
              asChild
              className="h-11 rounded-2xl bg-white px-5 text-sm font-bold text-brand-red hover:bg-white/90"
            >
              <Link to="/wallet">
                <Plus size={16} className="mr-1" /> Fund wallet
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-white/40 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
            >
              <Link to="/transactions">History</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Popular services */}
      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-foreground">Popular services</h2>
          <Link to="/service/$type" params={{ type: "all" }} className="text-xs font-semibold text-brand">
            Browse services
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.key}
              to="/service/$type"
              params={{ type: a.key }}
              className="group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:bg-muted"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand/15 to-brand-red/15 text-brand-red transition-transform group-hover:scale-105">
                <ServiceIcon type={a.key} />
              </div>
              <span className="text-[11px] font-semibold leading-tight text-center text-foreground">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {banner && (
        <section className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-r from-accent to-card p-4 shadow-card">
          <button
            onClick={() => setBanner(false)}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-card text-muted-foreground shadow-card"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <p className="max-w-[70%] text-sm font-bold text-foreground">
            Get 5% cashback on your first data purchase
          </p>
          <p className="mt-1 max-w-[75%] text-xs text-muted-foreground">
            Automatically credited to your wallet after checkout.
          </p>
          <Link
            to="/service/$type"
            params={{ type: "data" }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-red"
          >
            Buy data now <ArrowRight size={12} />
          </Link>
        </section>
      )}

      {/* Recent transactions */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-foreground">Recent purchases</h2>
          <Link to="/transactions" className="text-xs font-semibold text-brand">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2 rounded-3xl bg-card p-4 shadow-card">
            <div className="h-14 w-full rounded-2xl skeleton" />
            <div className="h-14 w-full rounded-2xl skeleton" />
            <div className="h-14 w-full rounded-2xl skeleton" />
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-3xl bg-card p-6 text-center shadow-card">
            <p className="text-sm font-bold text-foreground">No purchases yet</p>
            <p className="mt-2 text-xs text-muted-foreground">Buy airtime, data, cable or electricity to get started.</p>
            <Link
              to="/service/$type"
              params={{ type: "airtime" }}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-brand"
            >
              Buy airtime now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-3xl bg-card px-4 shadow-card">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-brand-red">
                  <ServiceIcon type={t.category} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{t.service}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatNaira(t.amount)}</p>
                  <StatusBadge status={t.status} className="mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BellWidget() {
  const list = useServerFn(listMyBroadcasts);
  const markRead = useServerFn(markBroadcastRead);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const reload = async () => {
    try {
      const r = await list();
      setRows(r as any[]);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={async () => { setOpen(!open); if (!open) await reload(); }}
        className="relative grid h-11 w-11 place-items-center rounded-full bg-card shadow-card"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-red" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-card p-3 shadow-card">
          <p className="mb-2 text-sm font-bold">Notifications</p>
          <div className="divide-y divide-border max-h-64 overflow-auto">
            {rows.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No notifications</p>}
            {rows.map((r) => (
              <div key={r.id} className="py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.broadcast.title}</p>
                  {!r.read_at && (
                    <button className="text-xs font-bold text-brand" onClick={async () => { try { await markRead({ data: { read_id: r.id } }); await reload(); } catch { } }}>Mark read</button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.broadcast.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.broadcast.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
