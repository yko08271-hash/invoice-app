-- 明細行：日付・単位・詳細を追加
alter table invoice_items add column if not exists item_date date;
alter table invoice_items add column if not exists unit text not null default '回';
alter table invoice_items add column if not exists detail text;

-- 請求書：敬称・使用する振込先口座を追加
alter table invoices add column if not exists honorific text not null default '御中';
alter table invoices add column if not exists bank_account smallint not null default 1;

-- 自社情報：2つ目の振込先口座を追加
alter table company_settings add column if not exists bank_name_2 text;
alter table company_settings add column if not exists branch_name_2 text;
alter table company_settings add column if not exists account_type_2 text;
alter table company_settings add column if not exists account_number_2 text;
alter table company_settings add column if not exists account_holder_2 text;
