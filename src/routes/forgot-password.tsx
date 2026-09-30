import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — TopUp Hub" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for the reset link");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-6 pb-10 pt-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/login" className="grid h-10 w-10 place-items-center rounded-full bg-muted active:scale-95">
          <ArrowLeft size={18} />
        </Link>
        <BrandLogo showText={false} animate />
        <div className="h-10 w-10" />
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-extrabold text-foreground">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email and we'll send you a secure link to set a new password.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-3xl bg-card p-6 text-center shadow-card animate-scale-in">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <MailCheck size={26} />
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">Email sent</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a reset link to <span className="font-semibold text-foreground">{email}</span>. It may take a minute — check spam too.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-brand px-5 text-sm font-semibold text-white shadow-brand"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand active:scale-[0.98] disabled:opacity-70"
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </div>
  );
}
