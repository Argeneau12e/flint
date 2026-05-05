export interface SolanaProvider {
  connect: () => Promise<void>;
  disconnect?: () => Promise<void>;
  publicKey: { toString: () => string } | null;
  signTransaction: (tx: unknown) => Promise<{ serialize: () => Uint8Array }>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
  isPhantom?: boolean;
  isConnected?: boolean;
}

export function getSolanaProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;

  const w = window as unknown as Record<string, unknown>;

  // Phantom (desktop + Phantom mobile in-app browser)
  const phantom = (w.phantom as Record<string, unknown>)?.solana as SolanaProvider | undefined;
  if (phantom?.connect) return phantom;

  // Standard window.solana (Phantom desktop legacy, most wallets)
  const solana = w.solana as SolanaProvider | undefined;
  if (solana?.connect) return solana;

  // Solflare
  const solflare = w.solflare as SolanaProvider | undefined;
  if (solflare?.connect) return solflare;

  // Backpack
  const backpack = (w.backpack as Record<string, unknown>)?.solana as SolanaProvider | undefined;
  if (backpack?.connect) return backpack;

  // Glow
  const glow = w.glow as SolanaProvider | undefined;
  if (glow?.connect) return glow;

  return null;
}

/** True when running in a mobile browser (not a desktop). */
export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

/**
 * Returns true if the page is already running inside Phantom's in-app browser,
 * meaning window.phantom is injected and we can use the wallet normally.
 */
export function isInsidePhantomBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  const phantom = (w.phantom as Record<string, unknown>)?.solana as SolanaProvider | undefined;
  return !!phantom?.connect;
}

export const WALLET_NOT_FOUND_MSG =
  "No Solana wallet found. On desktop: install Phantom or Solflare.";

// ─── Inline Base58 (no extra package needed) ─────────────────────────────────

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function b58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0;
  for (const b of bytes) { if (b !== 0) break; leadingZeros++; }
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let s = "";
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  return "1".repeat(leadingZeros) + s;
}

export function b58Decode(str: string): Uint8Array {
  let n = 0n;
  for (const c of str) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("Invalid base58 character: " + c);
    n = n * 58n + BigInt(i);
  }
  const hex = n === 0n ? "" : n.toString(16).padStart(Math.ceil(n.toString(16).length / 2) * 2, "0");
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  const leadingZeros = str.match(/^1*/)?.[0].length ?? 0;
  return new Uint8Array([...Array(leadingZeros).fill(0), ...bytes]);
}

// ─── Phantom / Solflare Mobile Deeplink Connect Protocol ─────────────────────
//
// Flow:
//  1. App generates an ephemeral Curve25519 keypair (dApp keypair)
//  2. App stores the secret key in sessionStorage, redirects to wallet connect URL
//  3. User approves in their wallet app
//  4. Wallet redirects back to app URL with encrypted response params
//  5. App decrypts response → extracts wallet public key → connected!
//
// This works in any regular mobile browser — no in-app wallet browser needed.

/**
 * Generates an ephemeral Curve25519 keypair for the deeplink connect handshake.
 * Returns base58-encoded public and secret keys.
 */
export async function generateDappKeypair(): Promise<{ publicKey: string; secretKey: string }> {
  // tweetnacl is a transitive dep of @solana/web3.js — always available after npm install
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nacl = ((await import("tweetnacl")) as any).default ?? (await import("tweetnacl"));
  const kp = nacl.box.keyPair();
  return {
    publicKey: b58Encode(kp.publicKey),
    secretKey: b58Encode(kp.secretKey),
  };
}

/**
 * Builds the Phantom mobile deeplink connect URL.
 * Opens Phantom for approval, then redirects back to redirectUrl with wallet info.
 */
export function buildPhantomConnectUrl(
  dappPublicKey: string,
  redirectUrl: string,
  appUrl: string
): string {
  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: dappPublicKey,
    redirect_link: redirectUrl,
    cluster: "devnet",
  });
  return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

/**
 * Builds the Solflare mobile deeplink connect URL.
 * Opens Solflare for approval, then redirects back to redirectUrl with wallet info.
 */
export function buildSolflareConnectUrl(
  dappPublicKey: string,
  redirectUrl: string,
  appUrl: string
): string {
  const params = new URLSearchParams({
    app_url: appUrl,
    dapp_encryption_public_key: dappPublicKey,
    redirect_link: redirectUrl,
    cluster: "devnet",
  });
  return `https://solflare.com/ul/v1/connect?${params.toString()}`;
}

/**
 * Decrypts the wallet connect response from either Phantom or Solflare.
 * walletEncPubKey — the wallet's ephemeral public key (base58)
 * nonce           — the NaCl nonce (base58)
 * data            — the encrypted payload (base58)
 * dappSecretKey   — the dApp's ephemeral secret key stored before redirect (base58)
 *
 * Returns { public_key, session } on success, null on failure.
 */
export async function decryptWalletConnectResponse(
  walletEncPubKey: string,
  nonce: string,
  data: string,
  dappSecretKey: string
): Promise<{ public_key: string; session: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nacl = ((await import("tweetnacl")) as any).default ?? (await import("tweetnacl"));
  try {
    const shared = nacl.box.before(b58Decode(walletEncPubKey), b58Decode(dappSecretKey));
    const plain = nacl.box.open.after(b58Decode(data), b58Decode(nonce), shared);
    if (!plain) return null;
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

// ─── Deep Link URL Builders (for pay page mobile flow) ───────────────────────
//
// These functions build the wallet-specific deep link URLs for mobile users
// who don't have the wallet's in-app browser open.

/**
 * Builds the Phantom mobile deeplink for payment.
 * After user approves, Phantom redirects back to the callbackUrl.
 */
export function getPhantomDeepLink(callbackUrl: string): string {
  const params = new URLSearchParams({
    redirectLink: callbackUrl,
  });
  return `https://phantom.app/ul/browse/${callbackUrl}?${params.toString()}`;
}

/**
 * Builds the Solflare mobile deeplink for payment.
 * After user approves, Solflare redirects back to the callbackUrl.
 */
export function getSolflareDeepLink(callbackUrl: string): string {
  return `https://solflare.com/open-url?url=${encodeURIComponent(callbackUrl)}`;
}
