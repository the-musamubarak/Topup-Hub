import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  User, Lock, Fingerprint, ShieldCheck, Bell, Moon, Languages,
  HelpCircle, MessageCircle, FileText, Gift, LogOut, Trash2, ChevronRight, Copy, ShieldAlert,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, type ComponentType, type SVGProps, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, setTransactionPin, setBiometricPreference } from "@/lib/auth.functions";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_tabs/settings")({
  head: () => ({ meta: [{ title: "Settings — TopUp Hub" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [biometric, setBiometric] = useState<boolean>(false);
  const [twofa, setTwofa] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string | null; phone?: string | null; email?: string | null; referral_code?: string | null; biometric_enabled?: boolean | null } | null>(null);
  const loadProfile = useServerFn(getMyProfile);
  const setPinFn = useServerFn(setTransactionPin);
  const setBiometricFn = useServerFn(setBiometricPreference);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
        try {
        const result = await loadProfile();
        if (mounted) setProfile(result.profile as any);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.biometric_enabled !== undefined) setBiometric(Boolean(profile.biometric_enabled));
  }, [profile]);

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>

      <section className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-lg font-bold text-white shadow-brand">
          {(profile?.full_name ?? "User").charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{profile?.full_name ?? "Customer"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.phone ?? "Not set"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email ?? "Not set"}</p>
        </div>
      </section>

      {/* Profile is read-only in this build — edit removed per product decision. */}

      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-3 rounded-3xl bg-gradient-brand p-4 text-white shadow-brand animate-fade-in"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Open Admin Panel</p>
            <p className="text-xs text-white/85">Overview, analytics, users, services</p>
          </div>
          <ChevronRight size={18} />
        </Link>
      )}

      <Group title="Security">
        <div onClick={() => setChangePassOpen(true)}>
          <Row icon={Lock} label="Change password" />
        </div>
        <div onClick={() => setPinOpen(true)}>
          <Row icon={ShieldCheck} label="Set transaction PIN" />
        </div>
        <Row icon={Fingerprint} label="Biometric login" trailing={<Switch checked={biometric} onCheckedChange={async (v) => { const enabled = Boolean(v); try { await setBiometricFn({ data: { enabled } }); setBiometric(enabled); toast.success("Biometric preference updated"); } catch (e) { toast.error(String((e as Error).message)); } }} />} />
        <Row icon={ShieldCheck} label="Two-factor authentication" trailing={<Switch checked={twofa} onCheckedChange={setTwofa} />} />
      </Group>

      {/* Change password dialog */}
      <Dialog open={changePassOpen} onOpenChange={setChangePassOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>New password</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 rounded-xl" type="password" />
            </div>
            <div className="flex justify-end">
              <Button className="rounded-xl" onClick={async () => {
                try {
                  if (!newPassword || newPassword.length < 8) throw new Error("Password must be at least 8 characters");
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  if (error) throw error;
                  toast.success("Password updated");
                  setChangePassOpen(false);
                  setNewPassword("");
                } catch (e) {
                  toast.error(String((e as Error).message));
                }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set PIN dialog (local demo storage) */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Set transaction PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Enter 4-6 digit PIN</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 rounded-xl" type="password" />
            </div>
            <div>
              <Label>Confirm PIN</Label>
              <Input value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 rounded-xl" type="password" />
            </div>
            <div className="flex justify-end">
              <Button className="rounded-xl" onClick={async () => {
                try {
                  if (!pin || pin.length < 4) throw new Error("PIN must be at least 4 digits");
                  if (pin !== pinConfirm) throw new Error("PINs do not match");
                  await setPinFn({ data: { pin } });
                  toast.success("Transaction PIN saved");
                  setPin(""); setPinConfirm(""); setPinOpen(false);
                } catch (e) {
                  toast.error(String((e as Error).message));
                }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Group title="Preferences">
        <Row icon={Bell} label="Notifications" trailing={<Switch checked={notifs} onCheckedChange={setNotifs} />} />
        <Row
          icon={Moon}
          label="Dark mode"
          trailing={
            <Switch
              checked={dark}
              onCheckedChange={(v) => {
                setDark(v);
                document.documentElement.classList.toggle("dark", v);
              }}
            />
          }
        />
        <Row icon={Languages} label="Language" value="English" />
      </Group>

      <Group title="Support">
        <Row icon={HelpCircle} label="Help center" />
        <Row icon={MessageCircle} label="Contact support" value="WhatsApp / Email" />
        <Row icon={FileText} label="Terms & Privacy" />
      </Group>

      {/* Referral/invite section removed — not using referral system. */}

      <section className="mt-2 flex flex-col gap-2 pb-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Logged out");
            navigate({ to: "/login" });
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-bold text-destructive shadow-card"
        >
          <LogOut size={16} /> Log out
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-bold text-destructive shadow-card">
              <Trash2 size={16} /> Delete account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes your wallet, transaction history, and beneficiaries. Any remaining balance must be withdrawn first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                onClick={() => toast.error("Account deletion requested")}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="divide-y divide-border rounded-3xl bg-card px-4 shadow-card">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  trailing,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-brand-red">
        <Icon width={18} height={18} strokeWidth={2.2} />
      </div>
      <p className="flex-1 text-sm font-semibold text-foreground">{label}</p>
      {trailing ?? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {value && <span>{value}</span>}
          <ChevronRight size={16} />
        </div>
      )}
    </div>
  );
}
