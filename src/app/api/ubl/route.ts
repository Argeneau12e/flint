import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
  }

  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const issueDate = new Date(invoice.createdAt).toISOString().split("T")[0];
  const dueDate = new Date(invoice.expiresAt).toISOString().split("T")[0];

  const lineItems = invoice.lineItems && invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ description: invoice.title, quantity: 1, unitPrice: invoice.amount, total: invoice.amount }];

  const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${invoice.id}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:Note>${invoice.memo || ""}</cbc:Note>
  <cbc:DocumentCurrencyCode>${invoice.token}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="solana">${invoice.recipientWallet}</cbc:EndpointID>
      ${invoice.sellerVatId ? `<cac:PartyTaxScheme><cbc:CompanyID>${invoice.sellerVatId}</cbc:CompanyID></cac:PartyTaxScheme>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="solana">${invoice.payerWallet || "pending"}</cbc:EndpointID>
      ${invoice.buyerReference ? `<cac:PartyIdentification><cbc:ID>${invoice.buyerReference}</cbc:ID></cac:PartyIdentification>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>ZZZ</cbc:PaymentMeansCode>
    <cbc:PaymentID>${invoice.txSignature || "pending"}</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
      <cbc:ID schemeID="solana">${invoice.recipientWallet}</cbc:ID>
      <cbc:Name>Flint Payment Protocol</cbc:Name>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  ${lineItems.map((item, i) => `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${invoice.token}">${item.total}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.description}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${invoice.token}">${item.unitPrice}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join("")}

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.token}">${invoice.amount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.token}">${invoice.amount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.token}">${invoice.amount + (invoice.taxAmount || 0)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.token}">${invoice.amount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

</Invoice>`;

  return new NextResponse(ublXml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="flint-invoice-${invoice.id.slice(0, 8)}.xml"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}