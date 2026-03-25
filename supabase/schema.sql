-- VetClinic MVP - Schema do banco de dados
-- Execute este SQL no editor SQL do Supabase

-- Clientes (tutores)
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pets
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vacinas
CREATE TABLE vaccines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  applied_at DATE NOT NULL,
  next_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lembretes
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_id UUID REFERENCES vaccines(id) ON DELETE CASCADE NOT NULL,
  send_at DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policies: clients
CREATE POLICY "Usuário gerencia próprios clientes"
  ON clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies: pets
CREATE POLICY "Usuário gerencia pets dos próprios clientes"
  ON pets FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Policies: vaccines
CREATE POLICY "Usuário gerencia vacinas dos próprios pets"
  ON vaccines FOR ALL
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

-- Policies: reminders (somente leitura para o usuário, escrita via service_role no cron)
CREATE POLICY "Usuário visualiza próprios lembretes"
  ON reminders FOR SELECT
  USING (vaccine_id IN (
    SELECT v.id FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN clients c ON p.client_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Usuário cria lembretes para próprias vacinas"
  ON reminders FOR INSERT
  WITH CHECK (vaccine_id IN (
    SELECT v.id FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN clients c ON p.client_id = c.id
    WHERE c.user_id = auth.uid()
  ));
