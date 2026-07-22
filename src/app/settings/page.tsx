import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import CompanySettingsForm from '@/components/CompanySettingsForm';
import type { CompanySettings } from '@/lib/types';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: company } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();

  return (
    <main className="min-h-screen">
      <AppHeader userEmail={user.email ?? ''} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">自社情報設定</h1>
        <p className="text-sm text-gray-500 mb-6">
          ここで設定した情報が、すべての請求書の発行者情報・振込先として表示されます。
        </p>
        <CompanySettingsForm initial={(company as CompanySettings) ?? null} />
      </div>
    </main>
  );
}
