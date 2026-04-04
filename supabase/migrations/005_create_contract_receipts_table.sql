-- ═══════════════════════════════════════
-- Migration 005: إنشاء جدول سندات القبض
-- يتوافق مع buildReceiptModel في src/domain/receipt.js
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS contract_receipts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id             uuid        NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  contract_id           uuid        REFERENCES contracts(id) ON DELETE SET NULL,
  payment_id            uuid        REFERENCES payment_schedule(id) ON DELETE SET NULL,
  contract_payment_id   uuid        REFERENCES payment_schedule(id) ON DELETE SET NULL,

  -- بيانات الإيصال
  receipt_number        text        NOT NULL,
  issue_date            date        DEFAULT CURRENT_DATE,

  -- بيانات المكتب
  office_name           text,

  -- بيانات المستأجر
  tenant_name           text,

  -- بيانات العقد
  contract_number       text,
  contract_type         text,

  -- بيانات العقار
  property_name         text,
  unit_name             text,

  -- بيانات الدفعة
  amount                numeric(12,2)  DEFAULT 0,
  payment_method        text        DEFAULT 'cash',
  payment_method_label  text,
  due_id                text,
  installment_number    text,
  note                  text,

  -- بيانات ZATCA — الضريبة
  vat_rate              numeric(5,4)   DEFAULT 0.15,
  vat_amount            numeric(12,2)  DEFAULT 0,
  total_with_vat        numeric(12,2)  DEFAULT 0,
  seller_name           text,
  seller_tax_number     text,

  -- فترة الإيصال
  period_from           date,
  period_to             date,
  date                  date        DEFAULT CURRENT_DATE,

  -- بيانات وصفية
  notes                 text,
  created_by            uuid        REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_contract_receipts_office_id ON contract_receipts(office_id);
CREATE INDEX IF NOT EXISTS idx_contract_receipts_contract_id ON contract_receipts(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_receipts_date ON contract_receipts(date);
CREATE INDEX IF NOT EXISTS idx_contract_receipts_receipt_number ON contract_receipts(receipt_number);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE TRIGGER set_contract_receipts_updated_at
  BEFORE UPDATE ON contract_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════
-- RLS — عزل على مستوى المكتب
-- ═══════════════════════════════════════
ALTER TABLE contract_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_receipts_select ON contract_receipts FOR SELECT USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY contract_receipts_insert ON contract_receipts FOR INSERT WITH CHECK (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY contract_receipts_update ON contract_receipts FOR UPDATE USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY contract_receipts_delete ON contract_receipts FOR DELETE USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);
