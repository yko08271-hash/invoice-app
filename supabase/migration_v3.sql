-- 単価に小数点以下2桁まで入力できるようにする
alter table invoice_items alter column unit_price type numeric(12,2);
