"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Pricing page redirects to landing page pricing section
 * All pricing info is now on the main landing page
 */
export default function PricingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/#pricing");
  }, [router]);
  
  return null;
}
