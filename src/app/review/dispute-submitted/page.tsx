"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DisputeSubmittedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

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
        {/* Info Icon */}
        <div 
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(255,184,0,0.15)', border: '2px solid rgba(255,184,0,0.3)' }}
        >
          <svg className="w-10 h-10 text-[#FFB800]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium mb-4" style={{ color: "var(--chalk)" }}>
          Dispute Submitted
        </h1>
        
        <p className="text-lg mb-2" style={{ color: "#FFB800" }}>
          ⚠️ Under Review
        </p>
        
        <p className="text-sm mb-8" style={{ color: "#888" }}>
          Our AI has received your dispute and will analyze both sides. You'll hear back within 24-48 hours.
        </p>

        {/* What Happens Next */}
        <div 
          className="p-5 rounded-2xl mb-8 text-left"
          style={{ background: 'rgba(15,15,15,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "#666" }}>
            What Happens Next?
          </h2>
          <ol className="space-y-3 text-sm" style={{ color: "#888" }}>
            <li className="flex items-start gap-2">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(255,184,0,0.2)', color: '#FFB800' }}
              >
                1
              </span>
              <span>Bob will be notified and asked to submit evidence</span>
            </li>
            <li className="flex items-start gap-2">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(255,184,0,0.2)', color: '#FFB800' }}
              >
                2
              </span>
              <span>Our AI analyzes both submissions (usually within hours)</span>
            </li>
            <li className="flex items-start gap-2">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(255,184,0,0.2)', color: '#FFB800' }}
              >
                3
              </span>
              <span>You'll receive a decision via WhatsApp with next steps</span>
            </li>
          </ol>
        </div>

        {/* Important Note */}
        <div 
          className="p-4 rounded-xl mb-8 text-left"
          style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
        >
          <p className="text-sm" style={{ color: '#FFB800' }}>
            💡 Funds remain secured until the dispute is resolved. Neither party can access them during review.
          </p>
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

        {/* Support */}
        <p className="text-xs mt-6" style={{ color: "#333" }}>
          Need immediate help? Email support@flint.pay
        </p>
      </div>
    </main>
  );
}
