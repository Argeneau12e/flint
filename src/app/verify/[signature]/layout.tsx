import type { Metadata } from "next";

interface Props {
  params: Promise<{ signature: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signature } = await params;

  let title = "Payment Verified";
  let amount = "";
  let token = "";
  let description = "A payment has been verified on the Solana blockchain · Powered by Flint";

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://flint-rust.vercel.app";

    const res = await fetch(`${baseUrl}/api/verify?signature=${signature}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.txSignature) {
        title = data.title || "Payment Verified";
        amount = String(data.amount || "");
        token = data.token || "";
        description = `${amount} ${token} verified on Solana · ${title} · Powered by Flint`;
      }
    }
  } catch {
    // fall through to defaults
  }

  const ogParams = new URLSearchParams({ title: `✓ ${title}`, amount, token });
  const ogImage = `https://flint-rust.vercel.app/api/og?${ogParams.toString()}`;

  return {
    title: `Receipt · ${title}`,
    description,
    openGraph: {
      title: `✓ ${title} · Flint`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `✓ ${title} · Flint`,
      description,
      images: [ogImage],
    },
  };
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
