import { getPool } from "@/lib/api/singleton";

export const runtime = "nodejs";

const ORG_ID = "da62326b-707d-41bd-bc2d-a61a81926dae";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT * FROM erp_consultant_invoices WHERE invoice_number = $1 AND org_id = $2 LIMIT 1`,
    [number, ORG_ID],
  );

  if (rows.length === 0) {
    return new Response("Invoice not found", { status: 404 });
  }

  const inv = rows[0];
  const lineItems: { description: string; amount: number }[] =
    typeof inv.line_items === "string"
      ? JSON.parse(inv.line_items)
      : inv.line_items || [];

  const subtotal = Number(inv.amount);
  const issueDate = inv.issue_date
    ? new Date(inv.issue_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const statusLabel =
    inv.status === "paid"
      ? "Paid"
      : inv.status === "overdue"
        ? "Overdue"
        : "Due on Receipt";
  const statusClass =
    inv.status === "paid" ? "status-paid" : "status-due";

  const lineItemsHtml = lineItems
    .map(
      (li) => `
          <tr>
            <td><div class="item-title">${esc(li.description)}</div></td>
            <td>$${li.amount.toLocaleString()}</td>
          </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${esc(inv.invoice_number)} — Jeff Jack Productions</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #1c1917;
      --mid: #57534e;
      --dim: #a8a29e;
      --faint: #d6d3d1;
      --rule: #e7e5e4;
      --bg: #fafaf9;
      --surface: #ffffff;
      --accent: #4A7FA5;
      --serif: 'Cormorant Garamond', 'Georgia', serif;
      --sans: 'Inter', system-ui, -apple-system, sans-serif;
      --mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: var(--sans);
      background: var(--bg);
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 760px;
      margin: 0 auto;
      background: var(--surface);
      padding: 56px 56px 32px;
    }
    .masthead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--rule);
    }
    .masthead__brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .masthead__logo { height: 44px; width: auto; }
    .masthead__name {
      font-family: var(--serif);
      font-size: 1.55rem;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .masthead__contact {
      font-size: 11.5px;
      color: var(--dim);
      margin-top: 3px;
      letter-spacing: 0.01em;
    }
    .masthead__right { text-align: right; }
    .masthead__invoice-label {
      font-family: var(--serif);
      font-size: 2rem;
      font-weight: 400;
      font-style: italic;
      color: var(--accent);
      letter-spacing: 0.02em;
      line-height: 1;
    }
    .masthead__number {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--dim);
      margin-top: 6px;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      padding: 28px 0;
      border-bottom: 1px solid var(--rule);
    }
    .detail-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--dim);
      margin-bottom: 6px;
    }
    .detail-value {
      font-size: 13px;
      line-height: 1.55;
    }
    .detail-value strong { font-weight: 600; }
    .detail-spacer { height: 14px; }
    .status-pill {
      display: inline-block;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 3px;
    }
    .status-due {
      background: rgba(74,127,165,.08);
      color: var(--accent);
    }
    .status-paid {
      background: rgba(45,122,79,.08);
      color: #2d7a4f;
    }
    .items { padding: 24px 0 0; }
    .items table { width: 100%; border-collapse: collapse; }
    .items thead th {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--dim);
      text-align: left;
      padding: 0 0 8px;
      border-bottom: 1.5px solid var(--ink);
    }
    .items thead th:last-child { text-align: right; }
    .items tbody td {
      padding: 11px 0;
      border-bottom: 1px solid var(--rule);
      vertical-align: top;
      font-size: 13px;
      line-height: 1.45;
    }
    .items tbody td:last-child {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      font-weight: 500;
      padding-left: 16px;
    }
    .item-title { font-weight: 500; }
    .totals {
      display: flex;
      justify-content: flex-end;
      padding: 4px 0 24px;
    }
    .totals table { width: 240px; border-collapse: collapse; }
    .totals td { padding: 7px 0; font-size: 13px; }
    .totals td:first-child { color: var(--mid); }
    .totals td:last-child {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .totals .total-row td {
      border-top: 1.5px solid var(--ink);
      padding-top: 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .totals .total-row td:last-child {
      font-family: var(--serif);
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--accent);
    }
    .footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      padding: 20px 0;
      border-top: 1px solid var(--rule);
    }
    .footer-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--dim);
      margin-bottom: 6px;
    }
    .footer-text {
      font-size: 12px;
      color: var(--mid);
      line-height: 1.65;
    }
    .colophon {
      text-align: center;
      padding: 14px 0 0;
      font-size: 10px;
      letter-spacing: 0.06em;
      color: var(--faint);
      border-top: 1px solid var(--rule);
    }
    @media print {
      @page { size: letter; margin: 0.45in 0.55in; }
      body { background: #fff; }
      .page { max-width: none; padding: 0; min-height: auto; box-shadow: none; }
      .masthead { padding-bottom: 24px; }
      .details { padding: 20px 0; gap: 16px; }
      .items { padding-top: 16px; }
      .items tbody td { padding: 8px 0; }
      .totals { padding: 2px 0 16px; }
      .footer { padding: 14px 0; gap: 24px; }
      .colophon { padding-top: 10px; }
      .status-pill, .status-due, .status-paid { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-btn { display: none !important; }
    }
    @media (max-width: 600px) {
      .page { padding: 32px 24px 24px; }
      .masthead { flex-direction: column; gap: 20px; }
      .masthead__right { text-align: left; }
      .details { grid-template-columns: 1fr; gap: 16px; }
      .footer { grid-template-columns: 1fr; gap: 16px; }
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      background: var(--ink);
      color: #fff;
      border: none;
      font-family: var(--sans);
      font-size: 12px;
      font-weight: 500;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.2);
      transition: background .2s;
      letter-spacing: 0.02em;
    }
    .print-btn:hover { background: var(--accent); }
  </style>
</head>
<body>
  <div class="page">
    <div class="masthead">
      <div>
        <div class="masthead__brand">
          <img src="/jj-logo-dark.png" alt="" class="masthead__logo">
          <div>
            <div class="masthead__name">Jeff Jack Productions</div>
            <div class="masthead__contact">jeff@stjack.com · Inglewood, CA</div>
          </div>
        </div>
      </div>
      <div class="masthead__right">
        <div class="masthead__invoice-label">Invoice</div>
        <div class="masthead__number">${esc(inv.invoice_number)}</div>
      </div>
    </div>

    <div class="details">
      <div>
        <div class="detail-label">Bill To</div>
        <div class="detail-value">
          <strong>${esc(inv.client_name)}</strong>${inv.notes ? "<br>" + esc(inv.notes).replace(/\n/g, "<br>") : ""}
        </div>
      </div>
      <div>
        <div class="detail-label">Issued</div>
        <div class="detail-value"><strong>${issueDate}</strong></div>
        ${dueDate ? `<div class="detail-spacer"></div><div class="detail-label">Due</div><div class="detail-value"><strong>${dueDate}</strong></div>` : ""}
      </div>
      <div>
        <div class="detail-label">Status</div>
        <div class="detail-value"><span class="status-pill ${statusClass}">${statusLabel}</span></div>
        ${inv.description ? `<div class="detail-spacer"></div><div class="detail-label">Reference</div><div class="detail-value">${esc(inv.description)}</div>` : ""}
      </div>
    </div>

    <div class="items">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td>$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Tax</td><td>—</td></tr>
        <tr class="total-row"><td>Total Due</td><td>$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
      </table>
    </div>

    <div class="footer">
      <div>
        <div class="footer-label">Payment</div>
        <div class="footer-text">
          Check, Venmo, or bank transfer<br>
          Venmo: @jeffjack<br>
          Net 14 terms
        </div>
      </div>
      <div>
        <div class="footer-label">Notes</div>
        <div class="footer-text">
          ${inv.description ? esc(inv.description) : "Thank you for your business."}
        </div>
      </div>
    </div>

    <div class="colophon">
      Jeff Jack Productions · jeff@stjack.com · Inglewood, CA
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
