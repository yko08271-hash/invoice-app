'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatYen } from '@/lib/calc';
import type { Invoice } from '@/lib/types';

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [items, setItems] = useState(invoices);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (inv) => inv.invoice_number.toLowerCase().includes(q) || inv.client_name.toLowerCase().includes(q)
    );
  }, [items, query]);

  async function handleDelete(id: string) {
    if (!confirm('この請求書を削除します。よろしいですか？')) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    const supabase = createClient();

    const { data: original, error: fetchError } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (fetchError || !original) {
      alert('複製元の取得に失敗しました: ' + fetchError?.message);
      setDuplicatingId(null);
      return;
    }

    const { data: originalItems, error: itemsFetchError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true });
    if (itemsFetchError) {
      alert('明細の取得に失敗しました: ' + itemsFetchError.message);
      setDuplicatingId(null);
      return;
    }

    const { id: _origId, created_at: _createdAt, ...rest } = original;
    const newInvoicePayload = { ...rest, invoice_number: `${original.invoice_number}-copy` };

    const { data: created, error: insertError } = await supabase
      .from('invoices')
      .insert(newInvoicePayload)
      .select()
      .single();
    if (insertError || !created) {
      alert('複製に失敗しました: ' + insertError?.message);
      setDuplicatingId(null);
      return;
    }

    if (originalItems && originalItems.length > 0) {
      const newItemsPayload = originalItems.map(({ id: _itemId, invoice_id: _invId, ...itemRest }) => ({
        ...itemRest,
        invoice_id: created.id,
      }));
      const { error: insertItemsError } = await supabase.from('invoice_items').insert(newItemsPayload);
      if (insertItemsError) {
        alert('明細の複製に失敗しました: ' + insertItemsError.message);
        setDuplicatingId(null);
        return;
      }
    }

    setDuplicatingId(null);
    router.push(`/invoices/${created.id}/edit`);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        まだ請求書がありません。「新規作成」から作成してください。
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="請求書番号・請求先名で検索"
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">該当する請求書がありません。</div>
      ) : (
        <>
          {/* デスクトップ: テーブル表示 */}
          <table className="hidden md:table w-full text-sm bg-white rounded-xl shadow overflow-hidden">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">請求書番号</th>
                <th className="text-left px-4 py-3">発行日</th>
                <th className="text-left px-4 py-3">請求先</th>
                <th className="text-right px-4 py-3">合計金額</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.issue_date}</td>
                  <td className="px-4 py-3">{inv.client_name}</td>
                  <td className="px-4 py-3 text-right">{formatYen(inv.total)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/invoices/${inv.id}/edit`} className="text-gray-500 hover:text-blue-600 mr-3">
                      編集
                    </Link>
                    <button
                      onClick={() => handleDuplicate(inv.id)}
                      disabled={duplicatingId === inv.id}
                      className="text-gray-500 hover:text-blue-600 disabled:opacity-50 mr-3"
                    >
                      複製
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-3">
            {filtered.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start">
                  <Link href={`/invoices/${inv.id}`} className="text-blue-600 font-semibold hover:underline">
                    {inv.invoice_number}
                  </Link>
                  <span className="font-bold text-gray-800">{formatYen(inv.total)}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{inv.client_name}</p>
                <p className="text-gray-400 text-xs mt-1">発行日: {inv.issue_date}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <Link href={`/invoices/${inv.id}/edit`} className="text-gray-500 hover:text-blue-600">
                    編集
                  </Link>
                  <button
                    onClick={() => handleDuplicate(inv.id)}
                    disabled={duplicatingId === inv.id}
                    className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
                  >
                    複製
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    disabled={deletingId === inv.id}
                    className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
