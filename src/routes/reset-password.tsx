import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — TopUp Hub" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery hash and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — you're signed in");
    navigate({ to: "/home" });
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
        <h1 className="text-3xl font-extrabold text-foreground">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a password you'll remember. You'll be signed in automatically after.
        </p>
      </div>

      {!ready ? (
        <div className="mt-10 grid place-items-center rounded-3xl bg-card p-8 shadow-card">
          <Loader2 className="animate-spin text-brand" size={26} />
          <p className="mt-3 text-xs text-muted-foreground">
            Verifying reset link… If nothing happens, request a new link.
          </p>
          <Link to="/forgot-password" className="mt-3 text-xs font-semibold text-brand">
            Request new link
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <div className="relative">
              <Input
                id="pw"
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpw">Confirm password</Label>
            <Input
              id="cpw"
              type={show ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand active:scale-[0.98] disabled:opacity-70"
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
