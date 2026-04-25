import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!profile) return NextResponse.json({ pets: [] })

  const clients = await prisma.client.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  })

  const clientIds = clients.map((c) => c.id)

  if (!clientIds.length) return NextResponse.json({ pets: [] })

  const pets = await prisma.pet.findMany({
    where: { clientId: { in: clientIds } },
    select: { id: true, name: true, species: true },
  })

  return NextResponse.json({ pets })
}
