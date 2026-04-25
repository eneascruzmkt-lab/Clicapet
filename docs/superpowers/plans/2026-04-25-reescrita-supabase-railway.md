# Reescrita ClicaPet: Supabase para Railway - Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover toda dependência do Supabase e migrar para PostgreSQL (Railway) + Prisma + NextAuth.js + Cloudinary.

**Architecture:** Next.js 16 com Prisma ORM conectando ao PostgreSQL no Railway. NextAuth.js para autenticação com credentials provider (email/senha + bcrypt). Cloudinary para upload de fotos de pets. Resend mantido para emails.

**Tech Stack:** Next.js 16, TypeScript, Prisma, NextAuth.js v5, bcrypt, Cloudinary, Resend, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-04-25-reescrita-supabase-para-railway-design.md`

---

## File Structure

### Files to CREATE

```
prisma/schema.prisma                          — Prisma schema with all models
src/lib/prisma.ts                             — Prisma client singleton
src/lib/auth.ts                               — NextAuth.js configuration
src/lib/auth-utils.ts                         — Auth helper functions (getSession, requireAuth, requireRole)
src/lib/cloudinary.ts                         — Cloudinary client config
src/app/api/auth/[...nextauth]/route.ts       — NextAuth API route handler
src/app/api/auth/signup/route.ts              — Signup API (clinic owner)
src/app/api/auth/verify-email/route.ts        — Email verification (6-digit code)
src/app/api/auth/resend-code/route.ts         — Resend verification code
src/app/verify-email/page.tsx                 — Verification code input page
```

### Files to MODIFY (rewrite internals, keep exports/interfaces)

```
src/middleware.ts                              — Replace Supabase session with NextAuth
src/services/profiles.ts                      — Replace Supabase queries with Prisma
src/services/clinics.ts                       — Replace Supabase queries with Prisma
src/services/clients.ts                       — Replace Supabase queries with Prisma
src/services/pets.ts                          — Replace Supabase queries with Prisma
src/services/appointments.ts                  — Replace Supabase queries with Prisma
src/services/vaccines.ts                      — Replace Supabase queries with Prisma
src/services/medical-records.ts               — Replace Supabase queries with Prisma
src/services/transactions.ts                  — Replace Supabase queries with Prisma
src/services/reminders.ts                     — Replace Supabase queries with Prisma
src/services/portal-profile.ts                — Replace Supabase queries with Prisma
src/app/api/pets/route.ts                     — Replace Supabase with Prisma + NextAuth
src/app/api/appointments/route.ts             — Replace Supabase with Prisma + NextAuth
src/app/api/available-slots/route.ts          — Replace Supabase with Prisma + NextAuth
src/app/api/prescriptions/route.ts            — Replace Supabase with Prisma + NextAuth
src/app/api/signup-tutor/route.ts             — Replace Supabase with Prisma + NextAuth
src/app/api/upload-pet-photo/route.ts         — Replace Supabase Storage with Cloudinary
src/app/api/cron/reminders/route.ts           — Replace Supabase service role with Prisma
src/app/login/page.tsx                        — Replace Supabase Auth with NextAuth signIn
src/app/portal/page.tsx                       — Replace Supabase Auth with NextAuth signIn
src/app/portal/dashboard/page.tsx             — Replace Supabase queries with Prisma
src/app/portal/dashboard/pets/new/page.tsx    — Update upload to Cloudinary
src/app/dashboard/page.tsx                    — Replace Supabase queries with Prisma
src/app/dashboard/calendario/page.tsx         — Replace Supabase queries with Prisma
src/app/dashboard/clients/page.tsx            — Uses service layer (minimal changes)
src/app/dashboard/clients/[id]/page.tsx       — Uses service layer (minimal changes)
src/app/dashboard/pets/[id]/page.tsx          — Uses service layer (minimal changes)
src/app/dashboard/financeiro/page.tsx         — Uses service layer (minimal changes)
src/app/onboarding/clinic/page.tsx            — Replace service calls
src/app/onboarding/client/page.tsx            — Replace service calls
package.json                                  — Add/remove dependencies
```

### Files to DELETE

```
src/lib/supabase/client.ts                    — Supabase browser client
src/lib/supabase/server.ts                    — Supabase server client
src/app/auth/callback/route.ts                — Supabase OAuth callback (replaced by NextAuth)
```

---

## Task 1: Instalar dependências e limpar Supabase

**Files:**
- Modify: `package.json`
- Delete: `src/lib/supabase/client.ts`
- Delete: `src/lib/supabase/server.ts`

- [ ] **Step 1: Instalar novas dependências**

```bash
cd C:/Users/Theuszin/Downloads/ClicaPet
npm install prisma @prisma/client next-auth@beta bcryptjs cloudinary
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Remover dependências do Supabase**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 3: Deletar arquivos do Supabase client**

```bash
rm src/lib/supabase/client.ts
rm src/lib/supabase/server.ts
rmdir src/lib/supabase
```

- [ ] **Step 4: Deletar callback do Supabase**

```bash
rm src/app/auth/callback/route.ts
rmdir src/app/auth/callback
rmdir src/app/auth
```

- [ ] **Step 5: Inicializar Prisma**

```bash
npx prisma init
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase dependencies, add Prisma + NextAuth + Cloudinary"
```

---

## Task 2: Criar schema Prisma com todos os models

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Escrever o schema completo**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  password       String
  emailVerified  Boolean   @default(false)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  profile        Profile?
  verificationCodes VerificationCode[]

  @@map("users")
}

model VerificationCode {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [email], references: [email], onDelete: Cascade)

  @@map("verification_codes")
}

model Profile {
  id                 String   @id @default(cuid())
  userId             String   @unique @map("user_id")
  role               String   // 'clinic_owner' | 'client'
  name               String?
  phone              String?
  cpf                String?
  clinicId           String?  @map("clinic_id")
  onboardingComplete Boolean  @default(false) @map("onboarding_complete")
  createdAt          DateTime @default(now()) @map("created_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  clinic  Clinic?  @relation("ProfileClinic", fields: [clinicId], references: [id])
  clients Client[] @relation("ProfileClients")

  @@map("profiles")
}

model Clinic {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  name       String
  phone      String?
  address    String?
  inviteCode String   @unique @map("invite_code")
  createdAt  DateTime @default(now()) @map("created_at")

  profiles              Profile[]              @relation("ProfileClinic")
  appointments          Appointment[]
  transactions          Transaction[]
  availableSlots        AvailableSlot[]
  staff                 Staff[]
  groomingServices      GroomingService[]
  groomingAppointments  GroomingAppointment[]

  @@map("clinics")
}

model Client {
  id        String   @id @default(cuid())
  userId    String?  @map("user_id")
  profileId String?  @map("profile_id")
  name      String
  phone     String?
  email     String?
  clinicId  String   @map("clinic_id")
  createdAt DateTime @default(now()) @map("created_at")

  profile      Profile?      @relation("ProfileClients", fields: [profileId], references: [id])
  pets         Pet[]
  transactions Transaction[]

  @@map("clients")
}

model Pet {
  id        String   @id @default(cuid())
  clientId  String   @map("client_id")
  name      String
  species   String?
  breed     String?
  birthDate DateTime? @map("birth_date") @db.Date
  sex       String?   // 'M' | 'F'
  color     String?
  photoUrl  String?  @map("photo_url")
  createdAt DateTime @default(now()) @map("created_at")

  client         Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  vaccines       Vaccine[]
  medicalRecords MedicalRecord[]
  prescriptions  Prescription[]
  examFiles      ExamFile[]
  weightRecords  WeightRecord[]
  appointments   Appointment[]
  transactions   Transaction[]

  @@map("pets")
}

model Vaccine {
  id          String    @id @default(cuid())
  petId       String    @map("pet_id")
  name        String
  appliedAt   DateTime? @map("applied_at") @db.Date
  nextDueDate DateTime? @map("next_due_date") @db.Date
  createdAt   DateTime  @default(now()) @map("created_at")

  pet       Pet        @relation(fields: [petId], references: [id], onDelete: Cascade)
  reminders Reminder[]

  @@map("vaccines")
}

model Reminder {
  id        String   @id @default(cuid())
  vaccineId String   @map("vaccine_id")
  sendAt    DateTime @map("send_at") @db.Date
  status    String   @default("pending") // 'pending' | 'sent'
  createdAt DateTime @default(now()) @map("created_at")

  vaccine Vaccine @relation(fields: [vaccineId], references: [id], onDelete: Cascade)

  @@map("reminders")
}

model Appointment {
  id          String   @id @default(cuid())
  petId       String   @map("pet_id")
  clinicId    String   @map("clinic_id")
  scheduledAt DateTime @map("scheduled_at")
  type        String   // 'vaccine' | 'consultation'
  notes       String?
  status      String   @default("pending") // 'pending' | 'confirmed' | 'done' | 'cancelled'
  createdAt   DateTime @default(now()) @map("created_at")

  pet          Pet           @relation(fields: [petId], references: [id], onDelete: Cascade)
  clinic       Clinic        @relation(fields: [clinicId], references: [id])
  transactions Transaction[]

  @@map("appointments")
}

model MedicalRecord {
  id        String   @id @default(cuid())
  petId     String   @map("pet_id")
  date      DateTime @db.Date
  type      String   // 'consultation' | 'surgery' | 'exam' | 'emergency'
  diagnosis String?
  treatment String?
  notes     String?
  weightKg  Decimal? @map("weight_kg")
  vetName   String?  @map("vet_name")
  createdAt DateTime @default(now()) @map("created_at")

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@map("medical_records")
}

model Transaction {
  id            String   @id @default(cuid())
  clinicId      String   @map("clinic_id")
  clientId      String?  @map("client_id")
  petId         String?  @map("pet_id")
  appointmentId String?  @map("appointment_id")
  description   String
  amount        Decimal
  type          String   // 'revenue' | 'expense'
  paymentMethod String?  @map("payment_method") // 'cash' | 'pix' | 'card' | 'pending'
  date          DateTime @db.Date
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")

  clinic      Clinic       @relation(fields: [clinicId], references: [id])
  client      Client?      @relation(fields: [clientId], references: [id])
  pet         Pet?         @relation(fields: [petId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])

  @@map("transactions")
}

model AvailableSlot {
  id           String   @id @default(cuid())
  clinicId     String   @map("clinic_id")
  dayOfWeek    Int      @map("day_of_week") // 0-6
  startTime    String   @map("start_time")
  endTime      String   @map("end_time")
  slotDuration Int      @map("slot_duration")
  active       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")

  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@map("available_slots")
}

model Prescription {
  id        String   @id @default(cuid())
  petId     String   @map("pet_id")
  clinicId  String   @map("clinic_id")
  content   String
  vetName   String?  @map("vet_name")
  createdAt DateTime @default(now()) @map("created_at")

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@map("prescriptions")
}

model ExamFile {
  id        String   @id @default(cuid())
  petId     String   @map("pet_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  createdAt DateTime @default(now()) @map("created_at")

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@map("exam_files")
}

model WeightRecord {
  id        String   @id @default(cuid())
  petId     String   @map("pet_id")
  weightKg  Decimal  @map("weight_kg")
  date      DateTime @db.Date
  createdAt DateTime @default(now()) @map("created_at")

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@map("weight_records")
}

model Staff {
  id        String   @id @default(cuid())
  clinicId  String   @map("clinic_id")
  name      String
  role      String   // 'vet' | 'assistant' | 'groomer' | 'receptionist'
  phone     String?
  email     String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")

  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@map("staff")
}

model GroomingService {
  id        String   @id @default(cuid())
  clinicId  String   @map("clinic_id")
  name      String
  price     Decimal
  duration  Int      // minutes
  createdAt DateTime @default(now()) @map("created_at")

  clinic               Clinic                @relation(fields: [clinicId], references: [id])
  groomingAppointments GroomingAppointment[]

  @@map("grooming_services")
}

model GroomingAppointment {
  id        String   @id @default(cuid())
  clinicId  String   @map("clinic_id")
  petId     String   @map("pet_id")
  serviceId String   @map("service_id")
  scheduledAt DateTime @map("scheduled_at")
  status    String   @default("pending")
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")

  clinic  Clinic          @relation(fields: [clinicId], references: [id])
  service GroomingService @relation(fields: [serviceId], references: [id])

  @@map("grooming_appointments")
}
```

- [ ] **Step 2: Verificar que o schema é válido**

```bash
npx prisma validate
```

Expected: "The schema is valid."

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add complete Prisma schema with all models"
```

---

## Task 3: Criar Prisma client singleton e helpers de auth

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-utils.ts`
- Create: `src/lib/cloudinary.ts`

- [ ] **Step 1: Criar Prisma client singleton**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Criar configuração NextAuth**

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { profile: true },
        })

        if (!user) return null
        if (!user.emailVerified) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          role: user.profile?.role ?? null,
          clinicId: user.profile?.clinicId ?? null,
          profileId: user.profile?.id ?? null,
          onboardingComplete: user.profile?.onboardingComplete ?? false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.clinicId = (user as any).clinicId
        token.profileId = (user as any).profileId
        token.onboardingComplete = (user as any).onboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      ;(session as any).role = token.role
      ;(session as any).clinicId = token.clinicId
      ;(session as any).profileId = token.profileId
      ;(session as any).onboardingComplete = token.onboardingComplete
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
```

- [ ] **Step 3: Criar helpers de auth**

```typescript
// src/lib/auth-utils.ts
import { auth } from './auth'
import { redirect } from 'next/navigation'

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

export async function requireRole(role: 'clinic_owner' | 'client') {
  const session = await requireAuth()
  if ((session as any).role !== role) redirect('/login')
  return session
}

export function getSessionData(session: any) {
  return {
    userId: session.user.id as string,
    role: session.role as string,
    clinicId: session.clinicId as string | null,
    profileId: session.profileId as string | null,
    onboardingComplete: session.onboardingComplete as boolean,
  }
}
```

- [ ] **Step 4: Criar config Cloudinary**

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prisma.ts src/lib/auth.ts src/lib/auth-utils.ts src/lib/cloudinary.ts
git commit -m "feat: add Prisma client, NextAuth config, auth helpers, Cloudinary config"
```

---

## Task 4: Criar rotas de autenticação (NextAuth + signup + verificação)

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/app/api/auth/verify-email/route.ts`
- Create: `src/app/api/auth/resend-code/route.ts`
- Create: `src/app/verify-email/page.tsx`

- [ ] **Step 1: Criar handler NextAuth**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 2: Criar rota de signup**

```typescript
// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, name } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    })

    await resend.emails.send({
      from: 'ClicaPet <noreply@clicapet.com>',
      to: email,
      subject: 'Código de verificação - ClicaPet',
      html: `<p>Seu código de verificação é: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`,
    })

    return NextResponse.json({ message: 'Código enviado para o email' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Criar rota de verificação de email**

```typescript
// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })

    // Clean up used codes
    await prisma.verificationCode.deleteMany({
      where: { email },
    })

    return NextResponse.json({ message: 'Email verificado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar email' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Criar rota de reenvio de código**

```typescript
// src/app/api/auth/resend-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email já verificado' }, { status: 400 })
    }

    // Delete old codes
    await prisma.verificationCode.deleteMany({ where: { email } })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    })

    await resend.emails.send({
      from: 'ClicaPet <noreply@clicapet.com>',
      to: email,
      subject: 'Novo código de verificação - ClicaPet',
      html: `<p>Seu novo código de verificação é: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`,
    })

    return NextResponse.json({ message: 'Novo código enviado' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao reenviar código' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Criar página de verificação de email**

Create `src/app/verify-email/page.tsx` with:
- Input para 6 dígitos
- Botão "Verificar"
- Link "Reenviar código"
- Chama `/api/auth/verify-email` com POST
- Após sucesso, redireciona para `/login` com mensagem de sucesso
- Recebe `email` via query param (ex: `/verify-email?email=user@email.com`)
- Segue o visual teal do projeto (bg-teal-600 buttons, rounded-xl inputs)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/ src/app/verify-email/
git commit -m "feat: add signup, email verification with 6-digit code, and NextAuth handler"
```

---

## Task 5: Reescrever middleware para NextAuth

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Reescrever middleware**

Replace entire contents of `src/middleware.ts` with NextAuth-based middleware:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const pathname = nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/login', '/portal', '/verify-email']
  const isPublic = publicRoutes.some(route => pathname === route)
  const isAuthApi = pathname.startsWith('/api/auth')
  const isCronApi = pathname.startsWith('/api/cron')

  if (isPublic || isAuthApi || isCronApi) return NextResponse.next()

  // No session → login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  const role = (session as any).role
  const onboardingComplete = (session as any).onboardingComplete

  // No profile yet → allow onboarding
  if (!role && pathname.startsWith('/onboarding')) return NextResponse.next()
  if (!role) return NextResponse.redirect(new URL('/onboarding/clinic', nextUrl))

  // Onboarding not complete
  if (!onboardingComplete) {
    if (pathname.startsWith('/onboarding')) return NextResponse.next()
    const onboardingPath = role === 'clinic_owner' ? '/onboarding/clinic' : '/onboarding/client'
    return NextResponse.redirect(new URL(onboardingPath, nextUrl))
  }

  // Role-based access
  if (pathname.startsWith('/dashboard') && role !== 'clinic_owner') {
    return NextResponse.redirect(new URL('/portal/dashboard', nextUrl))
  }
  if (pathname.startsWith('/portal/dashboard') && role !== 'client') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|api/auth).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: rewrite middleware to use NextAuth sessions"
```

---

## Task 6: Reescrever service layer (profiles, clinics, clients)

**Files:**
- Modify: `src/services/profiles.ts`
- Modify: `src/services/clinics.ts`
- Modify: `src/services/clients.ts`

- [ ] **Step 1: Reescrever profiles.ts**

Replace entire file with Prisma queries. Key functions:
- `getProfile()` — use `prisma.profile.findUnique({ where: { userId }, include: { clinic: true } })`
- `createClinicOwnerProfile(formData)` — create clinic + profile in a `prisma.$transaction`
- `createClientProfile(formData)` — find clinic by invite_code, create profile + client in transaction

All functions get userId from `requireAuth()` session instead of Supabase `getUser()`.

- [ ] **Step 2: Reescrever clinics.ts**

Replace entire file:
- `getClinic()` — `prisma.clinic.findFirst({ where: { userId } })`

- [ ] **Step 3: Reescrever clients.ts**

Replace entire file:
- `getClients()` — `prisma.client.findMany({ where: { clinicId }, orderBy: { createdAt: 'desc' } })`
- `getClient(id)` — `prisma.client.findUnique({ where: { id }, include: { pets: true } })`
- `createClientAction(formData)` — `prisma.client.create({ data: { ...fields, clinicId } })`

Get clinicId from session via `getSessionData()`.

- [ ] **Step 4: Commit**

```bash
git add src/services/profiles.ts src/services/clinics.ts src/services/clients.ts
git commit -m "feat: rewrite profiles, clinics, clients services to use Prisma"
```

---

## Task 7: Reescrever service layer (pets, vaccines, medical-records, appointments)

**Files:**
- Modify: `src/services/pets.ts`
- Modify: `src/services/vaccines.ts`
- Modify: `src/services/medical-records.ts`
- Modify: `src/services/appointments.ts`

- [ ] **Step 1: Reescrever pets.ts**

Key functions:
- `getPet(id)` — `prisma.pet.findUnique({ where: { id }, include: { client: true, vaccines: { include: { reminders: true } }, medicalRecords: true } })`
- `createPetAction(formData)` — `prisma.pet.create({ data: { ...fields, clientId } })`
- `createPetAsTutor(formData)` — find profile by userId, find client by profileId, create pet

- [ ] **Step 2: Reescrever vaccines.ts**

- `createVaccineAction(formData)` — create vaccine, if nextDueDate provided also create reminder in same transaction

- [ ] **Step 3: Reescrever medical-records.ts**

- `createMedicalRecordAction(formData)` — `prisma.medicalRecord.create({ data: { ...fields } })`

- [ ] **Step 4: Reescrever appointments.ts**

- `createAppointmentAction(formData)` — get clinicId from session profile, create appointment

- [ ] **Step 5: Commit**

```bash
git add src/services/pets.ts src/services/vaccines.ts src/services/medical-records.ts src/services/appointments.ts
git commit -m "feat: rewrite pets, vaccines, medical-records, appointments services to Prisma"
```

---

## Task 8: Reescrever service layer (transactions, reminders, portal-profile)

**Files:**
- Modify: `src/services/transactions.ts`
- Modify: `src/services/reminders.ts`
- Modify: `src/services/portal-profile.ts`

- [ ] **Step 1: Reescrever transactions.ts**

Key functions:
- `getClinicId()` — get from session
- `getTransactions()` — `prisma.transaction.findMany({ where: { clinicId }, include: { client: true }, take: 50, orderBy: { date: 'desc' } })`
- `getMonthlyStats()` — use Prisma groupBy or raw query for monthly aggregation
- `createTransactionAction(formData)` — `prisma.transaction.create()`

- [ ] **Step 2: Reescrever reminders.ts**

- `processPendingReminders()` — No longer needs service role key. Use Prisma directly:
  - Find reminders where `status = 'pending'` and `sendAt <= today`
  - Include vaccine → pet → client relationships
  - Send email via Resend
  - Update reminder status to 'sent'

- [ ] **Step 3: Reescrever portal-profile.ts**

- `updatePortalProfile(formData)` — update profile name/phone and linked client record via transaction

- [ ] **Step 4: Commit**

```bash
git add src/services/transactions.ts src/services/reminders.ts src/services/portal-profile.ts
git commit -m "feat: rewrite transactions, reminders, portal-profile services to Prisma"
```

---

## Task 9: Reescrever API routes

**Files:**
- Modify: `src/app/api/pets/route.ts`
- Modify: `src/app/api/appointments/route.ts`
- Modify: `src/app/api/available-slots/route.ts`
- Modify: `src/app/api/prescriptions/route.ts`
- Modify: `src/app/api/signup-tutor/route.ts`
- Modify: `src/app/api/upload-pet-photo/route.ts`
- Modify: `src/app/api/cron/reminders/route.ts`

- [ ] **Step 1: Reescrever pets route**

Replace Supabase client with Prisma + auth():
- POST: create pet (same logic, Prisma queries)
- PATCH: `prisma.pet.update()`
- DELETE: `prisma.pet.delete()`

- [ ] **Step 2: Reescrever appointments route**

- PATCH: `prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } })`

- [ ] **Step 3: Reescrever available-slots route**

- GET: get clinicId from session, query `prisma.availableSlot.findMany()` and `prisma.appointment.findMany()` for next 30 days

- [ ] **Step 4: Reescrever prescriptions route**

- POST: `prisma.prescription.create()`

- [ ] **Step 5: Reescrever signup-tutor route**

- POST: validate invite code via `prisma.clinic.findUnique({ where: { inviteCode } })`, create/update profile + client

- [ ] **Step 6: Reescrever upload-pet-photo route (Cloudinary)**

Replace Supabase Storage with Cloudinary:

```typescript
import { auth } from '@/lib/auth'
import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const petId = formData.get('petId') as string

  if (!file || !petId) {
    return NextResponse.json({ error: 'Arquivo e petId são obrigatórios' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'clicapet/pets', public_id: `${petId}-${Date.now()}` },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  await prisma.pet.update({
    where: { id: petId },
    data: { photoUrl: result.secure_url },
  })

  return NextResponse.json({ url: result.secure_url })
}
```

- [ ] **Step 7: Reescrever cron reminders route**

Replace Supabase createClient with direct service call (already uses Prisma after Task 8):
- Keep CRON_SECRET bearer token check
- Call `processPendingReminders()`

- [ ] **Step 8: Commit**

```bash
git add src/app/api/
git commit -m "feat: rewrite all API routes to Prisma + NextAuth + Cloudinary"
```

---

## Task 10: Reescrever páginas de login e portal

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/portal/page.tsx`
- Modify: `src/app/onboarding/clinic/page.tsx`
- Modify: `src/app/onboarding/client/page.tsx`

- [ ] **Step 1: Reescrever login page**

Replace Supabase auth calls:
- Signup: POST to `/api/auth/signup`, then redirect to `/verify-email?email=...`
- Login: use NextAuth `signIn('credentials', { email, password, redirect: false })`, handle errors
- Remove all `createClient()` from `@/lib/supabase/client`
- Keep the entire UI/JSX intact, only change the `handleSubmit` logic

- [ ] **Step 2: Reescrever portal login page**

Same pattern:
- Signup: validate invite code via fetch, then POST to `/api/auth/signup`, redirect to verify-email
- Login: use NextAuth `signIn('credentials', { ... })`
- Keep UI intact

- [ ] **Step 3: Reescrever onboarding clinic page**

- Replace `createClinicOwnerProfile` import to use new Prisma-based service
- No Supabase client usage needed

- [ ] **Step 4: Reescrever onboarding client page**

- Replace `createClientProfile` import to use new Prisma-based service

- [ ] **Step 5: Commit**

```bash
git add src/app/login/ src/app/portal/page.tsx src/app/onboarding/
git commit -m "feat: rewrite login, portal, and onboarding pages to use NextAuth"
```

---

## Task 11: Reescrever páginas do dashboard (clinic owner)

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/calendario/page.tsx`

- [ ] **Step 1: Reescrever dashboard page**

Replace inline Supabase queries with Prisma:
- Pet count: `prisma.pet.count({ where: { client: { clinicId } } })`
- Client count: `prisma.client.count({ where: { clinicId } })`
- Upcoming vaccines: `prisma.vaccine.findMany({ where: { pet: { client: { clinicId } }, nextDueDate: { not: null } }, include: { pet: { include: { client: true } } }, take: 5 })`
- Pending appointments: `prisma.appointment.findMany({ where: { clinicId, status: { in: ['pending', 'confirmed'] } }, include: { pet: { include: { client: true } } }, take: 5 })`

Get clinicId from session.

- [ ] **Step 2: Reescrever calendario page**

Replace Supabase queries with Prisma:
- Get clinic: from session clinicId
- Get appointments by date range: `prisma.appointment.findMany({ where: { clinicId, scheduledAt: { gte, lte } } })`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: rewrite dashboard and calendar pages to use Prisma"
```

---

## Task 12: Reescrever páginas do portal (tutor)

**Files:**
- Modify: `src/app/portal/dashboard/page.tsx`
- Modify: `src/app/portal/dashboard/pets/new/page.tsx`

- [ ] **Step 1: Reescrever portal dashboard page**

Replace Supabase queries with Prisma:
- Get profile: from session
- Get client: `prisma.client.findFirst({ where: { profileId } })`
- Get pets with vaccines: `prisma.pet.findMany({ where: { clientId }, include: { vaccines: true } })`
- Get appointments: `prisma.appointment.findMany({ where: { pet: { clientId } }, include: { pet: true, clinic: true } })`
- Get medical records: `prisma.medicalRecord.findMany({ where: { pet: { clientId } }, include: { pet: true } })`

- [ ] **Step 2: Reescrever portal new pet page**

- Update upload endpoint to use new Cloudinary-based `/api/upload-pet-photo`
- No other changes needed (already calls `/api/pets` POST)

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/
git commit -m "feat: rewrite portal pages to use Prisma"
```

---

## Task 13: Atualizar .env e configurações finais

**Files:**
- Modify: `.env.example`
- Create: `.env.local` (user must fill in)

- [ ] **Step 1: Atualizar .env.example**

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=your_cron_secret
```

- [ ] **Step 2: Gerar Prisma client e rodar migrations**

```bash
npx prisma generate
npx prisma db push
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Fix any TypeScript errors that appear.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: update env example for Railway + Prisma + NextAuth + Cloudinary"
```

---

## Task 14: Teste completo da aplicação

- [ ] **Step 1: Iniciar o servidor dev**

```bash
npm run dev
```

- [ ] **Step 2: Testar fluxo de cadastro de clínica**

1. Acessar `/login`
2. Criar conta como clinic_owner
3. Verificar se recebeu código de 6 dígitos
4. Digitar código em `/verify-email`
5. Login e verificar redirecionamento para onboarding
6. Completar onboarding e verificar painel

- [ ] **Step 3: Testar fluxo de tutor**

1. Copiar código de convite da clínica
2. Acessar `/portal`
3. Criar conta como tutor
4. Verificar email com código
5. Login e verificar portal

- [ ] **Step 4: Testar CRUD completo**

1. Criar cliente, pet, vacina, prontuário
2. Agendar consulta
3. Upload de foto do pet
4. Registrar transação financeira
5. Verificar calendário

- [ ] **Step 5: Fix any issues found**

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: complete migration from Supabase to Railway (Prisma + NextAuth + Cloudinary)"
```
