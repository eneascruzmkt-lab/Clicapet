# ClicaPet - Reescrita: Supabase para Railway

**Data:** 2026-04-25
**Status:** Aprovado

## Objetivo

Remover toda dependência do Supabase e migrar o backend do ClicaPet para rodar 100% no Railway, usando PostgreSQL, Prisma, NextAuth.js e Cloudinary.

## Arquitetura

```
Usuário → Next.js (Railway) → PostgreSQL (Railway)
                ↓
          NextAuth.js (login/sessão)
          Prisma (queries no banco)
          Cloudinary (fotos de pets)
          Resend (emails)
```

## Mapa de substituições

| Antes (Supabase)           | Depois                                      |
|----------------------------|---------------------------------------------|
| Supabase Auth              | NextAuth.js (credenciais com email/senha)   |
| Supabase Client/Server     | Prisma ORM                                  |
| Supabase Storage           | Cloudinary                                  |
| Supabase RLS               | Middleware + checagem no código              |
| Supabase service role key  | Prisma direto (sem chave especial)           |

## O que NÃO muda

- Todo o frontend (páginas, componentes, visual)
- Resend (emails de lembretes)
- Estrutura de rotas do Next.js
- Cron de lembretes (só troca Supabase client por Prisma)

## Modelo do Banco de Dados

Todas as tabelas do Supabase viram models no Prisma. Estrutura hierárquica:

```
users (NextAuth gerencia)
  └── profiles (role: clinic_owner ou client)
        ├── clinics (se for dono de clínica)
        │     ├── staff (funcionários)
        │     ├── available_slots (horários)
        │     ├── grooming_services (serviços de banho/tosa)
        ���     └── transactions (financeiro)
        │
        └── clients (tutores vinculados à clínica)
              └── pets
                    ├─��� vaccines → reminders
                    ├── medical_records
                    ├── prescriptions
                    ├── exam_files
                    ├── weight_records
                    └── appointments
                          └── grooming_appointments
```

### Mudanças em relação ao Supabase

- `auth.users` do Supabase vira tabela `users` gerenciada pelo NextAuth
- Senhas guardadas com bcrypt (NextAuth faz isso)
- `clinic_id` e `profile_id` continuam como chaves estrangeiras
- Código de convite da clínica continua funcionando igual
- `photo_url` do pet passa a ser URL do Cloudinary

## Autenticação (NextAuth.js)

### Cadastro de clínica (dono)

1. Usuário preenche email + senha + dados da clínica
2. API cria o `user` com senha (bcrypt) via Prisma
3. Cria o `profile` com role `clinic_owner`
4. Cria a `clinic` com código de convite gerado automaticamente
5. Envia código de verificação de 6 dígitos por email (Resend)
6. Usuário digita o código na tela de verificação
7. `email_verified = true`, login automático, redireciona para o painel

### Cadastro de tutor (cliente)

1. Tutor acessa com código de convite da clínica
2. Preenche email + senha + nome + telefone
3. API cria o `user`, o `profile` com role `client`, e o `client` vinculado à clínica
4. Envia código de verificação de 6 dígitos por email
5. Usuário digita o código, `email_verified = true`
6. Login automático, redireciona para o portal do tutor

### Login

1. Usuário digita email + senha
2. NextAuth valida a senha (bcrypt)
3. Verifica se `email_verified = true` (bloqueia se não)
4. Cria sessão com cookie seguro (httpOnly)
5. Middleware redireciona conforme o role:
   - `clinic_owner` → `/dashboard`
   - `client` → `/portal`

### Verificação de email

- Código de 6 dígitos gerado aleatoriamente
- Salvo na tabela `verification_codes` com: `email`, `code`, `expires_at`
- Validade de 10 minutos
- Opção de "Reenviar código" se expirar

### Proteção de rotas (middleware)

- Rotas `/dashboard/*` → só `clinic_owner`
- Rotas `/portal/*` → só `client`
- Rotas `/api/*` → verifica sessão antes de processar
- Sem sessão → redireciona para `/login`

### Permissões (substituindo RLS)

- Cada rota de API e server action verifica a sessão do NextAuth
- Checa o role do usuário (clinic_owner ou client)
- Filtra os dados pelo `clinic_id` ou `profile_id` do usuário logado

## Upload de Fotos (Cloudinary)

### Fluxo

1. Usuário clica em "Adicionar foto" no perfil do pet
2. Seleciona a imagem
3. Imagem enviada para o Cloudinary via API
4. Cloudinary retorna URL pública
5. URL salva no campo `photo_url` da tabela `pets`

### Configuração necessária

- Conta gratuita no Cloudinary (25GB grátis)
- Variáveis de ambiente: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Variáveis de Ambiente (Railway)

```
DATABASE_URL=postgresql://...          # PostgreSQL do Railway
NEXTAUTH_SECRET=...                    # Chave secreta do NextAuth
NEXTAUTH_URL=https://clicapet.up.railway.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
CRON_SECRET=...
```

## Escalabilidade

O modelo é multi-tenant (várias clínicas no mesmo sistema). Cada clínica isolada pelo `clinic_id`.

| Escala          | Ação necessária                                  |
|-----------------|--------------------------------------------------|
| 10-50 clínicas  | Nenhuma. PostgreSQL no Railway aguenta            |
| 50-200 clínicas | Aumentar plano do Railway (mais RAM/CPU)          |
| 200+ clínicas   | Adicionar cache (Redis) e otimizar queries        |
| 1000+ clínicas  | Separar banco por região ou migrar para AWS/GCP   |

## Dependências do projeto (novas)

- `prisma` + `@prisma/client` - ORM para PostgreSQL
- `next-auth` - Autenticação
- `bcrypt` - Hash de senhas
- `cloudinary` - Upload de imagens

## Dependências removidas

- `@supabase/ssr`
- `@supabase/supabase-js`
