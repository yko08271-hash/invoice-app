-- 自社情報（振込先・インボイス登録番号など、1行のみ使用）
create table if not exists company_settings (
  id uuid default gen_random_uuid() primary key,
  company_name text not null default '',
  postal_code text,
  address text,
  tel text,
  email text,
  registration_number text,
  bank_name text,
  branch_name text,
  account_type text,
  account_number text,
  account_holder text,
  bank_name_2 text,
  branch_name_2 text,
  account_type_2 text,
  account_number_2 text,
  account_holder_2 text,
  updated_at timestamptz default now()
);

-- 請求書
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  invoice_number text not null,
  issue_date date not null,
  due_date date,
  client_name text not null,
  client_address text,
  honorific text not null default '御中',
  bank_account smallint not null default 1,
  notes text,
  subtotal_8 numeric(12,0) not null default 0,
  tax_8 numeric(12,0) not null default 0,
  subtotal_10 numeric(12,0) not null default 0,
  tax_10 numeric(12,0) not null default 0,
  total numeric(12,0) not null default 0
);

-- 請求書明細
create table if not exists invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid not null references invoices(id) on delete cascade,
  item_date date,
  name text not null,
  detail text,
  quantity numeric(12,2) not null default 1,
  unit text not null default '回',
  unit_price numeric(12,2) not null default 0,
  tax_rate smallint not null check (tax_rate in (8, 10)),
  sort_order integer not null default 0
);

-- RLS有効化（本アプリはログインした管理者のみが自分の請求書データを扱う想定）
alter table company_settings enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "allow_authenticated_all" on company_settings
  for all to authenticated using (true) with check (true);

create policy "allow_authenticated_all" on invoices
  for all to authenticated using (true) with check (true);

create policy "allow_authenticated_all" on invoice_items
  for all to authenticated using (true) with check (true);
