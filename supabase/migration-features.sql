-- Migration: Prontuario, Financeiro, Calendario, WhatsApp
-- Execute no SQL Editor do Supabase

-- Prontuario / Historico Clinico
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'surgery', 'exam', 'emergency')),
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  weight_kg NUMERIC(5,2),
  vet_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia prontuarios dos pets dos clientes"
  ON medical_records FOR ALL
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    WHERE c.user_id = auth.uid()
  ))
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Tutor visualiza prontuarios dos proprios pets"
  ON medical_records FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- Financeiro
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'card', 'pending')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia transacoes da clinica"
  ON transactions FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));
