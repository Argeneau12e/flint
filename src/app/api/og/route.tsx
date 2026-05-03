import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "Payment Request";
  const amount = url.searchParams.get("amount") || "";
  const token = url.searchParams.get("token") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0f0f0f",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Orange accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: "8px", height: "630px",
          background: "#FF6B2B",
        }} />

        {/* Background gradient */}
        <div style={{
          position: "absolute", top: "-100px", right: "-100px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "auto" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "10px",
            background: "rgba(26,26,46,0.8)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "28px", height: "3px", borderRadius: "2px",
              background: "#FF6B2B",
            }} />
          </div>
          <span style={{
            fontSize: "28px", fontWeight: 600, letterSpacing: "0.15em",
            color: "#f7f7f5",
          }}>
            FLINT
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "40px" }}>
          <span style={{
            fontSize: "16px", color: "#888888", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: "16px",
          }}>
            PAYMENT REQUEST
          </span>
          <span style={{
            fontSize: "52px", fontWeight: 600, color: "#f7f7f5",
            lineHeight: 1.1, marginBottom: "24px",
            maxWidth: "900px",
          }}>
            {title}
          </span>
          {amount && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "64px", fontWeight: 700, color: "#FF6B2B" }}>
                {amount}
              </span>
              <span style={{ fontSize: "32px", color: "#888888" }}>
                {token}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto", paddingTop: "32px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: "16px", color: "#555555" }}>
            flint-rust.vercel.app
          </span>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: "20px", padding: "8px 16px",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: "14px", color: "#4ade80" }}>Secured by Solana</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}