-- ============================================================
-- قيد العقار — Migration 001: الجداول الأساسية
-- ============================================================
-- يُنشئ الجداول العشرة الأساسية + RLS + الفهارس + triggers
-- هذا الملف يُوحّد المحتوى الذي كان سابقاً في sql/001-003
-- يجب أن يُنفَّذ أولاً قبل أي migration أخرى
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- دالة مشتركة: تحديث updated_at تلقائياً
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════
-- 1. offices — المكاتب العقارية
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.offices (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  settings    jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- RLS: المستخدم يرى مكتبه فقط
CREATE POLICY "offices_select_own" ON public.offices FOR SELECT
  USING (id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "offices_update_own" ON public.offices FOR UPDATE
  USING (id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_offices_updated_at ON public.offices;
CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 2. profiles — ملفات المستخدمين
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id),
  office_id   uuid        REFERENCES public.offices(id) ON DELETE CASCADE,
  full_name   text        DEFAULT '',
  role        text        DEFAULT 'owner'
              CHECK (role IN ('owner', 'manager', 'agent', 'super_admin')),
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_office" ON public.profiles FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 3. properties — العقارات
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.properties (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid            NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  created_by      uuid            REFERENCES auth.users(id),
  name            text            NOT NULL,
  type            text            NOT NULL DEFAULT 'apartment',
  status          text            NOT NULL DEFAULT 'available',
  city            text            DEFAULT '',
  district        text            DEFAULT '',
  address         text            DEFAULT '',
  lat             double precision,
  lng             double precision,
  units_count     integer         DEFAULT 1,
  area_sqm        numeric(10,2),
  bedrooms        integer,
  bathrooms       integer,
  year_built      integer,
  floors          integer,
  owner_name      text            DEFAULT '',
  owner_phone     text            DEFAULT '',
  purchase_price  numeric(12,2),
  monthly_rent    numeric(10,2),
  notes           text            DEFAULT '',
  created_at      timestamptz     DEFAULT now(),
  updated_at      timestamptz     DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_office ON public.properties(office_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type   ON public.properties(type);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_select_office" ON public.properties FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "properties_insert_office" ON public.properties FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "properties_update_office" ON public.properties FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "properties_delete_office" ON public.properties FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_properties_updated_at ON public.properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 4. contacts — جهات الاتصال
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.contacts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  created_by      uuid        REFERENCES auth.users(id),
  name            text        NOT NULL,
  type            text        NOT NULL DEFAULT 'tenant',
  phone           text        DEFAULT '',
  phone2          text        DEFAULT '',
  email           text        DEFAULT '',
  id_number       text        DEFAULT '',
  id_type         text        DEFAULT 'national_id',
  city            text        DEFAULT '',
  district        text        DEFAULT '',
  address         text        DEFAULT '',
  company_name    text        DEFAULT '',
  nationality     text        DEFAULT '',
  tags            text        DEFAULT '',
  notes           text        DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_office ON public.contacts(office_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type   ON public.contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_phone  ON public.contacts(phone);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select_office" ON public.contacts FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contacts_insert_office" ON public.contacts FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contacts_update_office" ON public.contacts FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contacts_delete_office" ON public.contacts FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 5. contracts — العقود
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.contracts (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid            NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  created_by      uuid            REFERENCES auth.users(id),
  property_id     uuid            REFERENCES public.properties(id) ON DELETE SET NULL,
  contact_id      uuid            REFERENCES public.contacts(id) ON DELETE SET NULL,
  contract_number text            DEFAULT '',
  type            text            NOT NULL DEFAULT 'rent',
  status          text            NOT NULL DEFAULT 'active',
  start_date      date            NOT NULL,
  end_date        date            NOT NULL,
  duration_months integer         DEFAULT 12,
  total_amount    numeric(12,2)   NOT NULL DEFAULT 0,
  monthly_rent    numeric(12,2)   DEFAULT 0,
  deposit_amount  numeric(12,2)   DEFAULT 0,
  payment_cycle   text            DEFAULT 'monthly',
  auto_renew      boolean         DEFAULT false,
  notes           text            DEFAULT '',
  created_at      timestamptz     DEFAULT now(),
  updated_at      timestamptz     DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_office     ON public.contracts(office_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property   ON public.contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contact    ON public.contracts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status     ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date   ON public.contracts(end_date);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select_office" ON public.contracts FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contracts_insert_office" ON public.contracts FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contracts_update_office" ON public.contracts FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "contracts_delete_office" ON public.contracts FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 6. ledgers — الدفاتر المالية
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ledgers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  archived    boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledgers_office ON public.ledgers(office_id);

ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledgers_select_office" ON public.ledgers FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ledgers_insert_office" ON public.ledgers FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ledgers_update_office" ON public.ledgers FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ledgers_delete_office" ON public.ledgers FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_ledgers_updated_at ON public.ledgers;
CREATE TRIGGER trg_ledgers_updated_at
  BEFORE UPDATE ON public.ledgers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 7. transactions — المعاملات المالية
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transactions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  ledger_id       uuid        NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  type            text        NOT NULL,
  category        text        DEFAULT '',
  description     text        DEFAULT '',
  amount          numeric(12,2) NOT NULL DEFAULT 0,
  payment_method  text        DEFAULT 'cash',
  date            date        NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_office    ON public.transactions(office_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger    ON public.transactions(ledger_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON public.transactions(date);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_office" ON public.transactions FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "transactions_insert_office" ON public.transactions FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "transactions_update_office" ON public.transactions FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "transactions_delete_office" ON public.transactions FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 8. recurring_items — البنود المتكررة
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recurring_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  ledger_id       uuid        NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  description     text        DEFAULT '',
  amount          numeric(12,2) NOT NULL DEFAULT 0,
  frequency       text        DEFAULT 'monthly',
  next_due_date   date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_items_office ON public.recurring_items(office_id);
CREATE INDEX IF NOT EXISTS idx_recurring_items_ledger ON public.recurring_items(ledger_id);

ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_items_select_office" ON public.recurring_items FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "recurring_items_insert_office" ON public.recurring_items FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "recurring_items_update_office" ON public.recurring_items FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "recurring_items_delete_office" ON public.recurring_items FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_recurring_items_updated_at ON public.recurring_items;
CREATE TRIGGER trg_recurring_items_updated_at
  BEFORE UPDATE ON public.recurring_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 9. commissions — العمولات
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.commissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  ledger_id   uuid        REFERENCES public.ledgers(id) ON DELETE SET NULL,
  agent_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  status      text        DEFAULT 'pending',
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  description text        DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_office ON public.commissions(office_id);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commissions_select_office" ON public.commissions FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "commissions_insert_office" ON public.commissions FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "commissions_update_office" ON public.commissions FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "commissions_delete_office" ON public.commissions FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_commissions_updated_at ON public.commissions;
CREATE TRIGGER trg_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- 10. drafts — المسودات
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.drafts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid        NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  title       text        DEFAULT '',
  content     jsonb       DEFAULT '{}'::jsonb,
  type        text        DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drafts_office ON public.drafts(office_id);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drafts_select_office" ON public.drafts FOR SELECT
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "drafts_insert_office" ON public.drafts FOR INSERT
  WITH CHECK (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "drafts_update_office" ON public.drafts FOR UPDATE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "drafts_delete_office" ON public.drafts FOR DELETE
  USING (office_id IN (SELECT office_id FROM public.profiles WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON public.drafts;
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
