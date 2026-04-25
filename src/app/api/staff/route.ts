import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

async function getClinicId() {
  const session = await auth()
  if (!session?.user) return null
  const { userId } = getSessionData(session)
  const clinic = await prisma.clinic.findFirst({ where: { userId } })
  return clinic?.id ?? null
}

export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const staff = await prisma.staff.findMany({
    where: { clinicId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(staff)
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, role, phone, email } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 })

  const member = await prisma.staff.create({
    data: {
      clinicId,
      name: name.trim(),
      role: role || 'vet',
      phone: phone?.trim() || null,
      email: email?.trim() || null,
    },
  })

  return NextResponse.json(member)
}

export async function PATCH(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, active } = body

  const member = await prisma.staff.updateMany({
    where: { id, clinicId },
    data: { active },
  })

  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  await prisma.staff.deleteMany({
    where: { id, clinicId },
  })

  return NextResponse.json({ ok: true })
}
