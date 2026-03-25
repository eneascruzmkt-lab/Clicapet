# Multi-Role Signup & Portal - Design Spec

## Resumo

Separar o sistema em dois fluxos distintos: **dono de clinica** e **tutor (cliente)**. Cada um com login, cadastro e dashboard proprios.

## Estrutura de Rotas

| Rota | Quem | O que faz |
|---|---|---|
| `/login` | Dono da clinica | Login/cadastro |
| `/onboarding/clinic` | Dono da clinica | Preenche dados da clinica |
| `/dashboard/*` | Dono da clinica | Painel completo |
| `/portal` | Tutor | Login/cadastro com codigo de convite |
| `/onboarding/client` | Tutor | Preenche dados pessoais (nome, telefone, CPF) |
| `/portal/dashboard/*` | Tutor | Painel do tutor (ver pets, vacinas, agendar) |

## Schema do Banco

### Nova tabela: `clinics`
- `id` UUID PK
- `user_id` UUID FK auth.users NOT NULL
- `name` TEXT NOT NULL
- `phone` TEXT
- `address` TEXT
- `invite_code` TEXT UNIQUE NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT now()

### Nova tabela: `profiles`
- `id` UUID PK
- `user_id` UUID FK auth.users UNIQUE NOT NULL
- `role` TEXT CHECK ('clinic_owner' | 'client') NOT NULL
- `name` TEXT NOT NULL
- `phone` TEXT
- `cpf` TEXT (nullable, so tutor)
- `clinic_id` UUID FK clinics (nullable, preenchido para tutores)
- `onboarding_complete` BOOLEAN DEFAULT false
- `created_at` TIMESTAMPTZ DEFAULT now()

### Nova tabela: `appointments`
- `id` UUID PK
- `pet_id` UUID FK pets NOT NULL
- `clinic_id` UUID FK clinics NOT NULL
- `scheduled_at` TIMESTAMPTZ NOT NULL
- `type` TEXT CHECK ('vaccine' | 'consultation') NOT NULL
- `notes` TEXT
- `status` TEXT CHECK ('pending' | 'confirmed' | 'done' | 'cancelled') DEFAULT 'pending'
- `created_at` TIMESTAMPTZ DEFAULT now()

### Alteracao: `clients`
- Adicionar `profile_id` UUID FK profiles (nullable) - vincula tutor ao registro de cliente

## Fluxos

### Cadastro Dono
1. `/login` → email+senha → signUp
2. Redirect → `/onboarding/clinic`
3. Preenche: nome clinica, telefone, endereco
4. Cria `profiles` (role: clinic_owner, onboarding_complete: true)
5. Cria `clinics` (invite_code gerado)
6. Redirect → `/dashboard`

### Cadastro Tutor
1. `/portal` → email+senha+codigo convite → signUp
2. Redirect → `/onboarding/client`
3. Preenche: nome, telefone, CPF
4. Valida codigo convite → encontra clinica
5. Cria `profiles` (role: client, clinic_id, onboarding_complete: true)
6. Cria `clients` vinculado a clinica
7. Redirect → `/portal/dashboard`

### Middleware
- `/dashboard/*` → requer login + role clinic_owner + onboarding completo
- `/portal/dashboard/*` → requer login + role client + onboarding completo
- Sem onboarding → redirect para onboarding
- Login inteligente: tutor em `/login` → redirect `/portal/dashboard` e vice-versa

## Melhorias
1. Card de codigo convite no dashboard do dono (com botao copiar)
2. Login inteligente (redirect por role)
3. Validacao de CPF (formato + digitos verificadores)
4. Mascara de telefone (99) 99999-9999
