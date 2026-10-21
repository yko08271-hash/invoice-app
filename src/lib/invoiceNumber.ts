import type { SupabaseClient } from '@supabase/supabase-js';

const NUMBER_PATTERN = /^INV-(\d{4})-(\d+)/;

export async function nextInvoiceNumber(supabase: SupabaseClient, year = new Date().getFullYear()): Promise<string> {
  const { data } = await supabase.from('invoices').select('invoice_number').like('invoice_number', `INV-${year}-%`);

  let max = 0;
  for (const row of data ?? []) {
    const m = NUMBER_PATTERN.exec(row.invoice_number);
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }

  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
}

export function compareInvoiceNumber(a: string, b: string): number {
  return a.localeCompare(b, 'ja', { numeric: true });
}
