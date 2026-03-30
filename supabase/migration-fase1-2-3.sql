-- Migration: Fases 1, 2 e 3
-- Cole tudo no SQL Editor do Supabase e execute

-- ============================
-- FASE 1: Dados do pet + Peso
-- ============================

-- Novos campos na tabela pets
ALTER TABLE pets ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('M', 'F'));
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Tabela de historico de peso
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(6,2) NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia peso dos pets"
  ON weight_records FOR ALL
  USING (pet_id IN (SELECT p.id FROM pets p JOIN clients c ON p.client_id = c.id WHERE c.user_id = auth.uid()))
  WITH CHECK (pet_id IN (SELECT p.id FROM pets p JOIN clients c ON p.client_id = c.id WHERE c.user_id = auth.uid()));

CREATE POLICY "Tutor visualiza peso dos proprios pets"
  ON weight_records FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- ============================
-- FASE 2: Receitas + Exames
-- ============================

-- Tabela de receitas/prescricoes
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia receitas"
  ON prescriptions FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

CREATE POLICY "Tutor visualiza receitas dos proprios pets"
  ON prescriptions FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- Tabela de exames (arquivos)
CREATE TABLE IF NOT EXISTS exam_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  type TEXT DEFAULT 'exam',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exam_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia exames"
  ON exam_files FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

CREATE POLICY "Tutor visualiza exames dos proprios pets"
  ON exam_files FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- ============================
-- FASE 3: Staff + Banho e Tosa
-- ============================

-- Tabela de funcionarios
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vet' CHECK (role IN ('vet', 'assistant', 'groomer', 'receptionist')),
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia funcionarios"
  ON staff FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

-- Tabela de servicos de banho e tosa
CREATE TABLE IF NOT EXISTS grooming_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  duration INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE grooming_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia servicos de banho"
  ON grooming_services FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

CREATE POLICY "Tutor visualiza servicos de banho"
  ON grooming_services FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

-- Agendamentos de banho e tosa
CREATE TABLE IF NOT EXISTS grooming_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES grooming_services(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE grooming_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia agendamentos de banho"
  ON grooming_appointments FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

CREATE POLICY "Tutor gerencia agendamentos de banho"
  ON grooming_appointments FOR ALL
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ))
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));
