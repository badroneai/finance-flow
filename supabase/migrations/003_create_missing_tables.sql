-- ============================================================
-- قيد العقار — Migration 003: الجداول المفقودة السبعة
-- ============================================================
-- الجداول: payment_schedule, maintenance_requests, notifications,
--          audit_log, attachments, support_tickets, contact_activities
-- يُنفَّذ في SQL Editor داخل لوحة تحكم Supabase (بعد migration 002)
-- RLS مفعّل على كل جدول — عزل كامل على مستوى office_id
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- 1. payment_schedule — جداول سداد الأقساط
-- ═══════════════════════════════════════════════════════════
-- يخزّن الأقساط المتوقعة والمدفوعة لكل عقد.
-- يُولَّد تلقائياً عند إنشاء العقد وفق دورة الدفع.
create table if not exists public.payment_schedule (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  contract_id     uuid not null references public.contracts(id) on delete cascade,

  -- بيانات القسط
  installment_no  integer not null,                       -- رقم القسط (1، 2، 3…)
  due_date        date not null,                          -- تاريخ الاستحقاق
  amount          numeric(12, 2) not null check (amount >= 0), -- مبلغ القسط بالريال

  -- حالة السداد
  status          text not null default 'pending'         -- pending | paid | overdue | partial | waived
    check (status in ('pending', 'paid', 'overdue', 'partial', 'waived')),
  paid_amount     numeric(12, 2) default 0 check (paid_amount >= 0), -- المبلغ المدفوع فعلياً
  paid_date       date,                                   -- تاريخ السداد الفعلي
  payment_method  text default 'cash'                     -- cash | bank | check | transfer | stc_pay | other
    check (payment_method in ('cash', 'bank', 'check', 'transfer', 'stc_pay', 'other')),
  transaction_id  uuid references public.transactions(id) on delete set null, -- ربط بالمعاملة المالية

  notes           text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_payment_schedule_office on public.payment_schedule(office_id);
create index if not exists idx_payment_schedule_contract on public.payment_schedule(contract_id);
create index if not exists idx_payment_schedule_due_date on public.payment_schedule(due_date);
create index if not exists idx_payment_schedule_status on public.payment_schedule(status);

-- trigger: updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_payment_schedule_updated_at
  before update on public.payment_schedule
  for each row execute function public.set_updated_at();

-- RLS
alter table public.payment_schedule enable row level security;

create policy "office_isolation_payment_schedule"
  on public.payment_schedule
  for all
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 2. maintenance_requests — طلبات الصيانة
-- ═══════════════════════════════════════════════════════════
create table if not exists public.maintenance_requests (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  created_by      uuid references auth.users(id),

  -- الربط
  property_id     uuid references public.properties(id) on delete set null,
  contact_id      uuid references public.contacts(id) on delete set null, -- المستأجر/المبلّغ

  -- تفاصيل الطلب
  title           text not null,                          -- عنوان المشكلة (مثال: عطل تكييف)
  description     text default '',                        -- وصف تفصيلي
  category        text not null default 'other'           -- plumbing | electrical | ac | painting | carpentry | cleaning | other
    check (category in ('plumbing', 'electrical', 'ac', 'painting', 'carpentry', 'cleaning', 'other')),
  priority        text not null default 'medium'          -- low | medium | high | urgent
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status          text not null default 'open'            -- open | in_progress | resolved | closed | cancelled
    check (status in ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),

  -- التكلفة
  estimated_cost  numeric(12, 2) default 0 check (estimated_cost >= 0),
  actual_cost     numeric(12, 2) default 0 check (actual_cost >= 0),

  -- المورد/الفني
  vendor_name     text default '',
  vendor_phone    text default '',

  -- التواريخ
  reported_at     timestamptz not null default now(),     -- تاريخ الإبلاغ
  scheduled_at    timestamptz,                            -- الموعد المحدد للإصلاح
  resolved_at     timestamptz,                            -- تاريخ الحل

  notes           text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_maintenance_office on public.maintenance_requests(office_id);
create index if not exists idx_maintenance_property on public.maintenance_requests(property_id);
create index if not exists idx_maintenance_status on public.maintenance_requests(status);
create index if not exists idx_maintenance_priority on public.maintenance_requests(priority);

create trigger trg_maintenance_updated_at
  before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

-- RLS
alter table public.maintenance_requests enable row level security;

create policy "office_isolation_maintenance"
  on public.maintenance_requests
  for all
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 3. notifications — نظام الإشعارات
-- ═══════════════════════════════════════════════════════════
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade, -- المستلم

  -- محتوى الإشعار
  type            text not null default 'info'            -- info | warning | danger | success
    check (type in ('info', 'warning', 'danger', 'success')),
  category        text not null default 'system'          -- contract_expiry | payment_due | maintenance | system | other
    check (category in ('contract_expiry', 'payment_due', 'maintenance', 'system', 'other')),
  title           text not null,
  body            text default '',

  -- الربط (اختياري)
  entity_type     text default null                       -- contract | property | contact | payment | maintenance
    check (entity_type in ('contract', 'property', 'contact', 'payment', 'maintenance') or entity_type is null),
  entity_id       uuid default null,                      -- ID الكيان المرتبط

  -- الحالة
  is_read         boolean not null default false,
  read_at         timestamptz,

  -- الجدولة (للإشعارات المستقبلية)
  scheduled_at    timestamptz not null default now(),     -- وقت إرسال الإشعار
  expires_at      timestamptz,                            -- انتهاء صلاحية الإشعار

  created_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_notifications_office on public.notifications(office_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;
create index if not exists idx_notifications_scheduled on public.notifications(scheduled_at);

-- RLS: المستخدم يرى إشعاراته فقط، ضمن نفس المكتب
alter table public.notifications enable row level security;

create policy "user_isolation_notifications"
  on public.notifications
  for all
  using (
    user_id = auth.uid()
    and office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 4. audit_log — سجل التدقيق (للامتثال PDPL)
-- ═══════════════════════════════════════════════════════════
-- يسجّل كل إجراء مهم: إنشاء/تعديل/حذف البيانات الحساسة.
-- القاعدة: لا حذف من audit_log — append only.
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid references public.offices(id) on delete set null, -- NULL إذا حُذف المكتب
  performed_by    uuid references auth.users(id) on delete set null,     -- من نفّذ الإجراء

  -- ماذا حدث
  action          text not null                           -- create | update | delete | export | login | logout
    check (action in ('create', 'update', 'delete', 'export', 'login', 'logout', 'view')),
  entity_type     text not null,                          -- contract | property | contact | transaction | profile | office
  entity_id       uuid,                                   -- ID الكيان المتأثر

  -- تفاصيل التغيير
  old_values      jsonb default null,                     -- القيم قبل التعديل
  new_values      jsonb default null,                     -- القيم بعد التعديل
  metadata        jsonb default '{}'::jsonb,              -- بيانات إضافية (IP, user-agent…)

  created_at      timestamptz not null default now()
  -- لا updated_at — هذا الجدول للقراءة فقط بعد الإدراج
);

-- indexes
create index if not exists idx_audit_log_office on public.audit_log(office_id);
create index if not exists idx_audit_log_user on public.audit_log(performed_by);
create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_created on public.audit_log(created_at desc);

-- RLS: القراءة فقط لأعضاء نفس المكتب، الكتابة عبر service_role فقط
alter table public.audit_log enable row level security;

create policy "read_own_office_audit"
  on public.audit_log
  for select
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- لا policy للـ INSERT/UPDATE/DELETE من العميل — يتم عبر Database Functions أو service_role


-- ═══════════════════════════════════════════════════════════
-- 5. attachments — المرفقات
-- ═══════════════════════════════════════════════════════════
-- يخزّن metadata الملفات. الملف الفعلي في Supabase Storage.
create table if not exists public.attachments (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  uploaded_by     uuid references auth.users(id) on delete set null,

  -- الربط (بكيان واحد فقط في المرة)
  entity_type     text not null                           -- contract | property | contact | maintenance | transaction
    check (entity_type in ('contract', 'property', 'contact', 'maintenance', 'transaction')),
  entity_id       uuid not null,

  -- بيانات الملف
  file_name       text not null,                          -- الاسم الأصلي
  file_path       text not null,                          -- المسار في Supabase Storage
  file_size       bigint default 0 check (file_size >= 0), -- الحجم بالبايت
  mime_type       text default 'application/octet-stream', -- نوع الملف
  is_public       boolean not null default false,         -- هل يمكن الوصول بدون تسجيل؟

  notes           text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_attachments_office on public.attachments(office_id);
create index if not exists idx_attachments_entity on public.attachments(entity_type, entity_id);

create trigger trg_attachments_updated_at
  before update on public.attachments
  for each row execute function public.set_updated_at();

-- RLS
alter table public.attachments enable row level security;

create policy "office_isolation_attachments"
  on public.attachments
  for all
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 6. support_tickets — تذاكر الدعم الفني
-- ═══════════════════════════════════════════════════════════
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid references public.offices(id) on delete set null, -- NULL إذا حُذف المكتب
  submitted_by    uuid references auth.users(id) on delete set null,

  -- بيانات التذكرة
  ticket_number   text not null unique,                   -- مثال: TKT-20260401-0001
  subject         text not null,
  description     text not null,
  category        text not null default 'general'         -- general | billing | bug | feature | data
    check (category in ('general', 'billing', 'bug', 'feature', 'data')),
  priority        text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status          text not null default 'open'            -- open | in_progress | waiting | resolved | closed
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),

  -- الرد
  response        text default '',
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_at     timestamptz,

  -- بيانات الاتصال (للمستخدمين غير المسجلين أيضاً)
  contact_email   text default '',
  contact_name    text default '',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_support_tickets_office on public.support_tickets(office_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_number on public.support_tickets(ticket_number);

create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- RLS: كل مكتب يرى تذاكره فقط
alter table public.support_tickets enable row level security;

create policy "office_isolation_support_tickets"
  on public.support_tickets
  for all
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );

-- السماح للمستخدمين بإنشاء تذاكر حتى بدون office_id (مثلاً قبل ربط المكتب)
create policy "allow_insert_support_ticket"
  on public.support_tickets
  for insert
  with check (
    submitted_by = auth.uid()
  );


-- ═══════════════════════════════════════════════════════════
-- 7. contact_activities — سجل نشاطات جهات الاتصال
-- ═══════════════════════════════════════════════════════════
-- يتتبع كل تفاعل مع جهة الاتصال: مكالمة، زيارة، تعاقد، ملاحظة…
create table if not exists public.contact_activities (
  id              uuid primary key default gen_random_uuid(),
  office_id       uuid not null references public.offices(id) on delete cascade,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,

  -- تفاصيل النشاط
  activity_type   text not null default 'note'            -- note | call | meeting | email | contract | payment | visit | other
    check (activity_type in ('note', 'call', 'meeting', 'email', 'contract', 'payment', 'visit', 'other')),
  title           text not null,
  description     text default '',

  -- الربط الاختياري بكيانات أخرى
  entity_type     text default null                       -- contract | payment | maintenance
    check (entity_type in ('contract', 'payment', 'maintenance') or entity_type is null),
  entity_id       uuid default null,

  -- التوقيت
  activity_date   timestamptz not null default now(),     -- وقت النشاط الفعلي (قد يختلف عن created_at)

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- indexes
create index if not exists idx_contact_activities_office on public.contact_activities(office_id);
create index if not exists idx_contact_activities_contact on public.contact_activities(contact_id);
create index if not exists idx_contact_activities_date on public.contact_activities(activity_date desc);
create index if not exists idx_contact_activities_type on public.contact_activities(activity_type);

create trigger trg_contact_activities_updated_at
  before update on public.contact_activities
  for each row execute function public.set_updated_at();

-- RLS
alter table public.contact_activities enable row level security;

create policy "office_isolation_contact_activities"
  on public.contact_activities
  for all
  using (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    office_id = (
      select office_id from public.profiles where id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- تعليق ختامي
-- ═══════════════════════════════════════════════════════════
-- بعد تنفيذ هذا الملف:
--   ✓ 7 جداول جديدة مع RLS كامل
--   ✓ Triggers لـ updated_at على 5 جداول (audit_log لا يحتاجه)
--   ✓ Indexes للاستعلامات الشائعة
--   ✓ Constraints للحفاظ على سلامة البيانات
--
-- الخطوات التالية:
--   1. أنشئ Storage Bucket باسم "attachments" في Supabase Dashboard
--   2. فعّل RLS على الـ Bucket
--   3. أضف Storage policies تتحقق من office_id
-- ═══════════════════════════════════════════════════════════
