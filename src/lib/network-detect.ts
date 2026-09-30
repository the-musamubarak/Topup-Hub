// Nigerian mobile-network prefix detection. Includes commonly-ported ranges.
// Returns a network id ("mtn" | "airtel" | "glo" | "9mobile") or null.

const PREFIX_MAP: Record<string, "mtn" | "airtel" | "glo" | "9mobile"> = {};

const add = (id: "mtn" | "airtel" | "glo" | "9mobile", prefixes: string[]) => {
  prefixes.forEach((p) => (PREFIX_MAP[p] = id));
};

add("mtn", ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916", "07025", "07026", "0704"]);
add("airtel", ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901", "0912", "0904"]);
add("glo", ["0805", "0807", "0705", "0815", "0811", "0905", "0915"]);
add("9mobile", ["0809", "0817", "0818", "0908", "0909"]);

export function detectNetwork(phone: string): "mtn" | "airtel" | "glo" | "9mobile" | null {
  const clean = phone.replace(/\D/g, "");
  let normalized = clean;
  if (normalized.startsWith("234")) normalized = "0" + normalized.slice(3);
  if (normalized.startsWith("+234")) normalized = "0" + normalized.slice(4);
  if (!normalized.startsWith("0")) normalized = "0" + normalized;
  if (normalized.length < 4) return null;
  // longest prefix match
  for (let len = 5; len >= 4; len--) {
    const key = normalized.slice(0, len);
    if (PREFIX_MAP[key]) return PREFIX_MAP[key];
  }
  return null;
}
