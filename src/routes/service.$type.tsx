import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Contact, CheckCircle2, Share2, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ServiceIcon } from "@/components/service-icon";
import {
  cableProviders, dataBundles, discos, formatNaira, networks,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { providerLogos } from "@/lib/provider-logos";

import { toast } from "sonner";

export const Route = createFileRoute("/service/$type")({
  head: ({ params }) => ({
    meta: [{ title: `${titleFor(params.type)} — TopUp Hub` }],
  }),
  component: ServicePage,
});

function titleFor(t: string) {
  const map: Record<string, string> = {
    airtime: "Buy Airtime", data: "Buy Data", cable: "Cable TV",
    electricity: "Electricity",
    epin: "Recharge Card Pins", exam: "Exam Pins", all: "All Services",
  };
  return map[t] ?? "Service";
}

function ServicePage() {
  const { type } = Route.useParams();
  const [step, setStep] = useState<"form" | "success">("form");
  const [amount, setAmount] = useState<number>(0);
  const [network, setNetwork] = useState(networks[0].id);
  const [provider, setProvider] = useState<string>("");
  const [bundle, setBundle] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [meter, setMeter] = useState("");
  const [saveBen, setSaveBen] = useState(false);
  const [reference] = useState(() => "TUH-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const navigate = useNavigate();

  if (type === "all") return <AllServices />;

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];
  const activeBundle = dataBundles.find((b) => b.id === bundle);
  const effectiveAmount = type === "data" ? activeBundle?.price ?? 0 : amount;
  const discount = effectiveAmount >= 1000 ? Math.round(effectiveAmount * 0.02) : 0;
  const total = effectiveAmount - discount;

  if (step === "success") {
    return (
      <Success
        title={titleFor(type)}
        amount={total}
        reference={reference}
        onHome={() => navigate({ to: "/home" })}
      />
    );
  }

  const submitDisabled =
    (type === "airtime" && (!phone || amount <= 0)) ||
    (type === "data" && (!phone || !bundle)) ||
    (type === "cable" && (!provider || !meter || amount <= 0)) ||
    (type === "electricity" && (!provider || !meter || amount <= 0)) ||
    
    (type === "epin" && amount <= 0) ||
    (type === "exam" && !provider);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
        <Link to="/home" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-brand">
            <ServiceIcon type={type} size={18} />
          </div>
          <h1 className="text-base font-extrabold text-foreground">{titleFor(type)}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {/* Provider / network */}
        {(type === "airtime" || type === "data") && (
          <ProviderGrid
            items={networks}
            active={network}
            onChange={setNetwork}
            columns={4}
          />
        )}
        {type === "cable" && (
          <ProviderGrid
            items={cableProviders.map((p) => ({ ...p, initials: p.name.slice(0, 2).toUpperCase(), color: "#FF6600" }))}
            active={provider}
            onChange={setProvider}
            columns={2}
          />
        )}
        {type === "electricity" && (
          <ProviderGrid
            items={discos.map((p) => ({ ...p, initials: p.name.slice(0, 2).toUpperCase(), color: "#FF6600" }))}
            active={provider}
            onChange={setProvider}
            columns={2}
          />
        )}
        {type === "exam" && (
          <ProviderGrid
            items={[
              { id: "waec", name: "WAEC Result Pin" },
              { id: "neco", name: "NECO Token" },
              { id: "jamb", name: "JAMB e-PIN" },
              { id: "nabteb", name: "NABTEB" },
            ].map((p) => ({ ...p, initials: p.name.slice(0, 3).toUpperCase(), color: "#FF6600" }))}
            active={provider}
            onChange={setProvider}
            columns={2}
          />
        )}

        {/* Recipient input */}
        {(type === "airtime" || type === "data") && (
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="0803 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-2xl pr-12"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-muted text-brand-red">
                <Contact size={16} />
              </button>
            </div>
          </div>
        )}
        {(type === "cable" || type === "electricity") && (
          <div className="space-y-1.5">
            <Label htmlFor="meter">
              {type === "cable" ? "Smartcard / IUC number" : "Meter number"}
            </Label>
            <Input
              id="meter"
              placeholder="Enter number"
              value={meter}
              onChange={(e) => setMeter(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
        )}

        {/* Bundle selector for data */}
        {type === "data" && (
          <div className="space-y-2">
            <Label>Select bundle</Label>
            <div className="grid grid-cols-2 gap-2">
              {dataBundles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBundle(b.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
                    bundle === b.id
                      ? "border-transparent bg-gradient-brand text-white shadow-brand"
                      : "border-border bg-card text-foreground hover:border-brand/50",
                  )}
                >
                  <span className="text-sm font-bold">{b.label}</span>
                  <span className={cn("text-xs", bundle === b.id ? "opacity-90" : "text-muted-foreground")}>
                    {formatNaira(b.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount input for others */}
        {type !== "data" && type !== "exam" && (
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (₦)</Label>
            <Input
              id="amt"
              inputMode="numeric"
              placeholder="0"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="h-14 rounded-2xl text-lg font-bold"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    amount === a
                      ? "border-transparent bg-gradient-brand text-white shadow-brand"
                      : "border-border bg-card text-muted-foreground hover:border-brand/50",
                  )}
                >
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {(type === "airtime" || type === "data" || type === "cable" || type === "electricity") && (
          <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
            <div>
              <p className="text-sm font-semibold text-foreground">Save as beneficiary</p>
              <p className="text-xs text-muted-foreground">Faster next time.</p>
            </div>
            <Switch checked={saveBen} onCheckedChange={setSaveBen} />
          </div>
        )}

        {/* Summary */}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary</p>
          <div className="mt-3 space-y-2 text-sm">
            <SummaryRow label="Amount" value={formatNaira(effectiveAmount)} />
            {discount > 0 && (
              <SummaryRow label="Discount (2%)" value={"− " + formatNaira(discount)} accent />
            )}
            <div className="my-2 h-px bg-border" />
            <SummaryRow label="Total" value={formatNaira(total)} bold />
          </div>
        </div>

        <Button
          disabled={submitDisabled}
          onClick={() => {
            setStep("success");
            toast.success("Payment successful");
          }}
          className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-bold text-white shadow-brand hover:opacity-95 disabled:opacity-50"
        >
          Pay {total > 0 ? formatNaira(total) : "Now"}
        </Button>
      </div>
    </div>
  );
}

function ProviderGrid({
  items, active, onChange, columns,
}: {
  items: Array<{ id: string; name: string; color?: string; initials?: string }>;
  active: string;
  onChange: (id: string) => void;
  columns: 2 | 4;
}) {
  return (
    <div className={cn("grid gap-2", columns === 4 ? "grid-cols-4" : "grid-cols-2")}>
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onChange(n.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all",
            active === n.id
              ? "border-brand bg-brand/5 shadow-brand"
              : "border-border bg-card hover:border-brand/40",
          )}
        >
          {providerLogos[n.id] ? (
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white p-1 ring-1 ring-border">
              <img src={providerLogos[n.id]} alt={n.name} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div
              className="grid h-10 w-10 place-items-center rounded-2xl text-xs font-extrabold text-white"
              style={{ background: n.color ?? "var(--brand)" }}
            >
              {n.initials ?? n.name.slice(0, 3).toUpperCase()}
            </div>
          )}
          <span className="text-[11px] font-semibold leading-tight text-foreground text-center">{n.name}</span>

        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "text-base font-extrabold text-foreground", accent && "text-success font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function Success({ title, amount, reference, onHome }: { title: string; amount: number; reference: string; onHome: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between bg-background px-6 pb-10 pt-16 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-brand text-white shadow-brand animate-scale-in">
          <CheckCircle2 size={64} strokeWidth={2.2} />
          <span className="pointer-events-none absolute inset-0 rounded-full bg-white/20 blur-2xl" />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold text-foreground">Payment successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your {title.toLowerCase()} was completed.</p>

        <div className="mt-8 w-full space-y-3 rounded-3xl bg-card p-5 text-left shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</span>
            <span className="text-lg font-extrabold text-foreground">{formatNaira(amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service</span>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</span>
            <span className="font-mono text-xs text-foreground">{reference}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
            <span className="text-sm text-foreground">{new Date().toLocaleString("en-NG")}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 pt-8">
        <Button
          variant="outline"
          className="h-12 w-full rounded-2xl border-brand/40 text-brand-red hover:bg-brand/5"
          onClick={() => toast.success("Receipt shared")}
        >
          <Share2 size={16} className="mr-2" /> Share receipt
        </Button>
        <Button
          onClick={onHome}
          className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-bold text-white shadow-brand"
        >
          <HomeIcon size={16} className="mr-2" /> Back to home
        </Button>
      </div>
    </div>
  );
}

function AllServices() {
  const services = [
    { key: "airtime", label: "Airtime Top-Up" },
    { key: "data", label: "Data Bundles" },
    { key: "cable", label: "Cable TV" },
    { key: "electricity", label: "Electricity" },
    { key: "epin", label: "Recharge Pins" },
    
    { key: "exam", label: "Exam Pins" },
  ] as const;
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
        <Link to="/home" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-extrabold text-foreground">All services</h1>
      </header>
      <div className="grid grid-cols-3 gap-3 px-5 pt-5">
        {services.map((s) => (
          <Link
            key={s.key}
            to="/service/$type"
            params={{ type: s.key }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand/15 to-brand-red/15 text-brand-red">
              <ServiceIcon type={s.key} />
            </div>
            <span className="text-center text-[11px] font-semibold leading-tight">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
