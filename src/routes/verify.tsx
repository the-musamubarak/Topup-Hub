import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  component: Verify,
});

function Verify() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const done = code.every((c) => c !== "");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-6 pb-10 pt-8">
      <div className="flex items-center justify-between">
        <Link to="/signup" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft size={18} />
        </Link>
        <BrandLogo showText={false} />
        <div className="h-10 w-10" />
      </div>

      <div className="mt-10 flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-white shadow-brand">
          <ShieldCheck size={38} strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-foreground">Verify your number</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Enter the 6-digit code we sent to <span className="font-semibold text-foreground">+234 803 000 0000</span>.
        </p>
      </div>

      <div className="mt-8 flex justify-between gap-2">
        {code.map((val, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={val}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              const next = [...code];
              next[i] = v;
              setCode(next);
              if (v && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            className="h-14 w-full max-w-[48px] rounded-2xl border-2 border-border bg-card text-center text-xl font-bold outline-none transition-all focus:border-brand focus:shadow-brand"
          />
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {seconds > 0 ? (
          <>Resend code in <span className="font-semibold text-foreground">00:{seconds.toString().padStart(2, "0")}</span></>
        ) : (
          <button
            className="font-semibold text-brand"
            onClick={() => {
              setSeconds(30);
              toast.success("A new code has been sent");
            }}
          >
            Resend code
          </button>
        )}
      </p>

      <div className="mt-auto">
        <Button
          disabled={!done}
          onClick={() => {
            toast.success("Account verified");
            navigate({ to: "/home" });
          }}
          className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand hover:opacity-95 disabled:opacity-50"
        >
          Verify & continue
        </Button>
      </div>
    </div>
  );
}
