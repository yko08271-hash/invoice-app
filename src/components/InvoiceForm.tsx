'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calcTotals, formatYen } from '@/lib/calc';
import { ITEM_NAME_PRESETS, ITEM_UNITS } from '@/lib/itemPresets';
import { useConfirmLeave } from '@/lib/useConfirmLeave';
import type { BankAccountSlot, CompanySettings, Honorific, Invoice, InvoiceItem, ItemUnit, TaxRate } from '@/lib/types';

type Props = {
  invoiceId?: string;
  initialInvoice?: Invoice;
  initialItems?: InvoiceItem[];
  defaultInvoiceNumber?: string;
  company?: CompanySettings | null;
};

function emptyItem(sortOrder: number): InvoiceItem {
  return {
    item_date: null,
    name: '',
    detail: '',
    quantity: 1,
    unit: '回',
    unit_price: 0,
    tax_rate: 10,
    sort_order: sortOrder,
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoiceForm({ invoiceId, initialInvoice, initialItems, defaultInvoiceNumber, company }: Props) {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.invoice_number ?? defaultInvoiceNumber ?? '');
  const [issueDate, setIssueDate] = useState(initialInvoice?.issue_date ?? todayStr());
  const [dueDate, setDueDate] = useState(initialInvoice?.due_date ?? '');
  const [clientName, setClientName] = useState(initialInvoice?.client_name ?? '');
  const [honorific, setHonorific] = useState<Honorific>(initialInvoice?.honorific ?? '御中');
  const [clientAddress, setClientAddress] = useState(initialInvoice?.client_address ?? '');
  const [bankAccount, setBankAccount] = useState<BankAccountSlot>(initialInvoice?.bank_account ?? 1);
  const [notes, setNotes] = useState(initialInvoice?.notes ?? '');
  const [items, setItems] = useState<InvoiceItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : [emptyItem(0)]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const isFirstRender = useRef(true);

  const totals = calcTotals(items);
  const hasSecondAccount = Boolean(company?.bank_name_2);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber, issueDate, dueDate, clientName, honorific, clientAddress, bankAccount, notes, items]);

  useConfirmLeave(isDirty && !saving);

  function updateItem(index: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length)]);
  }

  function duplicateItem(index: number) {
    setItems((prev) => {
      const copy = { ...prev[index], id: undefined };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientName.trim()) {
      setError('請求先を入力してください');
      return;
    }
    if (items.length === 0 || items.every((i) => !i.name.trim())) {
      setError('明細を1件以上入力してください');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate || null,
      client_name: clientName,
      client_address: clientAddress || null,
      honorific,
      bank_account: bankAccount,
      notes: notes || null,
      subtotal_8: totals.subtotal_8,
      tax_8: totals.tax_8,
      subtotal_10: totals.subtotal_10,
      tax_10: totals.tax_10,
      total: totals.total,
    };

    let id = invoiceId;

    if (id) {
      const { error: updateError } = await supabase.from('invoices').update(payload).eq('id', id);
      if (updateError) {
        setError('保存に失敗しました: ' + updateError.message);
        setSaving(false);
        return;
      }
      const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
      if (deleteError) {
        setError('明細の更新に失敗しました: ' + deleteError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase.from('invoices').insert(payload).select().single();
      if (insertError || !data) {
        setError('保存に失敗しました: ' + insertError?.message);
        setSaving(false);
        return;
      }
      id = data.id;
    }

    const itemsPayload = items
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        invoice_id: id,
        item_date: i.item_date || null,
        name: i.name,
        detail: i.detail || null,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
        tax_rate: i.tax_rate,
        sort_order: idx,
      }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsPayload);
    if (itemsError) {
      setError('明細の保存に失敗しました: ' + itemsError.message);
      setSaving(false);
      return;
    }

    router.push(`/invoices/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <datalist id="item-name-presets">
        {ITEM_NAME_PRESETS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">請求書番号</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">発行日</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">支払期限（任意）</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate ?? ''}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate('')}
                className="text-gray-400 hover:text-red-600 text-sm px-2 shrink-0"
                aria-label="支払期限をクリア"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">請求先名</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="株式会社〇〇"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">敬称</label>
            <select
              value={honorific}
              onChange={(e) => setHonorific(e.target.value as Honorific)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="様">様</option>
              <option value="御中">御中</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">請求先住所（任意）</label>
          <input
            type="text"
            value={clientAddress ?? ''}
            onChange={(e) => setClientAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {hasSecondAccount && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">振込先</label>
            <select
              value={bankAccount}
              onChange={(e) => setBankAccount(Number(e.target.value) as BankAccountSlot)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value={1}>
                口座1：{company?.bank_name} {company?.branch_name}
              </option>
              <option value={2}>
                口座2：{company?.bank_name_2} {company?.branch_name_2}
              </option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-3">明細</h2>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">日付</label>
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={item.item_date ?? ''}
                      onChange={(e) => updateItem(index, { item_date: e.target.value || null })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {item.item_date && (
                      <button
                        type="button"
                        onClick={() => updateItem(index, { item_date: null })}
                        className="text-gray-400 hover:text-red-600 text-sm px-1 shrink-0"
                        aria-label="日付をクリア"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">品目</label>
                  <input
                    type="text"
                    list="item-name-presets"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="品目・サービス名（選択 or 入力）"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">数量</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    min={0}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">単位</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(index, { unit: e.target.value as ItemUnit })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {ITEM_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">単価（税抜）</label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                    min={0}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                <div className="col-span-2 sm:col-span-4">
                  <label className="block text-xs text-gray-500 mb-1">詳細（任意）</label>
                  <input
                    type="text"
                    value={item.detail ?? ''}
                    onChange={(e) => updateItem(index, { detail: e.target.value })}
                    placeholder="例：〇〇コース 3日間"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">税率</label>
                  <select
                    value={item.tax_rate}
                    onChange={(e) => updateItem(index, { tax_rate: Number(e.target.value) as TaxRate })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%（軽減）</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => duplicateItem(index)}
                    className="text-gray-400 hover:text-blue-600 text-sm px-1 py-2"
                  >
                    複製
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-600 text-sm px-1 py-2"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-4 text-blue-600 text-sm font-medium hover:underline"
        >
          + 明細を追加
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">備考（任意）</label>
        <textarea
          value={notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 max-w-sm ml-auto space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">小計（10%対象・税抜）</span>
          <span>{formatYen(totals.subtotal_10)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">消費税（10%）</span>
          <span>{formatYen(totals.tax_10)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">小計（8%対象・税抜）</span>
          <span>{formatYen(totals.subtotal_8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">消費税（8%）</span>
          <span>{formatYen(totals.tax_8)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
          <span>合計（税込）</span>
          <span>{formatYen(totals.total)}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
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
