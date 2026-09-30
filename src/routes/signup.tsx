import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { checkRegistrationAvailability } from "@/lib/auth.functions";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const check = useServerFn(checkRegistrationAvailability);
  const navigate = useNavigate();

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const phoneNorm = `+234${form.phone.replace(/\D/g, "")}`;
      const r = await check({ data: { email: form.email.trim(), phone: phoneNorm } });
      if (r.emailAvailable === false) {
        setBusy(false);
        return toast.error("An account with that email already exists");
      }
      if (r.phoneAvailable === false) {
        setBusy(false);
        return toast.error("An account with that phone number already exists");
      }
    } catch (e) {
      // proceed — server check failed unexpectedly
      console.error(e);
    }
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { full_name: form.name, phone: `+234${form.phone.replace(/\D/g, "")}` },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm");
    navigate({ to: "/login" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-6 pb-10 pt-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft size={18} />
        </Link>
        <BrandLogo showText={false} animate />
        <div className="h-10 w-10" />
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-extrabold text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your TopUp Hub wallet in less than a minute.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Full name" id="name" value={form.name} onChange={(v) => set("name", v)} placeholder="Musa Ibrahim" required />
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <div className="flex items-center gap-2">
            <div className="grid h-12 shrink-0 place-items-center rounded-xl border border-border bg-muted px-3 text-sm font-semibold">
              +234
            </div>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="803 000 0000"
              className="h-12 rounded-xl"
              required
            />
          </div>
        </div>
        <Field label="Email address" id="email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@example.com" required />

        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <div className="relative">
            <Input
              id="pw"
              type={show ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 8 characters"
              className="h-12 rounded-xl pr-11"
              required
              minLength={8}
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
        <Field label="Confirm password" id="pw2" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Re-enter password" required />

        <label className="flex items-start gap-3 pt-1 text-sm text-muted-foreground">
          <Checkbox className="mt-0.5" defaultChecked required />
          <span>
            I agree to the <span className="font-semibold text-brand">Terms</span> &{" "}
            <span className="font-semibold text-brand">Privacy Policy</span>.
          </span>
        </label>

        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? <Loader2 className="animate-spin" size={20} /> : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl"
        required={required}
      />
    </div>
  );
}
