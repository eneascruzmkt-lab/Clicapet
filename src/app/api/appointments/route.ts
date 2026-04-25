import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await request.json()
  const { petId, scheduledAt, type, notes } = body

  if (!petId || !scheduledAt || !type) {
    return NextResponse.json({ error: 'Campos obrigatorios: petId, scheduledAt, type' }, { status: 400 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { clinicId: true },
  })

  if (!profile?.clinicId) {
    return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 400 })
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        petId,
        clinicId: profile.clinicId,
        scheduledAt: new Date(scheduledAt),
        type,
        notes: notes || null,
      },
    })

    return NextResponse.json({ appointment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { id, status } = await request.json()

  if (!['cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  try {
    await prisma.appointment.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
