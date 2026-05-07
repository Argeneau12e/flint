"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "FREE",
      price: 0,
      description: "Perfect for getting started",
      color: "#888888",
      features: [
        "Up to $1,000 monthly volume",
        "10 invoices per month",
        "5 AI analyses per month",
        "1% escrow fee",
        "Basic support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "PRO",
      price: billingCycle === "monthly" ? 9.99 : 99.99,
      description: "For growing businesses",
      color: "#4A90D9",
      features: [
        "Up to $10,000 monthly volume",
        "100 invoices per month",
        "50 AI analyses per month",
        "0.5% escrow fee",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "BUSINESS",
      price: billingCycle === "monthly" ? 49.99 : 499.99,
      description: "For high-volume users",
      color: "#FFD700",
      features: [
        "Up to $50,000 monthly volume",
        "1,000 invoices per month",
        "500 AI analyses per month",
        "0.25% escrow fee",
        "24/7 priority support",
        "White-label options",
        "API access",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <main className="min-h-screen px-4 py-16" style={{ background: "#0f0f0f" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#fff" }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg mb-8" style={{ color: "#888" }}>
            Choose the plan that fits your needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm font-medium ${billingCycle === "monthly" ? "text-white" : "text-gray-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-14 h-7 rounded-full relative transition-colors"
              style={{
                background: billingCycle === "monthly" ? "rgba(255,255,255,0.2)" : "#4ade80",
              }}
            >
              <div
                className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                style={{
                  left: billingCycle === "monthly" ? "4px" : "36px",
                }}
              />
            </button>
            <span
              className={`text-sm font-medium ${billingCycle === "yearly" ? "text-white" : "text-gray-500"}`}
            >
              Yearly <span className="text-green-400 text-xs">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-6 relative"
              style={{
                background: plan.highlighted
                  ? `linear-gradient(135deg, ${plan.color}11 0%, ${plan.color}05 100%)`
                  : "rgba(255,255,255,0.03)",
                border: plan.highlighted
                  ? `2px solid ${plan.color}`
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {plan.highlighted && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: plan.color,
                    color: "#000",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: plan.color }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold" style={{ color: "#fff" }}>
                    ${plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "#888" }}>
                    /{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <p className="text-sm mt-2" style={{ color: "#888" }}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: plan.color }}
                    >
                      <CheckIcon />
                    </span>
                    <span className="text-sm" style={{ color: "#ccc" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push("/create")}
                className="w-full py-3 rounded-xl font-semibold transition-all"
                style={{
                  background: plan.highlighted
                    ? `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}cc 100%)`
                    : "rgba(255,255,255,0.1)",
                  color: plan.highlighted ? "#000" : "#fff",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "#fff" }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "What happens if I exceed my monthly limit?",
                a: "You'll be notified when approaching your limit. Invoices created within the limit remain active. Upgrade anytime to continue creating new invoices.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "Is the escrow fee really non-refundable?",
                a: "Yes. The fee covers escrow protection, platform maintenance, and dispute resolution services. It's charged when the escrow is funded.",
              },
              {
                q: "Do you offer discounts for nonprofits?",
                a: "Yes! Contact us at hello@flint.com for special nonprofit pricing.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: "#fff" }}>
                  {faq.q}
                </h3>
                <p className="text-sm" style={{ color: "#888" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
