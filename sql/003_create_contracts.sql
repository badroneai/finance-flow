-- قيد العقار — جدول العقود (contracts)
-- SPR-018: المرحلة 1 — النواة العقارية (الخطوة 3: العقود)
-- يُنفَّذ في SQL Editor داخل لوحة تحكم Supabase

-- ═══════════════════════════════════════
-- الجدول
-- ═══════════════════════════════════════
create table if not exists public.contracts (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  created_by      uuid references auth.users(id),

  -- الربط: عقار + عميل
  property_id     uuid references public.properties(id) on delete set null,
  contact_id      uuid references public.contacts(id) on delete set null,

  -- بيانات العقد
  contract_number text default '',                      -- رقم العقد (اختياري، يُولَّد أو يُدخل يدوياً)
  type            text not null default 'rent',         -- rent | sale | management | other
  status          text not null default 'active',       -- draft | active | expired | terminated | renewed

  -- المدة
  start_date      date not null,                        -- تاريخ بداية العقد
  end_date        date not null,                        -- تاريخ نهاية العقد
  duration_months int default 12,                       -- مدة العقد بالأشهر (للمرجعية)

  -- المبالغ
  total_amount    numeric(12,2) not null default 0,     -- إجمالي قيمة العقد
  monthly_rent    numeric(12,2) default 0,              -- الإيجار الشهري
  deposit_amount  numeric(12,2) default 0,              -- مبلغ التأمين
  payment_cycle   text default 'monthly',               -- monthly | quarterly | semi_annual | annual | custom

  -- تفاصيل إضافية
  auto_renew      boolean default false,                -- تجديد تلقائي
  notes           text default '',

  -- الطوابع الزمنية
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ═══════════════════════════════════════
-- الفهارس
-- ═══════════════════════════════════════
create index if not exists idx_contracts_office     on public.contracts(office_id);
create index if not exists idx_contracts_property   on public.contracts(property_id);
create index if not exists idx_contracts_contact    on public.contracts(contact_id);
create index if not exists idx_contracts_status     on public.contracts(status);
create index if not exists idx_contracts_end_date   on public.contracts(end_date);

-- ═══════════════════════════════════════
-- RLS — إلزامي حسب قواعد المشروع
-- ═══════════════════════════════════════
alter table public.contracts enable row level security;

create policy "contracts_select_office"
  on public.contracts for select
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

create policy "contracts_insert_office"
  on public.contracts for insert
  with check (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

create policy "contracts_update_office"
  on public.contracts for update
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

create policy "contracts_delete_office"
  on public.contracts for delete
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- Trigger — تحديث updated_at تلقائياً
-- ═══════════════════════════════════════
drop trigger if exists trg_contracts_updated_at on public.contracts;
create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.update_updated_at();
