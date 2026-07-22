import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import InvoiceForm from '@/components/InvoiceForm';
import type { CompanySettings, Invoice, InvoiceItem } from '@/lib/types';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">請求書を編集</h1>
        <InvoiceForm
          invoiceId={id}
          initialInvoice={invoice as Invoice}
          initialItems={(items ?? []) as InvoiceItem[]}
          company={company as CompanySettings | null}
        />
      </div>
    </main>
  );
}
