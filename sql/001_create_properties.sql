-- قيد العقار — جدول الوحدات العقارية (properties)
-- SPR-018: المرحلة 1 — النواة العقارية
-- يُنفَّذ في SQL Editor داخل لوحة تحكم Supabase

-- ═══════════════════════════════════════
-- الجدول
-- ═══════════════════════════════════════
create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  office_id     uuid not null references public.offices(id) on delete cascade,
  created_by    uuid references auth.users(id),

  -- البيانات الأساسية
  name          text not null,                          -- اسم العقار (مثل: عمارة النور، فيلا الياسمين)
  type          text not null default 'apartment',      -- apartment | villa | building | office | chalet | land | warehouse | other
  status        text not null default 'available',      -- available | rented | maintenance | sold

  -- الموقع
  city          text default '',                        -- المدينة (الرياض، جدة، الدمام...)
  district      text default '',                        -- الحي (النرجس، العليا، الحمراء...)
  address       text default '',                        -- العنوان التفصيلي
  lat           double precision,                       -- خط العرض (اختياري)
  lng           double precision,                       -- خط الطول (اختياري)

  -- التفاصيل
  units_count   integer default 1,                      -- عدد الوحدات (للعمائر والمباني)
  area_sqm      numeric(10, 2),                         -- المساحة بالمتر المربع
  bedrooms      integer,                                -- عدد غرف النوم (للشقق والفلل)
  bathrooms     integer,                                -- عدد دور المياه
  year_built    integer,                                -- سنة البناء
  floors        integer,                                -- عدد الطوابق

  -- المالك (نص حر — يُربط بـ contacts لاحقاً)
  owner_name    text default '',                        -- اسم المالك
  owner_phone   text default '',                        -- رقم جوال المالك

  -- المالية
  purchase_price  numeric(12, 2),                       -- سعر الشراء/القيمة (اختياري)
  monthly_rent    numeric(10, 2),                       -- الإيجار الشهري المتوقع (اختياري)

  -- ملاحظات
  notes         text default '',

  -- الطوابع الزمنية
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ═══════════════════════════════════════
-- الفهارس
-- ═══════════════════════════════════════
create index if not exists idx_properties_office on public.properties(office_id);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_type   on public.properties(type);

-- ═══════════════════════════════════════
-- RLS — إلزامي حسب قواعد المشروع
-- ═══════════════════════════════════════
alter table public.properties enable row level security;

-- سياسة القراءة: أعضاء المكتب فقط
create policy "properties_select_office"
  on public.properties for select
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة الإضافة: أعضاء المكتب فقط
create policy "properties_insert_office"
  on public.properties for insert
  with check (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة التعديل: أعضاء المكتب فقط
create policy "properties_update_office"
  on public.properties for update
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة الحذف: أعضاء المكتب فقط
create policy "properties_delete_office"
  on public.properties for delete
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- Trigger — تحديث updated_at تلقائياً
-- ═══════════════════════════════════════
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- تأكد من عدم التكرار (قد يكون الـ trigger موجوداً من جدول آخر)
drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at();
