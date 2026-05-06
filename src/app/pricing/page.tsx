"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const IconCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconZap = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconShield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCpu = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M20 9h2M2 15h2M20 15h2" />
  </svg>
);

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      fee: "1%",
      description: "Perfect for trying out Flint",
      features: [
        "Unlimited invoices",
        "1% transaction fee",
        "Escrow protection",
        "Basic analytics",
        "Community support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      fee: "0.5%",
      description: "For growing businesses",
      features: [
        "Everything in Free",
        "0.5% transaction fee",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Business",
      price: "$49",
      period: "/month",
      fee: "0.25%",
      description: "For high-volume sellers",
      features: [
        "Everything in Pro",
        "0.25% transaction fee",
        "Dedicated support",
        "Custom integrations",
        "Volume discounts",
        "White-label options",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button onClick={() => router.push("/")} className="back-btn mb-6">
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl sm:text-5xl font-medium mb-4" style={{ color: "#f7f7f5" }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg" style={{ color: "#aaaaaa", maxWidth: "600px", margin: "0 auto" }}>
            No hidden fees. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-medium rounded-2xl p-8 flex flex-col relative ${
                plan.popular ? "ring-2 ring-[#FF6B2B]" : ""
              }`}
              style={{ background: plan.popular ? "rgba(255,107,43,0.08)" : "rgba(255,255,255,0.03)" }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-medium" style={{ background: "#FF6B2B", color: "#fff" }}>
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-2" style={{ color: "#f7f7f5" }}>{plan.name}</h3>
                <p className="text-sm" style={{ color: "#888" }}>{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-medium" style={{ color: "#FF6B2B" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: "#666" }}>{plan.period}</span>
                </div>
                <p className="text-sm mt-2" style={{ color: "#888" }}>
                  Transaction fee: <span className="font-medium" style={{ color: "#4ade80" }}>{plan.fee}</span>
                </p>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <IconCheck size={18} style={{ color: "#4ade80" }} />
                    <span className="text-sm" style={{ color: "#aaa" }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/")}
                className={`w-full py-4 rounded-xl font-medium transition-all ${
                  plan.popular ? "liquid-btn" : "glass-light"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="glass-medium rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-medium mb-8 text-center" style={{ color: "#f7f7f5" }}>
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4" style={{ color: "#f7f7f5" }}>Feature</th>
                  <th className="text-center py-4 px-4" style={{ color: "#f7f7f5" }}>Free</th>
                  <th className="text-center py-4 px-4" style={{ color: "#FF6B2B" }}>Pro</th>
                  <th className="text-center py-4 px-4" style={{ color: "#f7f7f5" }}>Business</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Transaction Fee", free: "1%", pro: "0.5%", business: "0.25%" },
                  { feature: "Escrow Protection", free: "✓", pro: "✓", business: "✓" },
                  { feature: "Priority Support", free: "✗", pro: "✓", business: "✓" },
                  { feature: "Advanced Analytics", free: "✗", pro: "✓", business: "✓" },
                  { feature: "Custom Branding", free: "✗", pro: "✓", business: "✓" },
                  { feature: "API Access", free: "✗", pro: "✓", business: "✓" },
                  { feature: "White-label", free: "✗", pro: "✗", business: "✓" },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td className="py-4 px-4" style={{ color: "#aaa" }}>{row.feature}</td>
                    <td className="py-4 px-4 text-center" style={{ color: row.free === "✓" ? "#4ade80" : row.free === "✗" ? "#666" : "#aaa" }}>{row.free}</td>
                    <td className="py-4 px-4 text-center" style={{ color: row.pro === "✓" ? "#4ade80" : row.pro === "✗" ? "#666" : "#aaa" }}>{row.pro}</td>
                    <td className="py-4 px-4 text-center" style={{ color: row.business === "✓" ? "#4ade80" : row.business === "✗" ? "#666" : "#aaa" }}>{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="glass-medium rounded-2xl p-8">
          <h2 className="text-2xl font-medium mb-8 text-center" style={{ color: "#f7f7f5" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I upgrade or downgrade anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards and cryptocurrency payments including SOL, USDC, and USDT.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! The Free plan has no time limit, so you can use it forever. Upgrade when you're ready.",
              },
              {
                q: "What happens if I exceed my limits?",
                a: "There are no hard limits on the Free plan. You just pay the standard 1% transaction fee.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <h3 className="text-sm font-medium mb-2" style={{ color: "#f7f7f5" }}>{faq.q}</h3>
                <p className="text-sm" style={{ color: "#888" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
