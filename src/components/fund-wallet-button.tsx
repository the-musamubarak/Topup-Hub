import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initializeWalletFunding } from "@/lib/funding.functions";

export function FundWalletButton() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const initFunding = useServerFn(initializeWalletFunding);

  async function handleFund() {
    if (amount < 100) {
      toast.error("Minimum funding amount is ₦100");
      return;
    }
    setBusy(true);
    try {
      const result = await initFunding({ data: { amount_naira: amount } });
      localStorage.setItem("pending_paystack_funding_reference", result.reference);
      localStorage.setItem("pending_paystack_funding_amount", amount.toString());
      localStorage.setItem("pending_paystack_funding_created_at", Date.now().toString());
      window.location.href = result.authorization_url;
    } catch (e) {
      toast.error(String((e as Error).message));
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 rounded-2xl bg-white px-5 text-sm font-bold text-brand-red hover:bg-white/90"
      >
        Fund wallet
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Fund your wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Amount (₦)</label>
              <Input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="e.g. 5000"
                className="h-12 rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Paystack to complete payment by card, bank transfer, or USSD.
            </p>
            <Button
              onClick={handleFund}
              disabled={busy}
              className="h-12 w-full rounded-xl bg-gradient-brand text-white"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Proceed to pay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
