import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const rangeSchema = z.object({
  from: z.string(), // ISO date
  to: z.string(),
});

export const getRevenueSeries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { data: rows } = await context.supabase
      .from("transactions")
      .select("amount_kobo, cost_kobo, margin_kobo, created_at, status")
      .gte("created_at", data.from)
      .lte("created_at", data.to)
      .order("created_at");
    const byDay = new Map<string, { revenue: number; cost: number; profit: number; count: number }>();
    for (const r of rows ?? []) {
      if (r.status !== "success") continue;
      const day = new Date(r.created_at as string).toISOString().slice(0, 10);
      const cur = byDay.get(day) ?? { revenue: 0, cost: 0, profit: 0, count: 0 };
      cur.revenue += Number(r.amount_kobo) / 100;
      cur.cost += Number(r.cost_kobo) / 100;
      cur.profit += Number(r.margin_kobo) / 100;
      cur.count += 1;
      byDay.set(day, cur);
    }
    const series = Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));
    const totals = series.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.revenue,
        cost: acc.cost + s.cost,
        profit: acc.profit + s.profit,
        count: acc.count + s.count,
      }),
      { revenue: 0, cost: 0, profit: 0, count: 0 },
    );
    return { series, totals };
  });
