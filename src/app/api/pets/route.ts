import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const userId = session.user.id

  const body = await request.json()

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, name: true, phone: true, clinicId: true },
  })

  if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 400 })

  // Se o perfil nao tem clinicId, tentar recuperar do user metadata (invite code)
  let clinicId = profile.clinicId
  if (!clinicId) {
    // Sem clinic vinculada
    return NextResponse.json({ error: 'Nao foi possivel encontrar sua clinica. Entre em contato com o veterinario.' }, { status: 400 })
  }

  // Buscar client vinculado ao perfil
  let client = await prisma.client.findFirst({
    where: { profileId: profile.id },
    select: { id: true },
  })

  // Se nao existe, criar o registro de client
  if (!client) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { userId: true },
    })

    if (clinic) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      client = await prisma.client.create({
        data: {
          userId: clinic.userId,
          profileId: profile.id,
          name: profile.name || '',
          phone: profile.phone,
          email: user?.email,
          clinicId,
        },
        select: { id: true },
      })
    }
  }

  if (!client) return NextResponse.json({ error: 'Falha ao vincular perfil' }, { status: 400 })

  try {
    const pet = await prisma.pet.create({
      data: {
        clientId: client.id,
        name: body.name,
        species: body.species,
        breed: body.breed || null,
        birthDate: body.birth_date ? new Date(body.birth_date) : null,
        sex: body.sex || null,
        color: body.color || null,
      },
    })

    return NextResponse.json({ pet })
  } catch (error: any) {
    return NextResponse.json({ error: 'Falha ao cadastrar pet: ' + error.message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, name, species, breed } = body

  if (!id) return NextResponse.json({ error: 'ID do pet obrigatorio' }, { status: 400 })

  const update: Record<string, any> = {}
  if (name) update.name = name
  if (species) update.species = species
  if (breed !== undefined) update.breed = breed || null
  if (body.birth_date !== undefined) update.birthDate = body.birth_date ? new Date(body.birth_date) : null
  if (body.sex !== undefined) update.sex = body.sex || null
  if (body.color !== undefined) update.color = body.color || null

  try {
    await prisma.pet.update({
      where: { id },
      data: update,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao atualizar: ' + error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { id } = await request.json()

  if (!id) return NextResponse.json({ error: 'ID do pet obrigatorio' }, { status: 400 })

  try {
    await prisma.pet.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir: ' + error.message }, { status: 400 })
  }
}
