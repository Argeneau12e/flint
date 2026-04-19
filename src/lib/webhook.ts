import { Invoice } from "./store";

export async function triggerWebhook(invoice: Invoice): Promise<void> {
  if (!invoice.webhookUrl) return;

  const payload = {
    event: "invoice.paid",
    timestamp: Date.now(),
    invoice: {
      id: invoice.id,
      title: invoice.title,
      amount: invoice.amount,
      token: invoice.token,
      recipientWallet: invoice.recipientWallet,
      payerWallet: invoice.payerWallet,
      txSignature: invoice.txSignature,
      paidAt: invoice.paidAt,
      memo: invoice.memo,
    },
  };

  try {
    await fetch(invoice.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Flint-Event": "invoice.paid",
        "X-Flint-Timestamp": String(Date.now()),
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Webhook delivery failed:", err);
  }
}