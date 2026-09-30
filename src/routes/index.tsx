import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight, Zap, Tv, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Splash,
});

const slides = [
  {
    icon: Zap,
    title: "Buy airtime & data instantly",
    body: "All networks — MTN, Airtel, Glo, 9mobile — in one tap. No waiting, no failed top-ups.",
  },
  {
    icon: Tv,
    title: "Pay electricity & cable TV",
    body: "DStv, GOtv, Startimes, and every disco. Meter tokens delivered in seconds.",
  },
  {
    icon: LineChart,
    title: "Track every transaction",
    body: "See your wallet, receipts, and pending payments — all in one clean dashboard.",
  },
];

function Splash() {
  const [i, setI] = useState(0);
  const Slide = slides[i].icon;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-6 pb-10 pt-10">
      <div className="flex justify-center">
        <BrandLogo />
      </div>

      <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative flex h-56 w-56 items-center justify-center rounded-[2.5rem] bg-gradient-brand shadow-brand">
          <div className="absolute inset-3 rounded-[2rem] bg-background/10 backdrop-blur-sm" />
          <Slide className="relative z-10 text-white" size={92} strokeWidth={1.6} />
        </div>

        <h1 className="mt-10 text-3xl font-extrabold leading-tight text-foreground">
          {slides[i].title}
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {slides[i].body}
        </p>

        <div className="mt-6 flex items-center gap-2">
          {slides.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                k === i ? "w-8 bg-gradient-brand" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-3">
        {i < slides.length - 1 ? (
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand hover:opacity-95"
            onClick={() => setI(i + 1)}
          >
            Next <ArrowRight className="ml-1" size={18} />
          </Button>
        ) : (
          <Button
            asChild
            size="lg"
            className="h-14 w-full rounded-2xl bg-gradient-brand text-base font-semibold text-white shadow-brand hover:opacity-95"
          >
            <Link to="/signup">Get Started <ArrowRight className="ml-1" size={18} /></Link>
          </Button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          I already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
