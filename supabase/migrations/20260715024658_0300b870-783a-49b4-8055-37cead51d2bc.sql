
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_kobo bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all wallets" ON public.wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('funding','purchase','refund','admin_credit','admin_debit','cashback','referral_bonus','redemption')),
  amount_kobo bigint NOT NULL,
  balance_after_kobo bigint NOT NULL,
  reference text,
  notes text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.wallet_ledger (user_id, created_at DESC);
GRANT SELECT ON public.wallet_ledger TO authenticated;
GRANT ALL ON public.wallet_ledger TO service_role;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own ledger" ON public.wallet_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all ledger" ON public.wallet_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  provider_id text NOT NULL,
  plan_code text,
  recipient text NOT NULL,
  amount_kobo bigint NOT NULL,
  cost_kobo bigint NOT NULL DEFAULT 0,
  margin_kobo bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  clubkonnect_ref text,
  raw_response jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.transactions (user_id, created_at DESC);
CREATE INDEX ON public.transactions (status, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own tx" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all tx" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tx_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  service_type text NOT NULL,
  provider_id text NOT NULL,
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_type, provider_id, identifier)
);
CREATE INDEX ON public.beneficiaries (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own beneficiaries" ON public.beneficiaries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER beneficiaries_updated BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  provider_id text NOT NULL,
  plan_code text,
  label text,
  base_cost_kobo bigint NOT NULL DEFAULT 0,
  markup_kobo bigint NOT NULL DEFAULT 0,
  markup_percent numeric(6,3) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_type, provider_id, plan_code)
);
GRANT SELECT ON public.service_pricing TO authenticated;
GRANT ALL ON public.service_pricing TO service_role;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth reads active pricing" ON public.service_pricing FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage pricing" ON public.service_pricing FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pricing_updated BEFORE UPDATE ON public.service_pricing FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  cta_label text,
  cta_url text,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','active_30d','never_transacted','admins_only','single_user')),
  audience_user_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.broadcast_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, user_id)
);
CREATE INDEX ON public.broadcast_reads (user_id, read_at);
GRANT SELECT, UPDATE ON public.broadcast_reads TO authenticated;
GRANT ALL ON public.broadcast_reads TO service_role;
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own reads" ON public.broadcast_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users mark own reads" ON public.broadcast_reads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view all reads" ON public.broadcast_reads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "auth reads broadcasts targeted to them" ON public.broadcasts FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.broadcast_reads br WHERE br.broadcast_id = broadcasts.id AND br.user_id = auth.uid())
);
CREATE POLICY "admins manage broadcasts" ON public.broadcasts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.loyalty_points (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0,
  lifetime_earned bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own points" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all points" ON public.loyalty_points FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER loyalty_updated BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  points bigint NOT NULL,
  balance_after bigint NOT NULL,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.loyalty_ledger (user_id, created_at DESC);
GRANT SELECT ON public.loyalty_ledger TO authenticated;
GRANT ALL ON public.loyalty_ledger TO service_role;
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own loyalty ledger" ON public.loyalty_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all loyalty ledger" ON public.loyalty_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  before_data jsonb,
  after_data jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.admin_audit_log (created_at DESC);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clubkonnect_balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_kobo bigint NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.clubkonnect_balance_snapshots (created_at DESC);
GRANT SELECT ON public.clubkonnect_balance_snapshots TO authenticated;
GRANT ALL ON public.clubkonnect_balance_snapshots TO service_role;
ALTER TABLE public.clubkonnect_balance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view ck balance" ON public.clubkonnect_balance_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  low_balance_threshold_kobo bigint NOT NULL DEFAULT 500000,
  points_per_naira numeric(6,4) NOT NULL DEFAULT 0.01,
  point_value_kobo numeric(8,4) NOT NULL DEFAULT 100,
  min_redeem_points bigint NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth reads settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.loyalty_points (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

INSERT INTO public.wallets (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.loyalty_points (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
