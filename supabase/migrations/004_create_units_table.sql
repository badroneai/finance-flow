-- ═══════════════════════════════════════
-- Migration 004: إنشاء جدول الوحدات العقارية
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS units (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid        NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  property_id     uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by      uuid        REFERENCES auth.users(id),
  name            text        NOT NULL,
  type            text        DEFAULT 'apartment',
  status          text        DEFAULT 'available',
  floor           integer,
  area_sqm        numeric(10,2),
  bedrooms        integer,
  bathrooms       integer,
  monthly_rent    numeric(10,2)  DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_units_office_id ON units(office_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE TRIGGER set_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════
-- RLS — عزل على مستوى المكتب
-- ═══════════════════════════════════════
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY units_select ON units FOR SELECT USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY units_insert ON units FOR INSERT WITH CHECK (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY units_update ON units FOR UPDATE USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY units_delete ON units FOR DELETE USING (
  office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
);
