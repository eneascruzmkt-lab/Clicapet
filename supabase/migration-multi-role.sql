-- Migration: Multi-role signup
-- Execute no SQL Editor do Supabase

-- Tabela de clinicas
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de perfis
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('clinic_owner', 'client')),
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vaccine', 'consultation')),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar profile_id na tabela clients
ALTER TABLE clients ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies: clinics
CREATE POLICY "Dono gerencia propria clinica"
  ON clinics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Qualquer usuario busca clinica por invite_code"
  ON clinics FOR SELECT
  USING (true);

-- Policies: profiles
CREATE POLICY "Usuario gerencia proprio perfil"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies: appointments
CREATE POLICY "Dono gerencia agendamentos da clinica"
  ON appointments FOR ALL
  USING (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid()));

CREATE POLICY "Tutor visualiza proprios agendamentos"
  ON appointments FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Tutor cria agendamentos para proprios pets"
  ON appointments FOR INSERT
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));
