import { kv } from "./kv";

export interface Invoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  recipientWallet: string;
  createdAt: number;
  expiresAt: number;
  status: string;
  condition?: string;
  payerWallet?: string;
  paidAt?: number;
  txSignature?: string;
  handle?: string;
  lineItems?: LineItem[];
  taxAmount?: number;
  sellerVatId?: string;
  buyerReference?: string;
  splits?: Split[];
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Split {
  wallet: string;
  percentage: number;
  label?: string;
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await kv.set(`invoice:${invoice.id}`, invoice);
  if (invoice.handle) {
    await kv.set(`handle:${invoice.handle}`, invoice.id);
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  return kv.get<Invoice>(`invoice:${id}`);
}

export async function getInvoiceByHandle(handle: string): Promise<Invoice | null> {
  const id = await kv.get<string>(`handle:${handle}`);
  if (!id) return null;
  return getInvoice(id);
}

export async function getInvoicesByWallet(walletAddress: string): Promise<Invoice[]> {
  const keys = await kv.keys("invoice:*");
  const invoices: Invoice[] = [];
  for (const key of keys) {
    const invoice = await kv.get<Invoice>(key);
    if (invoice && invoice.recipientWallet === walletAddress) {
      invoices.push(invoice);
    }
  }
  return invoices.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateInvoiceStatus(
  id: string,
  status: string,
  txSignature?: string,
  payerWallet?: string
): Promise<void> {
  const invoice = await getInvoice(id);
  if (invoice) {
    invoice.status = status;
    if (txSignature) invoice.txSignature = txSignature;
    if (payerWallet) invoice.payerWallet = payerWallet;
    if (status === "paid") invoice.paidAt = Date.now();
    await saveInvoice(invoice);
  }
}

export interface Template {
  id: string;
  name: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  expiryDays: number;
  createdAt: number;
  walletAddress: string;
}

export async function saveTemplate(template: Template): Promise<void> {
  await kv.set(`template:${template.id}`, template);
}

export async function getTemplatesByWallet(walletAddress: string): Promise<Template[]> {
  const keys = await kv.keys("template:*");
  const templates: Template[] = [];
  for (const key of keys) {
    const template = await kv.get<Template>(key);
    if (template && template.walletAddress === walletAddress) {
      templates.push(template);
    }
  }
  return templates.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteTemplate(id: string): Promise<void> {
  await kv.delete(`template:${id}`);
}