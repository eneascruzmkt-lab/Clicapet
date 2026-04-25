import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'

function getLastSixMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { userId } = getSessionData(session)
  const clinic = await prisma.clinic.findFirst({ where: { userId } })
  if (!clinic) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 404 })

  const months = getLastSixMonths()
  const startDate = new Date(`${months[0]}-01T00:00:00`)

  // Appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: clinic.id,
      scheduledAt: { gte: startDate },
    },
    select: { scheduledAt: true, type: true },
  })

  const byMonth: Record<string, number> = {}
  const byType: Record<string, number> = {}
  months.forEach((m) => (byMonth[m] = 0))

  appointments.forEach((a) => {
    const ym = a.scheduledAt.toISOString().slice(0, 7)
    if (byMonth[ym] !== undefined) byMonth[ym]++
    const t = a.type || 'consultation'
    byType[t] = (byType[t] || 0) + 1
  })

  // Pets count
  const totalPets = await prisma.pet.count({
    where: { client: { clinicId: clinic.id } },
  })

  // Clients count
  const totalClients = await prisma.client.count({
    where: { clinicId: clinic.id },
  })

  // Transactions by month (revenue)
  const transactions = await prisma.transaction.findMany({
    where: {
      clinicId: clinic.id,
      type: 'revenue',
      date: { gte: startDate },
    },
    select: { date: true, amount: true },
  })

  const revByMonth: Record<string, number> = {}
  months.forEach((m) => (revByMonth[m] = 0))

  transactions.forEach((t) => {
    const ym = t.date.toISOString().slice(0, 7)
    if (revByMonth[ym] !== undefined) revByMonth[ym] += parseFloat(t.amount.toString()) || 0
  })

  return NextResponse.json({
    appointmentsByMonth: months.map((m) => ({ month: m, count: byMonth[m] })),
    appointmentsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    totalPets,
    totalClients,
    revenueByMonth: months.map((m) => ({ month: m, total: revByMonth[m] })),
  })
}
