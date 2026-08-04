import { formatYen } from '@/lib/calc';
import type { CompanySettings, Invoice, InvoiceItem } from '@/lib/types';

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  company: CompanySettings | null;
};

export default function InvoicePrintView({ invoice, items, company }: Props) {
  const bankInfo =
    invoice.bank_account === 2
      ? {
          bank_name: company?.bank_name_2,
          branch_name: company?.branch_name_2,
          account_type: company?.account_type_2,
          account_number: company?.account_number_2,
          account_holder: company?.account_holder_2,
        }
      : {
          bank_name: company?.bank_name,
          branch_name: company?.branch_name,
          account_type: company?.account_type,
          account_number: company?.account_number,
          account_holder: company?.account_holder,
        };

  return (
    <div
      id="invoice-print-area"
      className="bg-white mx-auto p-10 text-gray-900"
      style={{ width: '210mm', boxSizing: 'border-box' }}
    >
      <h1 className="text-3xl font-bold tracking-widest text-center mb-8">ご請求書</h1>

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-lg font-semibold border-b border-gray-800 pb-1 mb-1 min-w-[220px]">
            {invoice.client_name} {invoice.honorific}
          </p>
          {invoice.client_address && <p className="text-sm text-gray-600">{invoice.client_address}</p>}
        </div>
        <div className="text-sm text-right space-y-1">
          <p>請求書番号：{invoice.invoice_number}</p>
          <p>発行日：{invoice.issue_date}</p>
        </div>
      </div>

      <div className="text-right text-sm mb-8 space-y-0.5">
        <p className="font-semibold">{company?.company_name}</p>
        {company?.postal_code && <p>〒{company.postal_code}</p>}
        {company?.address && <p>{company.address}</p>}
        {company?.tel && <p>TEL：{company.tel}</p>}
        {company?.registration_number && <p>登録番号：{company.registration_number}</p>}
      </div>

      <div className="mb-6 border-2 border-gray-800 rounded-lg px-5 py-4 text-2xl font-bold" data-avoid-break="true">
        ご請求金額（税込）　<span>{formatYen(invoice.total)}</span>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-2 text-left w-24">日付</th>
            <th className="border border-gray-300 px-2 py-2 text-left">品目</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-14">単位</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-24">単価</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-14">税率</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-24">金額（税抜）</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-2 py-2">{item.item_date ?? ''}</td>
              <td className="border border-gray-300 px-2 py-2">
                <div>{item.name}</div>
                {item.detail && <div className="text-xs text-gray-500">{item.detail}</div>}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right">{item.quantity}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{item.unit}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{formatYen(item.unit_price)}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{item.tax_rate}%</td>
              <td className="border border-gray-300 px-2 py-2 text-right">
                {formatYen(Math.round(item.quantity * item.unit_price))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 text-sm space-y-1" data-avoid-break="true">
          <div className="flex justify-between">
            <span>小計（10%対象・税抜）</span>
            <span>{formatYen(invoice.subtotal_10)}</span>
          </div>
          <div className="flex justify-between">
            <span>消費税（10%）</span>
            <span>{formatYen(invoice.tax_10)}</span>
          </div>
          <div className="flex justify-between">
            <span>小計（8%対象・税抜）</span>
            <span>{formatYen(invoice.subtotal_8)}</span>
          </div>
          <div className="flex justify-between">
            <span>消費税（8%）</span>
            <span>{formatYen(invoice.tax_8)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-800 pt-1 mt-1">
            <span>合計（税込）</span>
            <span>{formatYen(invoice.total)}</span>
          </div>
        </div>
      </div>

      {bankInfo.bank_name && (
        <div className="mb-2 text-sm border border-gray-400 rounded-lg px-5 py-4" data-avoid-break="true">
          <p className="font-semibold mb-1">お振込先</p>
          <p>
            {bankInfo.bank_name} {bankInfo.branch_name} {bankInfo.account_type} {bankInfo.account_number}
          </p>
          <p>{bankInfo.account_holder}</p>
          <p className="text-xs text-gray-600 mt-2">※振込手数料は御社のご負担にてお願いいたします</p>
        </div>
      )}

      {invoice.due_date && <p className="text-sm mb-6">お支払期限：{invoice.due_date}</p>}

      {invoice.notes && (
        <div className="text-sm">
          <p className="font-semibold mb-1">備考</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
