import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import InvoiceList from '@/components/InvoiceList';
import Link from 'next/link';
import type { Invoice } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .order('issue_date', { ascending: false });

  return (
    <main className="min-h-screen">
      <AppHeader userEmail={user.email ?? ''} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">請求書一覧</h1>
          <Link
            href="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + 新規作成
          </Link>
        </div>
        {error ? (
          <p className="text-red-600">データ取得エラー: {error.message}</p>
        ) : (
          <InvoiceList invoices={(invoices ?? []) as Invoice[]} />
        )}
      </div>
    </main>
  );
}
