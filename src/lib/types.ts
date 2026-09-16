export type TaxRate = 8 | 10;
export type Honorific = '様' | '御中';
export type ItemUnit = '回' | '個' | '式' | '日' | 'SET' | '枚';
export type BankAccountSlot = 1 | 2;

export type InvoiceItem = {
  id?: string;
  invoice_id?: string;
  item_date: string | null;
  name: string;
  detail: string | null;
  quantity: number;
  unit: ItemUnit;
  unit_price: number;
  tax_rate: TaxRate;
  sort_order: number;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  client_name: string;
  client_address: string | null;
  honorific: Honorific;
  bank_account: BankAccountSlot;
  notes: string | null;
  subtotal_8: number;
  tax_8: number;
  subtotal_10: number;
  tax_10: number;
  total: number;
  created_at: string;
};

export type InvoiceWithItems = Invoice & {
  invoice_items: InvoiceItem[];
};

export type CompanySettings = {
  id: string;
  company_name: string;
  postal_code: string | null;
  address: string | null;
  tel: string | null;
  email: string | null;
  registration_number: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  bank_name_2: string | null;
  branch_name_2: string | null;
  account_type_2: string | null;
  account_number_2: string | null;
  account_holder_2: string | null;
};
