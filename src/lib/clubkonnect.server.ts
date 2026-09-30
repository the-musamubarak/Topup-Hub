// Server-only ClubKonnect API wrapper. Never import from client code.
// ClubKonnect endpoints are GET-based, live at nellobytesystems.com and
// accept UserID + APIKey as query parameters.

const BASE = "https://www.nellobytesystems.com";

function creds() {
  const UserID = process.env.CLUBKONNECT_USER_ID;
  const APIKey = process.env.CLUBKONNECT_API_KEY;
  if (!UserID || !APIKey) {
    throw new Error("ClubKonnect credentials not configured");
  }
  return { UserID, APIKey };
}

async function ckGet(path: string, params: Record<string, string | number> = {}) {
  const { UserID, APIKey } = creds();
  const qs = new URLSearchParams({ UserID, APIKey, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const url = `${BASE}/${path}?${qs.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* text response */ }
  return { ok: res.ok, status: res.status, text, json };
}

export async function ckWalletBalance(): Promise<{ balanceNaira: number; raw: unknown }> {
  const r = await ckGet("APIWalletBalanceV1.asp");
  // Response can be JSON like {"WALLET_BALANCE":"1234.56"} or plain text "1234.56"
  let balance = 0;
  if (r.json && typeof r.json === "object" && r.json !== null) {
    const obj = r.json as Record<string, unknown>;
    const v = obj.WALLET_BALANCE ?? obj.balance ?? obj.Balance;
    balance = Number(String(v ?? 0)) || 0;
  } else if (r.text) {
    balance = Number(r.text.trim()) || 0;
  }
  return { balanceNaira: balance, raw: r.json ?? r.text };
}

export async function ckBuyAirtime(opts: { networkId: string; amountNaira: number; phone: string; requestId: string }) {
  // Networks: MTN=01, GLO=02, 9mobile=03, Airtel=04 (per ClubKonnect docs)
  const map: Record<string, string> = { mtn: "01", glo: "02", "9mobile": "03", airtel: "04" };
  const MobileNetwork = map[opts.networkId] ?? opts.networkId;
  return ckGet("APIAirtimeV1.asp", {
    MobileNetwork,
    Amount: opts.amountNaira,
    MobileNumber: opts.phone,
    RequestID: opts.requestId,
  });
}

export async function ckBuyData(opts: { networkId: string; productCode: string; phone: string; requestId: string }) {
  const map: Record<string, string> = { mtn: "01", glo: "02", "9mobile": "03", airtel: "04" };
  return ckGet("APIDatabundleV1.asp", {
    MobileNetwork: map[opts.networkId] ?? opts.networkId,
    DataPlan: opts.productCode,
    MobileNumber: opts.phone,
    RequestID: opts.requestId,
  });
}

export async function ckBuyCable(opts: { providerId: string; productCode: string; smartcard: string; phone: string; requestId: string }) {
  return ckGet("APICableTVV1.asp", {
    CableTV: opts.providerId,
    Package: opts.productCode,
    SmartCardNo: opts.smartcard,
    PhoneNo: opts.phone,
    RequestID: opts.requestId,
  });
}

export async function ckBuyElectricity(opts: { discoId: string; meterType: "01" | "02"; meter: string; amountNaira: number; phone: string; requestId: string }) {
  return ckGet("APIElectricityV1.asp", {
    ElectricCompany: opts.discoId,
    MeterType: opts.meterType,
    MeterNo: opts.meter,
    Amount: opts.amountNaira,
    PhoneNo: opts.phone,
    RequestID: opts.requestId,
  });
}
