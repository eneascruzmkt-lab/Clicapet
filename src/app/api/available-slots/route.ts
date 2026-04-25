import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

async function getClinicIdFromOwner() {
  const session = await auth()
  if (!session?.user) return null
  const { userId } = getSessionData(session)
  const clinic = await prisma.clinic.findFirst({ where: { userId } })
  return clinic?.id ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const userId = session.user.id

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { clinicId: true },
  })

  if (!profile?.clinicId) return NextResponse.json({ slots: [], appointments: [] })

  // Buscar horarios configurados da clinica
  const slots = await prisma.availableSlot.findMany({
    where: {
      clinicId: profile.clinicId,
      active: true,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  // Buscar agendamentos existentes para os proximos 30 dias (para marcar como ocupados)
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: profile.clinicId,
      status: { in: ['pending', 'confirmed'] },
      scheduledAt: {
        gte: now,
        lte: in30Days,
      },
    },
    select: { scheduledAt: true },
  })

  return NextResponse.json({
    slots,
    appointments: appointments.map((a) => a.scheduledAt.toISOString()),
  })
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicIdFromOwner()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { dayOfWeek, startTime, endTime, slotDuration } = body

  const slot = await prisma.availableSlot.create({
    data: {
      clinicId,
      dayOfWeek: dayOfWeek ?? 1,
      startTime: startTime ?? '08:00',
      endTime: endTime ?? '18:00',
      slotDuration: slotDuration ?? 30,
    },
  })

  return NextResponse.json(slot)
}

export async function PATCH(req: NextRequest) {
  const clinicId = await getClinicIdFromOwner()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, active } = body

  await prisma.availableSlot.updateMany({
    where: { id, clinicId },
    data: { active },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const clinicId = await getClinicIdFromOwner()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  await prisma.availableSlot.deleteMany({
    where: { id, clinicId },
  })

  return NextResponse.json({ ok: true })
}
