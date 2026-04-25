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

  const services = await prisma.groomingService.findMany({
    where: { clinicId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, price, duration } = body

  if (!name?.trim() || price == null) {
    return NextResponse.json({ error: 'Nome e preco obrigatorios' }, { status: 400 })
  }

  const service = await prisma.groomingService.create({
    data: {
      clinicId,
      name: name.trim(),
      price: parseFloat(price),
      duration: parseInt(duration) || 30,
    },
  })

  return NextResponse.json(service)
}

export async function DELETE(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  await prisma.groomingService.deleteMany({
    where: { id, clinicId },
  })

  return NextResponse.json({ ok: true })
}
