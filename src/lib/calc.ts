import type { InvoiceItem, TaxRate } from './types';

export type InvoiceTotals = {
  subtotal_8: number;
  tax_8: number;
  subtotal_10: number;
  tax_10: number;
  total: number;
};

function amountOf(item: InvoiceItem): number {
  return Math.round(item.quantity * item.unit_price);
}

export function calcTotals(items: InvoiceItem[]): InvoiceTotals {
  const byRate = (rate: TaxRate) =>
    items.filter((i) => i.tax_rate === rate).reduce((sum, i) => sum + amountOf(i), 0);

  const subtotal_8 = byRate(8);
  const subtotal_10 = byRate(10);
  // 消費税は税率ごとに1回のみ計算し、端数は切り捨て（インボイス制度対応）
  const tax_8 = Math.floor(subtotal_8 * 0.08);
  const tax_10 = Math.floor(subtotal_10 * 0.1);
  const total = subtotal_8 + tax_8 + subtotal_10 + tax_10;

  return { subtotal_8, tax_8, subtotal_10, tax_10, total };
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function invoicePdfFileName(issueDate: string, clientName: string, honorific: string): string {
  const dateStr = issueDate.replaceAll('-', '');
  // ファイル名に使えない文字を除去
  const safeClientName = clientName.replace(/[\\/:*?"<>|]/g, '');
  return `ご請求書_${dateStr}_${safeClientName}${honorific}.pdf`;
}
