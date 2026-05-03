import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let title = "Invoice";
  let amount = "";
  let token = "";
  let description = "View invoice details on Flint · Powered by Solana";

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://flint-rust.vercel.app";

    const res = await fetch(`${baseUrl}/api/invoice/status?id=${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.invoice) {
        title = data.invoice.title || title;
        amount = String(data.invoice.amount || "");
        token = data.invoice.token || "";
        description = `Invoice: ${title} · ${amount} ${token} · Powered by Flint`;
      }
    }
  } catch {
    // fall through to defaults
  }

  const ogParams = new URLSearchParams({ title, amount, token });
  const ogImage = `https://flint-rust.vercel.app/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · Flint`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Flint`,
      description,
      images: [ogImage],
    },
  };
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
