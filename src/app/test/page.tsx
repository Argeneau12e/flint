"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
  const [testType, setTestType] = useState<"qvac" | "escrow" | "private-pay">("qvac");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // Get base URL only on client side
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Test form state
  const [invoiceId, setInvoiceId] = useState("test-invoice-123");
  const [amount, setAmount] = useState("1000");
  const [token, setToken] = useState("USDT");
  const [recipient, setRecipient] = useState("8xKz...test");
  const [conditions, setConditions] = useState("Deliver by May 15");

  // Don't render until we have base URL (client-side)
  if (!baseUrl) {
    return (
      <main className="min-h-screen px-5 sm:px-8 py-10 flex items-center justify-center" style={{ background: "#0f0f0f", color: "#f7f7f5" }}>
        <div>Loading...</div>
      </main>
    );
  }

  const runTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response: Response;
      let url: string;

      if (testType === "qvac") {
        url = `${baseUrl}/api/qvac-status`;
        response = await fetch(url);
      } else if (testType === "escrow") {
        url = `${baseUrl}/api/escrow/confidential`;
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            token,
            recipient,
            conditions,
            title: "Test Confidential Escrow",
          }),
        });
      } else if (testType === "private-pay") {
        url = `${baseUrl}/api/agent/private-pay`;
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId,
            agentWallet: "TestAgent123",
            privateMode: true,
          }),
        });
      } else {
        throw new Error("Invalid test type");
      }

      const data = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10" style={{ background: "#0f0f0f", color: "#f7f7f5" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-medium mb-2">Flint Integration Test Page</h1>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Test QVAC, Umbra, and Private Payments visually
        </p>

        {/* Test Type Selector */}
        <div className="flex gap-2 mb-6" style={{ background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "12px" }}>
          {[
            { id: "qvac", label: "QVAC Status" },
            { id: "escrow", label: "Confidential Escrow" },
            { id: "private-pay", label: "Private Payment" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTestType(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                testType === t.id
                  ? "bg-[#FF6B2B] text-white"
                  : "hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Test Form */}
        <div className="glass-medium rounded-2xl p-6 mb-6">
          {testType === "qvac" && (
            <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>
              <p>QVAC Status Check - No configuration needed</p>
            </div>
          )}

          {testType === "escrow" && (
            <div className="grid gap-4">
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-[#FF6B2B]"
                />
              </div>
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Token</label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-[#FF6B2B]"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Recipient Wallet</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-[#FF6B2B]"
                />
              </div>
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Conditions</label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-[#FF6B2B]"
                />
              </div>
            </div>
          )}

          {testType === "private-pay" && (
            <div className="grid gap-4">
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Invoice ID</label>
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-[#FF6B2B]"
                />
              </div>
              <div>
                <label style={{ color: "#888", fontSize: "12px", marginBottom: "4px", display: "block" }}>Agent Wallet</label>
                <input
                  type="text"
                  value="TestAgent123"
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privateMode"
                  checked
                  disabled
                  className="rounded"
                />
                <label htmlFor="privateMode" style={{ color: "#888" }}>
                  Private Mode (Umbra)
                </label>
              </div>
            </div>
          )}

          <button
            onClick={runTest}
            disabled={loading}
            className="w-full mt-4 px-6 py-3 rounded-xl font-medium transition-all"
            style={{
              background: loading ? "rgba(255,255,255,0.2)" : "#FF6B2B",
              color: "white",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Running Test..." : "Run Test"}
          </button>
        </div>

        {/* Results */}
        {(loading || error || result) && (
          <div className="glass-medium rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4">Test Results</h2>

            {loading && <p style={{ color: "#888" }}>Loading...</p>}

            {error && (
              <div style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.3)", padding: "16px", borderRadius: "8px" }}>
                <p style={{ color: "#FF6B2B", fontWeight: "bold", marginBottom: "8px" }}>Error</p>
                <pre style={{ color: "#888", fontSize: "12px", overflow: "auto", whiteSpace: "pre-wrap" }}>{error}</pre>
              </div>
            )}

            {result && !error && (
              <div>
                {/* Success Indicators */}
                {testType === "qvac" && result.qvacReady && (
                  <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    ✅ <strong>QVAC is working!</strong> Local AI is ready
                  </div>
                )}

                {testType === "escrow" && result.confidential && result.umbraUsed && (
                  <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    ✅ <strong>Umbra Confidential Escrow working!</strong> Privacy features enabled
                  </div>
                )}

                {testType === "private-pay" && result.privacy && (
                  <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                    ✅ <strong>Private Payment working!</strong> QVAC + Umbra integration confirmed
                  </div>
                )}

                {/* JSON Output */}
                <details>
                  <summary style={{ color: "#888", cursor: "pointer", marginBottom: "12px" }}>
                    View Full Response
                  </summary>
                  <pre style={{ background: "rgba(0,0,0,0.5)", padding: "12px", borderRadius: "8px", fontSize: "11px", overflow: "auto", color: "#4ade80" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-xs" style={{ color: "#666" }}>
          <p><strong>Testing Guide:</strong></p>
          <ul className="ml-4 mt-2 space-y-1">
            <li>1️⃣ Select test type (QVAC, Escrow, or Private Payment)</li>
            <li>2️⃣ Fill in form fields (if applicable)</li>
            <li>3️⃣ Click "Run Test"</li>
            <li>4️⃣ Look for green checkmarks ✅</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
