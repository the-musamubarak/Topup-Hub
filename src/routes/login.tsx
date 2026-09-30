import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    // All users land on the app home first. Admins can open the dashboard from Settings.
    navigate({ to: "/home" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-6 pb-10 pt-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-muted transition-transform active:scale-95">
          <ArrowLeft size={18} />
        </Link>
        <BrandLogo showText={false} animate />
        <div className="h-10 w-10" />
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-extrabold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to continue funding your wallet, paying bills and topping up.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="id">Email address</Label>
          <Input
            id="id"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
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
          <div className="pt-1 text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-brand">
              Forgot password?
            </Link>
          </div>
        </div>

        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? <Loader2 className="animate-spin" size={20} /> : "Log in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-brand">
          Sign up
        </Link>
      </p>
    </div>
  );
}
