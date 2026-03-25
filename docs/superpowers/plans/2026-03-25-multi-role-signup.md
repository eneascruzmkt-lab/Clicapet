# Multi-Role Signup & Portal - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar cadastro e dashboard em dois fluxos (dono de clinica e tutor), com dados adicionais, codigo de convite, e painel do tutor.

**Architecture:** Nova tabela `profiles` para roles, `clinics` para dados da clinica, `appointments` para agendamentos. Middleware atualizado para checar role e onboarding. Paginas separadas `/login` + `/dashboard` (dono) e `/portal` + `/portal/dashboard` (tutor).

**Tech Stack:** Next.js 16, Supabase (auth + DB + RLS), Tailwind CSS 4, React 19, Server Actions.

---

## File Structure

### New Files
- `src/lib/utils/cpf.ts` — validacao de CPF
- `src/lib/utils/masks.ts` — mascaras de telefone
- `src/lib/utils/invite-code.ts` — geracao de codigo de convite
- `src/services/profiles.ts` — server actions para profiles
- `src/services/clinics.ts` — server actions para clinics
- `src/services/appointments.ts` — server actions para appointments
- `src/components/phone-input.tsx` — input com mascara de telefone
- `src/components/cpf-input.tsx` — input com mascara e validacao de CPF
- `src/components/invite-code-card.tsx` — card com codigo de convite e botao copiar
- `src/components/portal-sidebar.tsx` — sidebar do tutor
- `src/app/onboarding/clinic/page.tsx` — onboarding do dono
- `src/app/onboarding/client/page.tsx` — onboarding do tutor
- `src/app/portal/page.tsx` — login/cadastro do tutor
- `src/app/portal/dashboard/page.tsx` — dashboard do tutor
- `src/app/portal/dashboard/layout.tsx` — layout do tutor
- `src/app/portal/dashboard/appointments/new/page.tsx` — agendar consulta/vacina
- `supabase/migration-multi-role.sql` — SQL com novas tabelas e policies

### Modified Files
- `src/app/login/page.tsx` — adaptar para fluxo de dono de clinica
- `src/app/page.tsx` — landing page com dois botoes
- `src/middleware.ts` — checar role, onboarding, redirect inteligente
- `src/app/dashboard/page.tsx` — adicionar card de codigo de convite
- `src/components/sidebar.tsx` — atualizar logout redirect
- `supabase/schema.sql` — adicionar novas tabelas

---

### Task 1: SQL Migration - Novas tabelas e policies

**Files:**
- Create: `supabase/migration-multi-role.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
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

CREATE POLICY "Tutor visualiza clinica vinculada"
  ON clinics FOR SELECT
  USING (id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

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

-- Permitir leitura de clinics por invite_code (para cadastro)
CREATE POLICY "Qualquer usuario busca clinica por invite_code"
  ON clinics FOR SELECT
  USING (true);
```

- [ ] **Step 2: Atualizar schema.sql com as novas tabelas**

Adicionar as novas tabelas ao final de `supabase/schema.sql` para manter documentacao completa.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add migration for clinics, profiles, appointments tables"
```

---

### Task 2: Utilitarios - CPF, mascaras, codigo de convite

**Files:**
- Create: `src/lib/utils/cpf.ts`
- Create: `src/lib/utils/masks.ts`
- Create: `src/lib/utils/invite-code.ts`

- [ ] **Step 1: Criar validacao de CPF**

```typescript
// src/lib/utils/cpf.ts

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[10])) return false

  return true
}
```

- [ ] **Step 2: Criar mascara de telefone**

```typescript
// src/lib/utils/masks.ts

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
```

- [ ] **Step 3: Criar gerador de codigo de convite**

```typescript
// src/lib/utils/invite-code.ts

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add CPF validation, phone mask, and invite code generator"
```

---

### Task 3: Componentes de input - PhoneInput e CpfInput

**Files:**
- Create: `src/components/phone-input.tsx`
- Create: `src/components/cpf-input.tsx`

- [ ] **Step 1: Criar PhoneInput**

```tsx
// src/components/phone-input.tsx
'use client'

import { useState } from 'react'
import { formatPhone } from '@/lib/utils/masks'

interface PhoneInputProps {
  name: string
  label: string
  required?: boolean
  defaultValue?: string
}

export function PhoneInput({ name, label, required, defaultValue }: PhoneInputProps) {
  const [value, setValue] = useState(defaultValue ? formatPhone(defaultValue) : '')

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="tel"
        required={required}
        value={value}
        onChange={(e) => setValue(formatPhone(e.target.value))}
        placeholder="(99) 99999-9999"
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
```

- [ ] **Step 2: Criar CpfInput**

```tsx
// src/components/cpf-input.tsx
'use client'

import { useState } from 'react'
import { formatCpf, validateCpf } from '@/lib/utils/cpf'

interface CpfInputProps {
  name: string
  label: string
  required?: boolean
}

export function CpfInput({ name, label, required }: CpfInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCpf(e.target.value)
    setValue(formatted)
    if (formatted.replace(/\D/g, '').length === 11) {
      setError(validateCpf(formatted) ? '' : 'CPF invalido')
    } else {
      setError('')
    }
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        value={value}
        onChange={handleChange}
        placeholder="000.000.000-00"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
        }`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/phone-input.tsx src/components/cpf-input.tsx
git commit -m "feat: add PhoneInput and CpfInput components with masks"
```

---

### Task 4: Services - profiles, clinics, appointments

**Files:**
- Create: `src/services/profiles.ts`
- Create: `src/services/clinics.ts`
- Create: `src/services/appointments.ts`

- [ ] **Step 1: Criar service de profiles**

```typescript
// src/services/profiles.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*, clinics(*)')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function createClinicOwnerProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { generateInviteCode } = await import('@/lib/utils/invite-code')

  // Criar clinica
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({
      user_id: user.id,
      name: formData.get('clinic_name') as string,
      phone: (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || null,
      address: formData.get('clinic_address') as string || null,
      invite_code: generateInviteCode(),
    })
    .select()
    .single()

  if (clinicError || !clinic) throw new Error('Failed to create clinic')

  // Criar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      role: 'clinic_owner',
      name: formData.get('clinic_name') as string,
      phone: (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || null,
      clinic_id: clinic.id,
      onboarding_complete: true,
    })

  if (profileError) throw new Error('Failed to create profile')
}

export async function createClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inviteCode = formData.get('invite_code') as string

  // Buscar clinica pelo codigo
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (!clinic) throw new Error('Codigo de convite invalido')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null

  // Criar perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      role: 'client',
      name,
      phone,
      cpf: (formData.get('cpf') as string)?.replace(/\D/g, '') || null,
      clinic_id: clinic.id,
      onboarding_complete: true,
    })
    .select()
    .single()

  if (profileError || !profile) throw new Error('Failed to create profile')

  // Criar registro em clients vinculado a clinica
  await supabase.from('clients').insert({
    user_id: clinic.id, // user_id da clinica (para RLS existente)
    profile_id: profile.id,
    name,
    phone,
    email: user.email,
  })
}
```

- [ ] **Step 2: Criar service de clinics**

```typescript
// src/services/clinics.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClinic() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('clinics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function getClinicByInviteCode(code: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('invite_code', code.toUpperCase().trim())
    .single()

  return data
}
```

- [ ] **Step 3: Criar service de appointments**

```typescript
// src/services/appointments.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAppointmentsForClinic() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select('*, pets(name, clients(name))')
    .order('scheduled_at', { ascending: true })

  return data ?? []
}

export async function getAppointmentsForClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return []

  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  if (!clients?.length) return []

  const clientIds = clients.map((c) => c.id)

  const { data } = await supabase
    .from('appointments')
    .select('*, pets(name), clinics(name)')
    .in('pet_id', (
      await supabase
        .from('pets')
        .select('id')
        .in('client_id', clientIds)
    ).data?.map((p) => p.id) ?? [])
    .order('scheduled_at', { ascending: true })

  return data ?? []
}

export async function createAppointmentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal')

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.clinic_id) redirect('/portal')

  await supabase.from('appointments').insert({
    pet_id: formData.get('pet_id') as string,
    clinic_id: profile.clinic_id,
    scheduled_at: formData.get('scheduled_at') as string,
    type: formData.get('type') as string,
    notes: (formData.get('notes') as string) || null,
  })

  redirect('/portal/dashboard')
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/profiles.ts src/services/clinics.ts src/services/appointments.ts
git commit -m "feat: add services for profiles, clinics, and appointments"
```

---

### Task 5: Pagina inicial - Landing page com dois botoes

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Atualizar pagina inicial**

```tsx
// src/app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">VetClinic</h1>
          <p className="mt-2 text-gray-500">Sistema de gestao veterinaria</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
          >
            Sou dono de clinica
          </Link>
          <Link
            href="/portal"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium text-lg"
          >
            Sou tutor
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with clinic owner and client buttons"
```

---

### Task 6: Login do dono - Adaptar /login com onboarding

**Files:**
- Modify: `src/app/login/page.tsx`
- Create: `src/app/onboarding/clinic/page.tsx`

- [ ] **Step 1: Atualizar /login para redirecionar ao onboarding**

Manter o login existente, mas apos signUp redirecionar para `/onboarding/clinic` em vez de `/dashboard`. Apos signIn, checar se tem perfil completo — se nao, redirecionar para onboarding.

```tsx
// src/app/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/onboarding/clinic')
      router.refresh()
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Checar se tem perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        router.push('/onboarding/clinic')
      } else if (profile.role === 'client') {
        router.push('/portal/dashboard')
      } else if (!profile.onboarding_complete) {
        router.push('/onboarding/clinic')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Criar conta' : 'Entrar'} — Clinica
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Ja tem conta? Entrar' : 'Nao tem conta? Cadastrar'}
        </button>
        <div className="mt-4 text-center">
          <Link href="/portal" className="text-sm text-gray-500 hover:underline">
            Sou tutor →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar pagina de onboarding da clinica**

```tsx
// src/app/onboarding/clinic/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClinicOwnerProfile } from '@/services/profiles'
import { PhoneInput } from '@/components/phone-input'

export default function ClinicOnboardingPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createClinicOwnerProfile(formData)
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar clinica')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-2">Dados da clinica</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Preencha as informacoes da sua clinica veterinaria
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da clinica
            </label>
            <input
              id="clinic_name"
              name="clinic_name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <PhoneInput name="clinic_phone" label="Telefone" />
          <div>
            <label htmlFor="clinic_address" className="block text-sm font-medium text-gray-700 mb-1">
              Endereco
            </label>
            <input
              id="clinic_address"
              name="clinic_address"
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rua, numero, bairro, cidade"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx src/app/onboarding/clinic/page.tsx
git commit -m "feat: update clinic login flow with onboarding redirect"
```

---

### Task 7: Portal do tutor - /portal login e onboarding

**Files:**
- Create: `src/app/portal/page.tsx`
- Create: `src/app/onboarding/client/page.tsx`

- [ ] **Step 1: Criar pagina de login do tutor**

```tsx
// src/app/portal/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      // Validar codigo de convite antes de criar conta
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .single()

      if (!clinic) {
        setError('Codigo de convite invalido')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Salvar invite_code no localStorage para usar no onboarding
      localStorage.setItem('vetclinic_invite_code', inviteCode.toUpperCase().trim())
      router.push('/onboarding/client')
      router.refresh()
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Checar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        router.push('/onboarding/client')
      } else if (profile.role === 'clinic_owner') {
        router.push('/dashboard')
      } else if (!profile.onboarding_complete) {
        router.push('/onboarding/client')
      } else {
        router.push('/portal/dashboard')
      }
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Criar conta' : 'Entrar'} — Tutor
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codigo de convite
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                placeholder="Ex: ABC12345"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">Peca o codigo para a sua clinica</p>
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Ja tem conta? Entrar' : 'Nao tem conta? Cadastrar'}
        </button>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:underline">
            ← Sou dono de clinica
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar pagina de onboarding do tutor**

```tsx
// src/app/onboarding/client/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClientProfile } from '@/services/profiles'
import { PhoneInput } from '@/components/phone-input'
import { CpfInput } from '@/components/cpf-input'

export default function ClientOnboardingPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const router = useRouter()

  useEffect(() => {
    const code = localStorage.getItem('vetclinic_invite_code')
    if (code) setInviteCode(code)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('invite_code', inviteCode || formData.get('invite_code') as string)
      await createClientProfile(formData)
      localStorage.removeItem('vetclinic_invite_code')
      router.push('/portal/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar perfil')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-2">Seus dados</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Preencha suas informacoes para continuar
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <PhoneInput name="phone" label="Telefone" required />
          <CpfInput name="cpf" label="CPF" required />
          {!inviteCode && (
            <div>
              <label htmlFor="invite_code" className="block text-sm font-medium text-gray-700 mb-1">
                Codigo de convite
              </label>
              <input
                id="invite_code"
                name="invite_code"
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/page.tsx src/app/onboarding/client/page.tsx
git commit -m "feat: add portal login and client onboarding pages"
```

---

### Task 8: Dashboard do tutor - Portal dashboard

**Files:**
- Create: `src/components/portal-sidebar.tsx`
- Create: `src/app/portal/dashboard/layout.tsx`
- Create: `src/app/portal/dashboard/page.tsx`
- Create: `src/app/portal/dashboard/appointments/new/page.tsx`

- [ ] **Step 1: Criar sidebar do tutor**

```tsx
// src/components/portal-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/portal/dashboard', label: 'Meus Pets' },
  { href: '/portal/dashboard/appointments/new', label: 'Agendar' },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/portal')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r min-h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-6">VetClinic</h2>
      <p className="text-xs text-gray-400 mb-4">Portal do Tutor</p>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-md text-sm ${
              pathname === link.href
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto text-sm text-gray-500 hover:text-gray-700"
      >
        Sair
      </button>
    </aside>
  )
}
```

- [ ] **Step 2: Criar layout do portal dashboard**

```tsx
// src/app/portal/dashboard/layout.tsx
import { PortalSidebar } from '@/components/portal-sidebar'

export default function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PortalSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Criar pagina principal do portal**

```tsx
// src/app/portal/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar perfil do tutor
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  // Buscar clients vinculados ao perfil
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  const clientIds = clients?.map((c) => c.id) ?? []

  // Buscar pets
  const { data: pets } = clientIds.length
    ? await supabase
        .from('pets')
        .select('*, vaccines(id, name, next_due_date)')
        .in('client_id', clientIds)
    : { data: [] }

  // Buscar agendamentos
  const { data: appointments } = clientIds.length
    ? await supabase
        .from('appointments')
        .select('*, pets(name)')
        .in('pet_id', pets?.map((p) => p.id) ?? [])
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_at', { ascending: true })
        .limit(5)
    : { data: [] }

  return (
    <div>
      <Header title={`Ola, ${profile.name}`} />

      {/* Proximos agendamentos */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Proximos agendamentos</h2>
        {appointments && appointments.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {appointments.map((a: any) => (
              <div key={a.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{a.type === 'vaccine' ? 'Vacina' : 'Consulta'}</p>
                  <p className="text-sm text-gray-500">{a.pets?.name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum agendamento" />
        )}
      </div>

      {/* Meus pets */}
      <h2 className="font-semibold mb-3">Meus pets</h2>
      {pets && pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet: any) => (
            <div key={pet.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="font-medium">{pet.name}</p>
              <p className="text-sm text-gray-500">{pet.species} {pet.breed ? `- ${pet.breed}` : ''}</p>
              {pet.vaccines?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">Vacinas:</p>
                  {pet.vaccines.map((v: any) => (
                    <p key={v.id} className="text-sm">
                      {v.name}
                      {v.next_due_date && (
                        <span className="text-gray-400 ml-1">
                          (prox: {v.next_due_date})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhum pet cadastrado" />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Criar pagina de agendamento**

```tsx
// src/app/portal/dashboard/appointments/new/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { createAppointmentAction } from '@/services/appointments'

export default async function NewAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  const clientIds = clients?.map((c) => c.id) ?? []

  const { data: pets } = clientIds.length
    ? await supabase.from('pets').select('id, name').in('client_id', clientIds)
    : { data: [] }

  return (
    <div>
      <Header title="Agendar" />
      <div className="max-w-md">
        <form action={createAppointmentAction} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-1">
              Pet
            </label>
            <select
              id="pet_id"
              name="pet_id"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              {pets?.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="consultation">Consulta</option>
              <option value="vaccine">Vacina</option>
            </select>
          </div>
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
              Data e hora
            </label>
            <input
              id="scheduled_at"
              name="scheduled_at"
              type="datetime-local"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observacoes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Agendar
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/portal-sidebar.tsx src/app/portal/dashboard/
git commit -m "feat: add portal dashboard with pets view and appointment scheduling"
```

---

### Task 9: Card de codigo de convite no dashboard do dono

**Files:**
- Create: `src/components/invite-code-card.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Criar componente InviteCodeCard**

```tsx
// src/components/invite-code-card.tsx
'use client'

import { useState } from 'react'

export function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <p className="text-sm text-gray-500 mb-1">Codigo de convite</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-mono font-bold tracking-wider">{code}</span>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Compartilhe com seus clientes para que se cadastrem</p>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar card ao dashboard**

No arquivo `src/app/dashboard/page.tsx`, importar `InviteCodeCard` e `getClinic`, buscar a clinica, e adicionar o card no grid de cards.

```tsx
// Adicionar imports
import { InviteCodeCard } from '@/components/invite-code-card'
import { getClinic } from '@/services/clinics'

// Dentro da funcao, buscar clinica
const clinic = await getClinic()

// Adicionar no grid (como terceiro card)
{clinic && <InviteCodeCard code={clinic.invite_code} />}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/invite-code-card.tsx src/app/dashboard/page.tsx
git commit -m "feat: add invite code card to clinic dashboard"
```

---

### Task 10: Middleware - role checking e redirect inteligente

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Atualizar middleware com checagem de role e onboarding**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rotas protegidas sem usuario -> redirect para login
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return redirect(request, '/login')
    }
    if (pathname.startsWith('/portal/dashboard')) {
      return redirect(request, '/portal')
    }
    return supabaseResponse
  }

  // Usuario logado -> buscar perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  // Sem perfil -> permitir acesso ao onboarding
  if (!profile) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (pathname === '/login') return supabaseResponse
    if (pathname === '/portal') return supabaseResponse
    return redirect(request, '/login')
  }

  // Onboarding incompleto -> forcar onboarding
  if (!profile.onboarding_complete) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (profile.role === 'clinic_owner') return redirect(request, '/onboarding/clinic')
    return redirect(request, '/onboarding/client')
  }

  // Login inteligente: redirecionar por role
  if (profile.role === 'client') {
    if (pathname === '/login' || pathname === '/portal') return redirect(request, '/portal/dashboard')
    if (pathname.startsWith('/dashboard')) return redirect(request, '/portal/dashboard')
  }

  if (profile.role === 'clinic_owner') {
    if (pathname === '/login' || pathname === '/portal') return redirect(request, '/dashboard')
    if (pathname.startsWith('/portal/dashboard')) return redirect(request, '/dashboard')
  }

  return supabaseResponse
}

function redirect(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login', '/onboarding/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: update middleware with role-based routing and smart redirects"
```

---

### Task 11: Atualizar schema.sql completo

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Adicionar novas tabelas ao schema.sql**

Append the new table definitions from the migration file to `supabase/schema.sql` so the full schema is documented in one place.

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "docs: update schema.sql with complete multi-role schema"
```
