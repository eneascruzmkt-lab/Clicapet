-- Migration: Policies para tutores
-- Cole tudo no SQL Editor do Supabase e execute
-- NOTA: As 3 policies abaixo ja foram rodadas. So rode novamente se estiver criando o banco do zero.

-- 1. Tutor gerencia pets
CREATE POLICY "Tutor gerencia proprios pets"
  ON pets FOR ALL
  USING (client_id IN (
    SELECT c.id FROM clients c
    JOIN profiles p ON c.profile_id = p.id
    WHERE p.user_id = auth.uid()
  ))
  WITH CHECK (client_id IN (
    SELECT c.id FROM clients c
    JOIN profiles p ON c.profile_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- 2. Tutor visualiza vacinas
CREATE POLICY "Tutor visualiza vacinas dos proprios pets"
  ON vaccines FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN clients c ON p.client_id = c.id
    JOIN profiles pr ON c.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- 3. Tutor visualiza proprio registro de cliente
CREATE POLICY "Tutor visualiza proprio registro de cliente"
  ON clients FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- 4. Tutor visualiza prontuarios (ja existe, nao precisa rodar)
-- CREATE POLICY "Tutor visualiza prontuarios dos proprios pets"
--   ON medical_records FOR SELECT
--   USING (pet_id IN (
--     SELECT p.id FROM pets p
--     JOIN clients c ON p.client_id = c.id
--     JOIN profiles pr ON c.profile_id = pr.id
--     WHERE pr.user_id = auth.uid()
--   ));
