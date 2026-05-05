-- =============================================
-- Alo Nhà - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('elderly', 'caregiver')),
  elder_id UUID,
  link_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Medications table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time TEXT NOT NULL,
  dosage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sos', 'medication', 'health')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profiles
CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. RLS Policies for medications
CREATE POLICY "Elder can read own meds" ON medications
  FOR SELECT USING (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Elder can insert own meds" ON medications
  FOR INSERT WITH CHECK (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Elder can update own meds" ON medications
  FOR UPDATE USING (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Elder can delete own meds" ON medications
  FOR DELETE USING (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

-- 7. RLS Policies for alerts
CREATE POLICY "Can read alerts" ON alerts
  FOR SELECT USING (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Can insert alerts" ON alerts
  FOR INSERT WITH CHECK (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Can update alerts" ON alerts
  FOR UPDATE USING (
    elder_id = auth.uid()
    OR elder_id IN (SELECT elder_id FROM profiles WHERE id = auth.uid())
  );

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE medications;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
