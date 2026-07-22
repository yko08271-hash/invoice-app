'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CompanySettings } from '@/lib/types';

export default function CompanySettingsForm({ initial }: { initial: CompanySettings | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: initial?.company_name ?? '',
    postal_code: initial?.postal_code ?? '',
    address: initial?.address ?? '',
    tel: initial?.tel ?? '',
    email: initial?.email ?? '',
    registration_number: initial?.registration_number ?? '',
    bank_name: initial?.bank_name ?? '',
    branch_name: initial?.branch_name ?? '',
    account_type: initial?.account_type ?? '普通',
    account_number: initial?.account_number ?? '',
    account_holder: initial?.account_holder ?? '',
    bank_name_2: initial?.bank_name_2 ?? '',
    branch_name_2: initial?.branch_name_2 ?? '',
    account_type_2: initial?.account_type_2 ?? '普通',
    account_number_2: initial?.account_number_2 ?? '',
    account_holder_2: initial?.account_holder_2 ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const supabase = createClient();

    let error;
    if (initial?.id) {
      ({ error } = await supabase.from('company_settings').update(form).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('company_settings').insert(form));
    }

    setSaving(false);
    if (error) {
      setMessage('保存に失敗しました: ' + error.message);
    } else {
      setMessage('保存しました');
      router.refresh();
    }
  }

  const field = (label: string, key: keyof typeof form, placeholder?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">{field('会社名・屋号', 'company_name')}</div>
        {field('郵便番号', 'postal_code', '123-4567')}
        {field('電話番号', 'tel')}
        <div className="sm:col-span-2">{field('住所', 'address')}</div>
        {field('メールアドレス', 'email')}
        {field('インボイス登録番号', 'registration_number', 'T1234567890123')}
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 font-semibold text-gray-800 -mb-2">振込先情報1</h2>
        {field('銀行名', 'bank_name')}
        {field('支店名', 'branch_name')}
        {field('口座種別', 'account_type', '普通')}
        {field('口座番号', 'account_number')}
        <div className="sm:col-span-2">{field('口座名義', 'account_holder')}</div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 font-semibold text-gray-800 -mb-2">振込先情報2（任意）</h2>
        <p className="sm:col-span-2 text-xs text-gray-500 -mt-2">
          顧客によって振込先を使い分けたい場合に入力してください。請求書作成時に選択できるようになります。
        </p>
        {field('銀行名', 'bank_name_2')}
        {field('支店名', 'branch_name_2')}
        {field('口座種別', 'account_type_2', '普通')}
        {field('口座番号', 'account_number_2')}
        <div className="sm:col-span-2">{field('口座名義', 'account_holder_2')}</div>
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  );
}
