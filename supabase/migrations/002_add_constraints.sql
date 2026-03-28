-- =============================================
-- قيود سلامة البيانات — Migration 002
-- =============================================

-- ── العقود (contracts) ──────────────────────────
-- تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية
ALTER TABLE contracts
  ADD CONSTRAINT valid_dates CHECK (end_date >= start_date);

-- المبلغ الإجمالي لا يمكن أن يكون سالباً
ALTER TABLE contracts
  ADD CONSTRAINT positive_total CHECK (total_amount >= 0);

-- الإيجار الشهري لا يمكن أن يكون سالباً
ALTER TABLE contracts
  ADD CONSTRAINT positive_monthly_rent CHECK (monthly_rent >= 0);

-- مبلغ التأمين لا يمكن أن يكون سالباً
ALTER TABLE contracts
  ADD CONSTRAINT positive_deposit CHECK (deposit_amount >= 0);

-- مدة العقد بالأشهر يجب أن تكون موجبة
ALTER TABLE contracts
  ADD CONSTRAINT positive_duration CHECK (duration_months > 0);

-- ── العقارات (properties) ───────────────────────
-- سعر الشراء لا يمكن أن يكون سالباً
ALTER TABLE properties
  ADD CONSTRAINT positive_purchase_price CHECK (purchase_price >= 0);

-- الإيجار الشهري للعقار لا يمكن أن يكون سالباً
ALTER TABLE properties
  ADD CONSTRAINT positive_property_rent CHECK (monthly_rent >= 0);

-- المساحة يجب أن تكون موجبة
ALTER TABLE properties
  ADD CONSTRAINT positive_area CHECK (area_sqm > 0);

-- عدد الوحدات لا يمكن أن يكون سالباً
ALTER TABLE properties
  ADD CONSTRAINT positive_units CHECK (units_count >= 0);
