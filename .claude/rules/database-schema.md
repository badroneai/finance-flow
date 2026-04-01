# Database Schema — Supabase

> آخر تحديث: 2026-04-01

## نظرة عامة

- **17 جدول مُفعّل** (10 أصلية + 7 مضافة في migration 003)
- **RLS مفعّل** على كل جدول — عزل على مستوى `office_id`
- **Cascade delete** من offices لكل الجداول التابعة
- الكود في: `src/core/supabase-store.js` (873 سطر)
- ملفات SQL في: `sql/` و `supabase/migrations/`

---

## الجداول المُفعّلة

### 1. offices — المكاتب العقارية
```
id          uuid        PK
name        text        اسم المكتب
settings    jsonb       إعدادات المكتب
created_at  timestamptz
updated_at  timestamptz
```
**العلاقات**: أب لكل الجداول الأخرى عبر office_id

---

### 2. profiles — ملفات المستخدمين
```
id          uuid        PK, FK → auth.users
office_id   uuid        FK → offices
full_name   text
role        text        owner | manager | agent | super_admin
created_at  timestamptz
updated_at  timestamptz
```
**العلاقات**: profiles → offices (N:1), profiles → auth.users (1:1)

---

### 3. properties — العقارات
```
id              uuid            PK
office_id       uuid            FK → offices (CASCADE)
created_by      uuid            FK → auth.users
name            text            مثال: عمارة النور
type            text            apartment | villa | building | office | chalet | land | warehouse | other
status          text            available | rented | maintenance | sold
city            text
district        text
address         text
lat             double precision
lng             double precision
units_count     integer         ≥ 0
area_sqm        numeric(10,2)   > 0
bedrooms        integer
bathrooms       integer
year_built      integer
floors          integer
owner_name      text
owner_phone     text
purchase_price  numeric(12,2)   ≥ 0
monthly_rent    numeric(10,2)   ≥ 0
notes           text
created_at      timestamptz
updated_at      timestamptz     (trigger)
```
**Indexes**: office_id, status, type
**SQL**: `sql/001_create_properties.sql`

---

### 4. contacts — جهات الاتصال
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
created_by      uuid        FK → auth.users
name            text
type            text        tenant | owner | buyer | agent | supplier | other
phone           text        +966 5XXXXXXXX
phone2          text
email           text
id_number       text        رقم الهوية/الإقامة/السجل/الجواز
id_type         text        national_id | iqama | commercial_reg | passport
city            text
district        text
address         text
company_name    text
nationality     text
tags            text        VIP, متأخر (comma-separated)
notes           text
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, type, phone
**SQL**: `sql/002_create_contacts.sql`

---

### 5. contracts — العقود
```
id              uuid            PK
office_id       uuid            FK → offices (CASCADE)
created_by      uuid            FK → auth.users
property_id     uuid            FK → properties (SET NULL)
contact_id      uuid            FK → contacts (SET NULL)
contract_number text
type            text            rent | sale | management | other
status          text            draft | active | expired | terminated | renewed
start_date      date
end_date        date            ≥ start_date
duration_months integer         > 0
total_amount    numeric(12,2)   ≥ 0
monthly_rent    numeric(12,2)   ≥ 0
deposit_amount  numeric(12,2)   ≥ 0
payment_cycle   text            monthly | quarterly | semi_annual | annual | custom
auto_renew      boolean
notes           text
created_at      timestamptz
updated_at      timestamptz     (trigger)
```
**Constraints**: valid_dates, positive_total, positive_monthly_rent, positive_deposit, positive_duration
**Trigger**: `check_contract_office_match()` — يتأكد أن property_id و contact_id من نفس office_id
**Indexes**: office_id, property_id, contact_id, status, end_date
**SQL**: `sql/003_create_contracts.sql`, `supabase/migrations/002_add_constraints.sql`

---

### 6. ledgers — الدفاتر المالية
```
id          uuid        PK
office_id   uuid        FK → offices
name        text
archived    boolean     false = نشط
created_at  timestamptz
updated_at  timestamptz
```
**العلاقات**: أب لـ transactions, recurring_items, commissions

---

### 7. transactions — المعاملات المالية
```
id              uuid        PK
office_id       uuid        FK → offices
ledger_id       uuid        FK → ledgers
type            text        إيراد/مصروف
category        text
description     text
amount          numeric
payment_method  text        cash | bank | check | ...
date            date
created_at      timestamptz
updated_at      timestamptz
```

---

### 8. recurring_items — البنود المتكررة
```
id              uuid        PK
office_id       uuid        FK → offices
ledger_id       uuid        FK → ledgers
description     text
amount          numeric
frequency       text        monthly | quarterly | ...
next_due_date   date
created_at      timestamptz
updated_at      timestamptz
```

---

### 9. commissions — العمولات
```
id          uuid        PK
office_id   uuid        FK → offices
ledger_id   uuid        FK → ledgers
agent_id    uuid        FK → profiles
status      text        pending | paid | processed
amount      numeric
description text
created_at  timestamptz
updated_at  timestamptz
```

---

### 10. drafts — المسودات
```
id          uuid        PK
office_id   uuid        FK → offices
title       text
content     text/jsonb
type        text
created_at  timestamptz
updated_at  timestamptz
```

---

## الجداول المضافة (Migration 003)

**SQL**: `supabase/migrations/003_create_missing_tables.sql`

### 11. payment_schedule — جداول سداد الأقساط
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
contract_id     uuid        FK → contracts (CASCADE)
installment_no  integer     رقم القسط
due_date        date        تاريخ الاستحقاق
amount          numeric(12,2)  ≥ 0
status          text        pending | paid | overdue | partial | waived
paid_amount     numeric(12,2)  ≥ 0
paid_date       date
payment_method  text        cash | bank | check | transfer | stc_pay | other
transaction_id  uuid        FK → transactions (SET NULL)
notes           text
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, contract_id, due_date, status

---

### 12. maintenance_requests — طلبات الصيانة
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
created_by      uuid        FK → auth.users
property_id     uuid        FK → properties (SET NULL)
contact_id      uuid        FK → contacts (SET NULL)
title           text
description     text
category        text        plumbing | electrical | ac | painting | carpentry | cleaning | other
priority        text        low | medium | high | urgent
status          text        open | in_progress | resolved | closed | cancelled
estimated_cost  numeric(12,2)  ≥ 0
actual_cost     numeric(12,2)  ≥ 0
vendor_name     text
vendor_phone    text
reported_at     timestamptz
scheduled_at    timestamptz
resolved_at     timestamptz
notes           text
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, property_id, status, priority

---

### 13. notifications — نظام الإشعارات
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
user_id         uuid        FK → auth.users (CASCADE)
type            text        info | warning | danger | success
category        text        contract_expiry | payment_due | maintenance | system | other
title           text
body            text
entity_type     text        contract | property | contact | payment | maintenance | NULL
entity_id       uuid
is_read         boolean     default false
read_at         timestamptz
scheduled_at    timestamptz
expires_at      timestamptz
created_at      timestamptz
```
**RLS**: user_id = auth.uid() فقط
**Indexes**: office_id, user_id, is_read (partial), scheduled_at

---

### 14. audit_log — سجل التدقيق (PDPL)
```
id              uuid        PK
office_id       uuid        FK → offices (SET NULL)
performed_by    uuid        FK → auth.users (SET NULL)
action          text        create | update | delete | export | login | logout | view
entity_type     text        contract | property | contact | transaction | profile | office
entity_id       uuid
old_values      jsonb
new_values      jsonb
metadata        jsonb       IP، user-agent، إلخ
created_at      timestamptz
```
**ملاحظة**: Append-only — لا UPDATE/DELETE من العميل. الكتابة عبر Database Functions أو service_role.
**Indexes**: office_id, performed_by, (entity_type, entity_id), created_at DESC

---

### 15. attachments — المرفقات
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
uploaded_by     uuid        FK → auth.users (SET NULL)
entity_type     text        contract | property | contact | maintenance | transaction
entity_id       uuid
file_name       text        الاسم الأصلي
file_path       text        المسار في Supabase Storage
file_size       bigint      ≥ 0 (بالبايت)
mime_type       text
is_public       boolean     default false
notes           text
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, (entity_type, entity_id)
**ملاحظة**: يتطلب Storage Bucket باسم "attachments" مع RLS

---

### 16. support_tickets — تذاكر الدعم الفني
```
id              uuid        PK
office_id       uuid        FK → offices (SET NULL)
submitted_by    uuid        FK → auth.users (SET NULL)
ticket_number   text        UNIQUE — مثال: TKT-20260401-0001
subject         text
description     text
category        text        general | billing | bug | feature | data
priority        text        low | medium | high | urgent
status          text        open | in_progress | waiting | resolved | closed
response        text
resolved_by     uuid        FK → auth.users (SET NULL)
resolved_at     timestamptz
contact_email   text
contact_name    text
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, status, ticket_number

---

### 17. contact_activities — سجل نشاطات جهات الاتصال
```
id              uuid        PK
office_id       uuid        FK → offices (CASCADE)
contact_id      uuid        FK → contacts (CASCADE)
created_by      uuid        FK → auth.users (SET NULL)
activity_type   text        note | call | meeting | email | contract | payment | visit | other
title           text
description     text
entity_type     text        contract | payment | maintenance | NULL
entity_id       uuid
activity_date   timestamptz وقت النشاط الفعلي
created_at      timestamptz
updated_at      timestamptz (trigger)
```
**Indexes**: office_id, contact_id, activity_date DESC, activity_type

---

## مخطط العلاقات (كامل)

```
offices (1) ──→ (N) profiles
offices (1) ──→ (N) properties
offices (1) ──→ (N) contacts
offices (1) ──→ (N) contracts
offices (1) ──→ (N) ledgers
offices (1) ──→ (N) transactions
offices (1) ──→ (N) recurring_items
offices (1) ──→ (N) commissions
offices (1) ──→ (N) drafts
offices (1) ──→ (N) payment_schedule
offices (1) ──→ (N) maintenance_requests
offices (1) ──→ (N) notifications
offices (1) ──→ (N) attachments
offices (1) ──→ (N) support_tickets
offices (1) ──→ (N) contact_activities

properties (1) ──→ (N) contracts            [SET NULL on delete]
contacts   (1) ──→ (N) contracts            [SET NULL on delete]
contracts  (1) ──→ (N) payment_schedule     [CASCADE on delete]
ledgers    (1) ──→ (N) transactions
ledgers    (1) ──→ (N) recurring_items
ledgers    (1) ──→ (N) commissions
profiles   (1) ──→ (N) commissions          [agent_id]
contacts   (1) ──→ (N) contact_activities   [CASCADE on delete]
transactions (1) ──→ (N) payment_schedule   [SET NULL on delete]
```

## نمط الأمان (RLS)

كل جدول يُطبّق:
- **SELECT/INSERT/UPDATE/DELETE**: فقط إذا كان `office_id` = office_id في ملف المستخدم (profiles)
- حذف المكتب يحذف كل بياناته (CASCADE)
- حذف عقار/جهة اتصال → العقود تصبح NULL (لا تُحذف)
