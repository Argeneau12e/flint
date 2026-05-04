"use client";

import { useRouter } from "next/navigation";

export default function EmbedDemoPage() {
  const router = useRouter();

  const params = [
    { param: "data-amount", desc: "Payment amount", required: true },
    { param: "data-token", desc: "SOL or USDC", required: true },
    { param: "data-wallet", desc: "Your Solana wallet address", required: true },
    { param: "data-label", desc: "Button label text", required: false },
    { param: "data-memo", desc: "Payment memo stored on-chain", required: false },
    { param: "data-theme", desc: "dark or orange", required: false },
  ];

  const codeSnippet = `<script
  src="https://flint-rust.vercel.app/embed.js"
  data-amount="10"
  data-token="USDC"
  data-wallet="YOUR_WALLET_ADDRESS"
  data-label="Pay Now"
  data-memo="Payment for services"
></script>`;

  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">

      <div className="mb-12">
        <button
          onClick={() => router.push("/")}
          style={{ color: "var(--spark)", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}
        >
          Back to Flint
        </button>
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}
          >
            EMBED
          </div>
        </div>
        <h1
          className="text-4xl font-medium tracking-wide mb-4"
          style={{ color: "var(--chalk)" }}
        >
          Flint Commerce Button
        </h1>
        <p className="text-lg" style={{ color: "#888888" }}>
          Add a Solana payment button to any website with one line of HTML.
          No backend. No wallet setup. Just paste and go.
        </p>
      </div>

      <div
        className="rounded-2xl p-8 mb-8"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          How to Use
        </p>
        <p className="text-sm mb-4" style={{ color: "#888888" }}>
          Paste this single line anywhere in your HTML:
        </p>
        <div
          className="p-4 rounded-xl overflow-x-auto"
          style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
        >
          <pre className="text-xs" style={{ color: "var(--spark)", lineHeight: "1.8" }}>
            {codeSnippet}
          </pre>
        </div>
      </div>

      <div
        className="rounded-2xl p-8 mb-8"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Parameters
        </p>
        <div className="flex flex-col gap-3">
          {params.map((item) => (
            <div
              key={item.param}
              className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
            >
              <code className="text-sm" style={{ color: "var(--spark)", minWidth: "160px" }}>
                {item.param}
              </code>
              <p className="text-sm flex-1" style={{ color: "#aaaaaa" }}>
                {item.desc}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: item.required ? "#1a1a0a" : "#0f0f0f",
                  color: item.required ? "var(--spark)" : "#555555",
                  border: `1px solid ${item.required ? "var(--spark)" : "#2a2a2a"}`,
                }}
              >
                {item.required ? "required" : "optional"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-8"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          What happens when clicked
        </p>
        <div className="flex flex-col gap-3">
          {[
            "Script creates a Flint invoice automatically",
            "Opens the payment page in a new tab",
            "Payer connects Phantom and signs the transaction",
            "Payment settles on Solana in under 1 second",
            "On-chain receipt generated automatically",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: "#1a1a0a", color: "var(--spark)", border: "1px solid var(--spark)" }}
              >
                {i + 1}
              </div>
              <p className="text-sm" style={{ color: "#aaaaaa" }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "#333333" }}>
        Flint Commerce Button · Open source · MIT License
      </p>

    </main>
  );
}