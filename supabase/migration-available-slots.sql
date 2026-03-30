-- Migration: Horarios disponiveis para agendamento
-- Cole tudo no SQL Editor do Supabase e execute

-- Tabela de horarios disponiveis da clinica
CREATE TABLE available_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;

-- Dono da clinica gerencia seus horarios
CREATE POLICY "Dono gerencia horarios da clinica"
  ON available_slots FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

-- Tutor visualiza horarios da sua clinica
CREATE POLICY "Tutor visualiza horarios da clinica"
  ON available_slots FOR SELECT
  USING (clinic_id IN (
    SELECT clinic_id FROM profiles WHERE user_id = auth.uid()
  ));
