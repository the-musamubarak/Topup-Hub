export const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type TxStatus = "success" | "pending" | "failed" | "refunded";
export type Transaction = {
  id: string;
  service: string;
  category: "airtime" | "data" | "cable" | "electricity" | "epin" | "exam" | "wallet";
  description: string;
  amount: number;
  status: TxStatus;
  date: string;
  reference: string;
};

export const mockUser = {
  name: "Musa",
  fullName: "Musa Ibrahim",
  email: "musa@topuphub.ng",
  phone: "+234 803 555 0142",
  balance: 12450,
  referralCode: "TUH-MUSA24",
};

export const networks = [
  { id: "mtn", name: "MTN", color: "#FFCC00", initials: "MTN" },
  { id: "airtel", name: "Airtel", color: "#E60000", initials: "AIR" },
  { id: "glo", name: "Glo", color: "#00B140", initials: "GLO" },
  { id: "9mobile", name: "9mobile", color: "#006C35", initials: "9MB" },
];

export const cableProviders = [
  { id: "dstv", name: "DStv" },
  { id: "gotv", name: "GOtv" },
  { id: "startimes", name: "Startimes" },
  { id: "showmax", name: "Showmax" },
];

export const discos = [
  { id: "ikeja", name: "Ikeja Electric" },
  { id: "eko", name: "Eko Electric" },
  { id: "abuja", name: "Abuja Electric" },
  { id: "ph", name: "PH Electric" },
  { id: "ibadan", name: "Ibadan Electric" },
  { id: "kano", name: "Kano Electric" },
];

export const dataBundles = [
  { id: "d1", label: "1GB • 30 days", price: 350 },
  { id: "d2", label: "2GB • 30 days", price: 700 },
  { id: "d3", label: "5GB • 30 days", price: 1500 },
  { id: "d4", label: "10GB • 30 days", price: 2900 },
  { id: "d5", label: "20GB • 30 days", price: 5500 },
];

export const mockTransactions: Transaction[] = [
  { id: "1", service: "MTN Airtime", category: "airtime", description: "0803 555 0142", amount: 1000, status: "success", date: new Date(Date.now() - 1000 * 60 * 32).toISOString(), reference: "TUH-A-8821" },
  { id: "2", service: "DStv Compact", category: "cable", description: "IUC 7028339210", amount: 12400, status: "success", date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), reference: "TUH-C-8802" },
  { id: "3", service: "Ikeja Electric", category: "electricity", description: "Meter 4501 8823 771", amount: 5000, status: "pending", date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), reference: "TUH-E-8790" },
  { id: "4", service: "Airtel 2GB Data", category: "data", description: "0902 118 4400", amount: 700, status: "success", date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), reference: "TUH-D-8712" },
  { id: "5", service: "Smile Data 5GB", category: "data", description: "Smile ID: 8823771", amount: 3000, status: "failed", date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), reference: "TUH-D-8622" },
  { id: "6", service: "WAEC Result Pin", category: "exam", description: "1 pin", amount: 3400, status: "success", date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), reference: "TUH-X-8514" },
  { id: "7", service: "Wallet Funded", category: "wallet", description: "Bank transfer • GTB", amount: 10000, status: "success", date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), reference: "TUH-W-8410" },
];

export const fundingHistory = [
  { id: "f1", method: "Bank Transfer", amount: 10000, date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), status: "success" as TxStatus },
  { id: "f2", method: "Card • Verve", amount: 5000, date: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(), status: "success" as TxStatus },
  { id: "f3", method: "USSD", amount: 2500, date: new Date(Date.now() - 1000 * 60 * 60 * 480).toISOString(), status: "success" as TxStatus },
];

export const virtualAccount = {
  bank: "Wema Bank (TopUp Hub)",
  number: "9042185503",
  name: "MUSA IBRAHIM / TOPUPHUB",
};