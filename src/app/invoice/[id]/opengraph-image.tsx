import { ImageResponse } from "next/og";
import { getInvoice } from "@/lib/store";

export const runtime = "edge";
export const alt = "Flint Payment Request";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id);
  const title = invoice?.title || "Payment Request";
  const amount = invoice?.amount?.toString() || "";
  const token = invoice?.token || "";

  const url = `https://flint-rust.vercel.app/api/og?title=${encodeURIComponent(title)}&amount=${amount}&token=${token}`;

  const res = await fetch(url);
  return new Response(res.body, {
    headers: { "Content-Type": "image/png" },
  });
}