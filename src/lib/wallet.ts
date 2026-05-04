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

/**
 * Generates the Phantom universal link to open a URL inside Phantom's
 * in-app browser on mobile. Once open, window.phantom.solana IS available.
 *
 * Format: https://phantom.app/ul/browse/{encodedUrl}?ref={encodedRef}
 */
export function getPhantomDeepLink(targetUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  const ref = encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin : "https://flint.pay"
  );
  return `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
}

/**
 * Generates the Solflare mobile deep link to open a URL in Solflare's browser.
 */
export function getSolflareDeepLink(targetUrl: string): string {
  return `https://solflare.com/ul/browse/${encodeURIComponent(targetUrl)}`;
}

export const WALLET_NOT_FOUND_MSG =
  "No Solana wallet found. On desktop: install Phantom or Solflare. On mobile: use the button below to open this page inside your wallet app.";
