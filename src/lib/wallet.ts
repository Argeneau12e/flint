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

  // Phantom (desktop + Phantom mobile browser)
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

export const WALLET_NOT_FOUND_MSG =
  "No Solana wallet found. Please install Phantom, Solflare, or Backpack.";
