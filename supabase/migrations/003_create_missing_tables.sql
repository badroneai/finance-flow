-- ============================================================
-- قيد العقار — Migration 003: الجداول المفقودة السبعة
-- ============================================================
-- آمن للتشغيل أكثر من مرة — يحذف ثم يُنشئ كل جدول من جديد
-- ملاحظة: DROP CASCADE يحذف البيانات الموجودة في هذه الجداول
-- الجداول الأصلية (contracts, properties...) لا تُمسّ
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- حذف الجداول القديمة (إذا وُجدت ناقصة أو تالفة)
-- ═══════════════════════════════════════════════════════════
drop table if exists public.contact_activities  cascade;
drop table if exists public.support_tickets     cascade;
drop table if exists public.attachments         cascade;
drop table if exists public.audit_log           cascade;
drop table if exists public.notifications       cascade;
drop table if exists public.maintenance_requests cascade;
drop table if exists public.payment_schedule    cascade;


-- ═══════════════════════════════════════════════════════════
-- دالة مشتركة: تحديث updated_at تلقائياً
-- ═══════════════════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ═══════════════════════════════════════════════════════════
-- 1. payment_schedule — جداول سداد الأقساط
-- ═══════════════════════════════════════════════════════════
create table public.payment_schedule (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        not null references public.offices(id)    on delete cascade,
  contract_id     uuid        not null references public.contracts(id)  on delete cascade,
  installment_no  integer     not null,
  due_date        date        not null,
  amount          numeric(12,2) not null check (amount >= 0),
  status          text        not null default 'pending'
                              check (status in ('pending','paid','overdue','partial','waived')),
  paid_amount     numeric(12,2) default 0 check (paid_amount >= 0),
  paid_date       date,
  payment_method  text        default 'cash'
                              check (payment_method in ('cash','bank','check','transfer','stc_pay','other')),
  transaction_id  uuid        references public.transactions(id) on delete set null,
  notes           text        default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_payment_schedule_office    on public.payment_schedule(office_id);
create index idx_payment_schedule_contract  on public.payment_schedule(contract_id);
create index idx_payment_schedule_due_date  on public.payment_schedule(due_date);
create index idx_payment_schedule_status    on public.payment_schedule(status);

create trigger trg_payment_schedule_updated_at
  before update on public.payment_schedule
  for each row execute function public.set_updated_at();

alter table public.payment_schedule enable row level security;

create policy "office_isolation_payment_schedule"
  on public.payment_schedule for all
  using  (office_id = (select office_id from public.profiles where id = auth.uid()))
  with check (office_id = (select office_id from public.profiles where id = auth.uid()));


-- ═══════════════════════════════════════════════════════════
-- 2. maintenance_requests — طلبات الصيانة
-- ═══════════════════════════════════════════════════════════
create table public.maintenance_requests (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        not null references public.offices(id)     on delete cascade,
  created_by      uuid        references auth.users(id),
  property_id     uuid        references public.properties(id)           on delete set null,
  contact_id      uuid        references public.contacts(id)             on delete set null,
  title           text        not null,
  description     text        default '',
  category        text        not null default 'other'
                              check (category in ('plumbing','electrical','ac','painting','carpentry','cleaning','other')),
  priority        text        not null default 'medium'
                              check (priority in ('low','medium','high','urgent')),
  status          text        not null default 'open'
                              check (status in ('open','in_progress','resolved','closed','cancelled')),
  estimated_cost  numeric(12,2) default 0 check (estimated_cost >= 0),
  actual_cost     numeric(12,2) default 0 check (actual_cost >= 0),
  vendor_name     text        default '',
  vendor_phone    text        default '',
  reported_at     timestamptz not null default now(),
  scheduled_at    timestamptz,
  resolved_at     timestamptz,
  notes           text        default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_maintenance_office    on public.maintenance_requests(office_id);
create index idx_maintenance_property  on public.maintenance_requests(property_id);
create index idx_maintenance_status    on public.maintenance_requests(status);
create index idx_maintenance_priority  on public.maintenance_requests(priority);

create trigger trg_maintenance_updated_at
  before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

alter table public.maintenance_requests enable row level security;

create policy "office_isolation_maintenance"
  on public.maintenance_requests for all
  using  (office_id = (select office_id from public.profiles where id = auth.uid()))
  with check (office_id = (select office_id from public.profiles where id = auth.uid()));


-- ═══════════════════════════════════════════════════════════
-- 3. notifications — نظام الإشعارات
-- ═══════════════════════════════════════════════════════════
create table public.notifications (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        not null references public.offices(id)     on delete cascade,
  user_id         uuid        not null references auth.users(id)         on delete cascade,
  type            text        not null default 'info'
                              check (type in ('info','warning','danger','success')),
  category        text        not null default 'system'
                              check (category in ('contract_expiry','payment_due','maintenance','system','other')),
  title           text        not null,
  body            text        default '',
  entity_type     text        check (entity_type in ('contract','property','contact','payment','maintenance')),
  entity_id       uuid,
  is_read         boolean     not null default false,
  read_at         timestamptz,
  scheduled_at    timestamptz not null default now(),
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_notifications_office     on public.notifications(office_id);
create index idx_notifications_user       on public.notifications(user_id);
create index idx_notifications_unread     on public.notifications(user_id, is_read) where (is_read = false);
create index idx_notifications_scheduled  on public.notifications(scheduled_at);

alter table public.notifications enable row level security;

create policy "user_isolation_notifications"
  on public.notifications for all
  using (
    user_id   = auth.uid()
    and office_id = (select office_id from public.profiles where id = auth.uid())
  )
  with check (
    office_id = (select office_id from public.profiles where id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 4. audit_log — سجل التدقيق (PDPL) — append only
-- ═══════════════════════════════════════════════════════════
create table public.audit_log (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        references public.offices(id)     on delete set null,
  performed_by    uuid        references auth.users(id)         on delete set null,
  action          text        not null
                              check (action in ('create','update','delete','export','login','logout','view')),
  entity_type     text        not null,
  entity_id       uuid,
  old_values      jsonb,
  new_values      jsonb,
  metadata        jsonb       default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index idx_audit_log_office    on public.audit_log(office_id);
create index idx_audit_log_user      on public.audit_log(performed_by);
create index idx_audit_log_entity    on public.audit_log(entity_type, entity_id);
create index idx_audit_log_created   on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy "read_own_office_audit"
  on public.audit_log for select
  using (office_id = (select office_id from public.profiles where id = auth.uid()));


-- ═══════════════════════════════════════════════════════════
-- 5. attachments — المرفقات
-- ═══════════════════════════════════════════════════════════
create table public.attachments (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        not null references public.offices(id)     on delete cascade,
  uploaded_by     uuid        references auth.users(id)                  on delete set null,
  entity_type     text        not null
                              check (entity_type in ('contract','property','contact','maintenance','transaction')),
  entity_id       uuid        not null,
  file_name       text        not null,
  file_path       text        not null,
  file_size       bigint      default 0 check (file_size >= 0),
  mime_type       text        default 'application/octet-stream',
  is_public       boolean     not null default false,
  notes           text        default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_attachments_office  on public.attachments(office_id);
create index idx_attachments_entity  on public.attachments(entity_type, entity_id);

create trigger trg_attachments_updated_at
  before update on public.attachments
  for each row execute function public.set_updated_at();

alter table public.attachments enable row level security;

create policy "office_isolation_attachments"
  on public.attachments for all
  using  (office_id = (select office_id from public.profiles where id = auth.uid()))
  with check (office_id = (select office_id from public.profiles where id = auth.uid()));


-- ═══════════════════════════════════════════════════════════
-- 6. support_tickets — تذاكر الدعم الفني
-- ═══════════════════════════════════════════════════════════
create table public.support_tickets (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        references public.offices(id)     on delete set null,
  submitted_by    uuid        references auth.users(id)         on delete set null,
  ticket_number   text        not null unique,
  subject         text        not null,
  description     text        not null,
  category        text        not null default 'general'
                              check (category in ('general','billing','bug','feature','data')),
  priority        text        not null default 'medium'
                              check (priority in ('low','medium','high','urgent')),
  status          text        not null default 'open'
                              check (status in ('open','in_progress','waiting','resolved','closed')),
  response        text        default '',
  resolved_by     uuid        references auth.users(id)         on delete set null,
  resolved_at     timestamptz,
  contact_email   text        default '',
  contact_name    text        default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_support_tickets_office   on public.support_tickets(office_id);
create index idx_support_tickets_status   on public.support_tickets(status);
create index idx_support_tickets_number   on public.support_tickets(ticket_number);

create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

create policy "office_isolation_support_tickets"
  on public.support_tickets for all
  using  (office_id = (select office_id from public.profiles where id = auth.uid()))
  with check (office_id = (select office_id from public.profiles where id = auth.uid()));

create policy "allow_insert_support_ticket"
  on public.support_tickets for insert
  with check (submitted_by = auth.uid());


-- ═══════════════════════════════════════════════════════════
-- 7. contact_activities — سجل نشاطات جهات الاتصال
-- ═══════════════════════════════════════════════════════════
create table public.contact_activities (
  id              uuid        primary key default gen_random_uuid(),
  office_id       uuid        not null references public.offices(id)     on delete cascade,
  contact_id      uuid        not null references public.contacts(id)    on delete cascade,
  created_by      uuid        references auth.users(id)                  on delete set null,
  activity_type   text        not null default 'note'
                              check (activity_type in ('note','call','meeting','email','contract','payment','visit','other')),
  title           text        not null,
  description     text        default '',
  entity_type     text        check (entity_type in ('contract','payment','maintenance')),
  entity_id       uuid,
  activity_date   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_contact_activities_office   on public.contact_activities(office_id);
create index idx_contact_activities_contact  on public.contact_activities(contact_id);
create index idx_contact_activities_date     on public.contact_activities(activity_date desc);
create index idx_contact_activities_type     on public.contact_activities(activity_type);

create trigger trg_contact_activities_updated_at
  before update on public.contact_activities
  for each row execute function public.set_updated_at();

alter table public.contact_activities enable row level security;

create policy "office_isolation_contact_activities"
  on public.contact_activities for all
  using  (office_id = (select office_id from public.profiles where id = auth.uid()))
  with check (office_id = (select office_id from public.profiles where id = auth.uid()));


-- ═══════════════════════════════════════════════════════════
-- تحقق ختامي — يجب أن يُظهر 7 صفوف
-- ═══════════════════════════════════════════════════════════
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'payment_schedule','maintenance_requests','notifications',
    'audit_log','attachments','support_tickets','contact_activities'
  )
order by table_name;
