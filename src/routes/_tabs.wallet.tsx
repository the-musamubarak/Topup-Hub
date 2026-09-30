import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getMyLedger, getMyWallet } from "@/lib/wallet.functions";
import { verifyWalletFunding } from "@/lib/funding.functions";
import { Button } from "@/components/ui/button";
import { FundWalletButton } from "@/components/fund-wallet-button";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_tabs/wallet")({
  head: () => ({ meta: [{ title: "Wallet — TopUp Hub" }] }),
  component: WalletPage,
});

function WalletPage() {
  const [hide, setHide] = useState(false);
  const [balanceKobo, setBalanceKobo] = useState<number | null>(null);
  
  const [ledger, setLedger] = useState<Array<{ id: string; type: string; amount_kobo: number; balance_after_kobo: number; notes: string | null; reference: string | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const walletFn = useServerFn(getMyWallet);
  const ledgerFn = useServerFn(getMyLedger);
  const verifyFundingFn = useServerFn(verifyWalletFunding);

  useEffect(() => {
    let mounted = true;

    (async () => {

      const [walletResult, ledgerResult] = await Promise.allSettled([
        walletFn(),
        ledgerFn(),
      ]);

      if (!mounted) return;

      if (walletResult.status === "fulfilled") setBalanceKobo(walletResult.value.balance_kobo ?? 0);
      if (ledgerResult.status === "fulfilled") setLedger(ledgerResult.value ?? []);

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [walletFn, ledgerFn]);

  useEffect(() => {
    const pendingReference = localStorage.getItem("pending_paystack_funding_reference");
    const pendingAmount = localStorage.getItem("pending_paystack_funding_amount");

    if (pendingReference && pendingAmount) {
      setPendingReference(pendingReference);
      setPendingAmount(Number(pendingAmount));
      setPendingMessage("Awaiting Paystack confirmation");
    }
  }, []);

  useEffect(() => {
    if (!pendingReference) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const checkStatus = async () => {
      setCheckingPending(true);
      try {
        const result = await verifyFundingFn({ data: { reference: pendingReference } });

        if (result.credited) {
          const wallet = await walletFn();
          const ledgerRows = await ledgerFn();
          setBalanceKobo(wallet.balance_kobo ?? 0);
          setLedger(ledgerRows ?? []);
          clearPendingFunding();
          setPendingMessage(null);
          toast.success("Wallet funding completed successfully");
          return;
        }

        if (result.status === "pending") {
          setPendingMessage("Still awaiting Paystack confirmation");
          return;
        }

        setPendingMessage("Payment was not completed. Please try again.");
        clearPendingFunding();
      } catch (error) {
        setPendingMessage("Unable to verify payment yet. Refresh to try again.");
      } finally {
        setCheckingPending(false);
      }
    };

    const clearPendingFunding = () => {
      localStorage.removeItem("pending_paystack_funding_reference");
      localStorage.removeItem("pending_paystack_funding_amount");
      localStorage.removeItem("pending_paystack_funding_created_at");
      setPendingReference(null);
      setPendingAmount(null);
    };

    checkStatus();
    interval = setInterval(checkStatus, 15000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pendingReference, walletFn, ledgerFn, verifyFundingFn]);

  const balanceAmount = balanceKobo !== null ? balanceKobo / 100 : 0;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-extrabold text-foreground">Wallet</h1>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand p-6 text-white shadow-brand">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider opacity-85">Available balance</p>
              <button
                onClick={() => setHide(!hide)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/15"
              >
                {hide ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {loading ? (
              <div className="mt-2 h-10 w-48 rounded skeleton bg-white/20" />
            ) : (
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {hide ? "₦ ••••••" : formatNaira(balanceAmount)}
              </p>
            )}
            {loading ? (
              <div className="mt-1 h-3 w-36 rounded skeleton" />
            ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3">
            <FundWalletButton />
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white">
              <p className="font-semibold">Paystack wallet funding</p>
              <p className="mt-1 text-xs text-muted-foreground">Use Paystack to fund your wallet instantly via card, bank transfer, or USSD.</p>
            </div>
          </div>
        </div>
      </section>

      {pendingReference && pendingAmount !== null && (
        <section className="rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-card">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Pending deposit</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We are checking your Paystack payment. The balance will refresh automatically once the deposit completes.
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>
            <div className="grid gap-2 rounded-2xl bg-white p-4">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-semibold text-foreground">{formatNaira(pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">Reference: <span className="font-mono text-[11px] text-foreground">{pendingReference}</span></p>
              <p className="text-xs text-muted-foreground">Status: {pendingMessage ?? "Awaiting confirmation"}</p>
              <Button
                onClick={async () => {
                  setCheckingPending(true);
                  try {
                    const result = await verifyFundingFn({ data: { reference: pendingReference } });
                    if (result.credited) {
                      const wallet = await walletFn();
                      const ledgerRows = await ledgerFn();
                      setBalanceKobo(wallet.balance_kobo ?? 0);
                      setLedger(ledgerRows ?? []);
                      localStorage.removeItem("pending_paystack_funding_reference");
                      localStorage.removeItem("pending_paystack_funding_amount");
                      localStorage.removeItem("pending_paystack_funding_created_at");
                      setPendingReference(null);
                      setPendingAmount(null);
                      setPendingMessage(null);
                      toast.success("Wallet funding completed successfully");
                      return;
                    }
                    setPendingMessage(result.status === "pending" ? "Still awaiting Paystack confirmation" : "Payment was not completed. Please try again.");
                  } catch {
                    setPendingMessage("Unable to verify payment yet. Refresh to try again.");
                  } finally {
                    setCheckingPending(false);
                  }
                }}
                disabled={checkingPending}
                className="mt-2 h-10 rounded-xl bg-gradient-brand text-white"
              >
                {checkingPending ? "Checking..." : "Refresh status"}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-card p-4 shadow-card">
        <p className="mb-3 px-1 text-sm font-bold text-foreground">Funding history</p>
        <div className="divide-y divide-border">
          {loading ? (
            <>
              <div className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-2xl skeleton" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-40 rounded skeleton" />
                  <div className="mt-1 h-3 w-28 rounded skeleton" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 rounded skeleton" />
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-2xl skeleton" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-40 rounded skeleton" />
                  <div className="mt-1 h-3 w-28 rounded skeleton" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 rounded skeleton" />
                </div>
              </div>
            </>
          ) : (
            ledger.map((f) => {
            const method =
              f.type === "funding"
                ? "Wallet deposit"
                : f.type === "purchase"
                ? "Service purchase"
                : f.type === "refund"
                ? "Refund"
                : f.type === "admin_credit"
                ? "Admin credit"
                : f.type === "admin_debit"
                ? "Admin debit"
                : f.type;
            return (
              <div key={f.id} className="flex items-center gap-3 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-brand-red">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{method}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{formatNaira(f.amount_kobo / 100)}</p>
                  <StatusBadge status="success" className="mt-0.5" />
                </div>
              </div>
            );
            })
          )}
        </div>
      </section>

    </div>
  );
}

