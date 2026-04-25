import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { clinicId: true },
  })

  if (!profile?.clinicId) return NextResponse.json({ phone: null, name: null })

  const clinic = await prisma.clinic.findUnique({
    where: { id: profile.clinicId },
    select: { phone: true, name: true },
  })

  return NextResponse.json({ phone: clinic?.phone ?? null, name: clinic?.name ?? '' })
}
