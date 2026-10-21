import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import InvoiceForm from '@/components/InvoiceForm';
import { nextInvoiceNumber } from '@/lib/invoiceNumber';
import type { CompanySettings } from '@/lib/types';

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const defaultInvoiceNumber = await nextInvoiceNumber(supabase);

  const { data: company } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();

  return (
    <main className="min-h-screen">
      <AppHeader userEmail={user.email ?? ''} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">請求書 新規作成</h1>
        <InvoiceForm defaultInvoiceNumber={defaultInvoiceNumber} company={company as CompanySettings | null} />
      </div>
    </main>
  );
}
