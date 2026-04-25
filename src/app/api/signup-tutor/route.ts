import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const userId = session.user.id as string

  const body = await request.json()
  const { name, phone, cpf, invite_code } = body

  // Verificar se ja tem perfil
  const existingProfile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, clinicId: true },
  })

  if (existingProfile?.clinicId) {
    return NextResponse.json({ ok: true, message: 'Perfil ja existe' })
  }

  // Buscar clinica pelo invite code
  const clinic = await prisma.clinic.findUnique({
    where: { inviteCode: invite_code.toUpperCase().trim() },
    select: { id: true, userId: true },
  })

  if (!clinic) return NextResponse.json({ error: 'Codigo de convite invalido' }, { status: 400 })

  const userEmail = session.user.email

  if (existingProfile) {
    // Perfil existe mas sem clinicId - atualizar
    await prisma.profile.update({
      where: { id: existingProfile.id },
      data: {
        clinicId: clinic.id,
        onboardingComplete: true,
        name,
        phone,
        cpf: cpf || null,
      },
    })

    // Criar client record
    await prisma.client.create({
      data: {
        userId: clinic.userId,
        profileId: existingProfile.id,
        name,
        phone: phone || null,
        email: userEmail,
        clinicId: clinic.id,
      },
    })

    return NextResponse.json({ ok: true })
  }

  // Criar perfil do zero
  try {
    const profile = await prisma.profile.create({
      data: {
        userId,
        role: 'client',
        name,
        phone: phone || null,
        cpf: cpf || null,
        clinicId: clinic.id,
        onboardingComplete: true,
      },
    })

    // Criar client record
    await prisma.client.create({
      data: {
        userId: clinic.userId,
        profileId: profile.id,
        name,
        phone: phone || null,
        email: userEmail,
        clinicId: clinic.id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao criar perfil: ' + error.message }, { status: 400 })
  }
}
