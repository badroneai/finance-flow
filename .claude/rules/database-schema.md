# Database Schema — Supabase

> آخر تحديث: 2026-03-29

## نظرة عامة

- **10 جداول مُفعّلة** + 7 جداول مخطط لها (TODO)
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

## جداول مخطط لها (TODO)

| الجدول | الغرض |
|--------|-------|
| `payment_schedule` | جداول سداد العقود |
| `maintenance_requests` | طلبات الصيانة |
| `contact_activities` | سجل نشاطات جهات الاتصال |
| `notifications` | نظام الإشعارات |
| `support_tickets` | تذاكر الدعم |
| `audit_log` | سجل التدقيق |
| `attachments` | المرفقات |

---

## مخطط العلاقات

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

properties (1) ──→ (N) contracts     [SET NULL on delete]
contacts   (1) ──→ (N) contracts     [SET NULL on delete]
ledgers    (1) ──→ (N) transactions
ledgers    (1) ──→ (N) recurring_items
ledgers    (1) ──→ (N) commissions
profiles   (1) ──→ (N) commissions   [agent_id]
```

## نمط الأمان (RLS)

كل جدول يُطبّق:
- **SELECT/INSERT/UPDATE/DELETE**: فقط إذا كان `office_id` = office_id في ملف المستخدم (profiles)
- حذف المكتب يحذف كل بياناته (CASCADE)
- حذف عقار/جهة اتصال → العقود تصبح NULL (لا تُحذف)
