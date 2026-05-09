"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div 
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)' }}
        >
          <svg className="w-10 h-10 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium mb-4" style={{ color: "var(--chalk)" }}>
          Payment Released!
        </h1>
        
        <p className="text-lg mb-2" style={{ color: "#4ade80" }}>
          ✅ Bob has been paid
        </p>
        
        <p className="text-sm mb-8" style={{ color: "#888" }}>
          Thank you for completing this transaction. A confirmation has been sent to your WhatsApp.
        </p>

        {/* What's Next */}
        <div 
          className="p-5 rounded-2xl mb-8 text-left"
          style={{ background: 'rgba(15,15,15,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "#666" }}>
            What's Next?
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: "#888" }}>
            <li className="flex items-start gap-2">
              <span style={{ color: "#4ade80" }}>•</span>
              <span>You can download a receipt for your records</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "#4ade80" }}>•</span>
              <span>Bob will receive your payment within seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "#4ade80" }}>•</span>
              <span>Need more work? Bob can create another invoice anytime</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 rounded-xl font-medium text-white liquid-btn"
            style={{ fontSize: "15px", minHeight: "54px" }}
          >
            Back to Home
          </button>
          
          <p className="text-xs" style={{ color: "#444" }}>
            Redirecting in {countdown}s...
          </p>
        </div>
      </div>
    </main>
  );
}
