import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import InvoicePrintView from '@/components/InvoicePrintView';
import PdfExportButton from '@/components/PdfExportButton';
import { invoicePdfFileName } from '@/lib/calc';
import type { CompanySettings, Invoice, InvoiceItem } from '@/lib/types';

export default async function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single();
  if (!invoice) notFound();

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });

  const { data: company } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();

  return (
    <main className="min-h-screen">
      <AppHeader userEmail={user.email ?? ''} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-600 text-sm">
              ← 一覧に戻る
            </Link>
            <Link href={`/invoices/${id}/edit`} className="text-gray-500 hover:text-blue-600 text-sm">
              編集
            </Link>
          </div>
          <PdfExportButton fileName={invoicePdfFileName(invoice.issue_date, invoice.client_name)} />
        </div>

        <div className="overflow-x-auto pb-4">
          <InvoicePrintView
            invoice={invoice as Invoice}
            items={(items ?? []) as InvoiceItem[]}
            company={(company as CompanySettings) ?? null}
          />
        </div>
      </div>
    </main>
  );
}
