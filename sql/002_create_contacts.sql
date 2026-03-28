-- قيد العقار — جدول جهات الاتصال (contacts)
-- SPR-018: المرحلة 1 — النواة العقارية (الخطوة 2: العملاء)
-- يُنفَّذ في SQL Editor داخل لوحة تحكم Supabase

-- ═══════════════════════════════════════
-- الجدول
-- ═══════════════════════════════════════
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  office_id     uuid not null references public.offices(id) on delete cascade,
  created_by    uuid references auth.users(id),

  -- البيانات الأساسية
  name          text not null,                          -- اسم جهة الاتصال (شخص أو شركة)
  type          text not null default 'tenant',         -- tenant | owner | buyer | agent | supplier | other
  phone         text default '',                        -- رقم الجوال (+966 5XXXXXXXX)
  phone2        text default '',                        -- رقم جوال إضافي
  email         text default '',                        -- البريد الإلكتروني
  id_number     text default '',                        -- رقم الهوية / السجل التجاري
  id_type       text default 'national_id',             -- national_id | iqama | commercial_reg | passport

  -- العنوان
  city          text default '',                        -- المدينة
  district      text default '',                        -- الحي
  address       text default '',                        -- العنوان التفصيلي

  -- معلومات إضافية
  company_name  text default '',                        -- اسم الشركة (إن كان الشخص يمثل شركة)
  nationality   text default '',                        -- الجنسية
  tags          text default '',                        -- وسوم حرة مفصولة بفاصلة (VIP, متأخر, ...)

  -- ملاحظات
  notes         text default '',

  -- الطوابع الزمنية
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ═══════════════════════════════════════
-- الفهارس
-- ═══════════════════════════════════════
create index if not exists idx_contacts_office on public.contacts(office_id);
create index if not exists idx_contacts_type   on public.contacts(type);
create index if not exists idx_contacts_phone  on public.contacts(phone);

-- ═══════════════════════════════════════
-- RLS — إلزامي حسب قواعد المشروع
-- ═══════════════════════════════════════
alter table public.contacts enable row level security;

-- سياسة القراءة: أعضاء المكتب فقط
create policy "contacts_select_office"
  on public.contacts for select
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة الإضافة: أعضاء المكتب فقط
create policy "contacts_insert_office"
  on public.contacts for insert
  with check (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة التعديل: أعضاء المكتب فقط
create policy "contacts_update_office"
  on public.contacts for update
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- سياسة الحذف: أعضاء المكتب فقط
create policy "contacts_delete_office"
  on public.contacts for delete
  using (
    office_id in (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- Trigger — تحديث updated_at تلقائياً
-- ═══════════════════════════════════════
-- الدالة update_updated_at() موجودة مسبقاً من 001_create_properties.sql
drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at();
