'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

async function getClinicId(): Promise<string | null> {
  const session = await requireAuth()
  const { clinicId } = getSessionData(session)
  return clinicId
}

export async function getTransactions() {
  const clinicId = await getClinicId()
  if (!clinicId) return []

  const data = await prisma.transaction.findMany({
    where: { clinicId },
    include: { client: true },
    take: 50,
    orderBy: { date: 'desc' },
  })

  return data
}

export async function getMonthlyStats() {
  const clinicId = await getClinicId()
  if (!clinicId) return { revenue: 0, expenses: 0, byMethod: {} }

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const items = await prisma.transaction.findMany({
    where: {
      clinicId,
      date: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    select: {
      amount: true,
      type: true,
      paymentMethod: true,
    },
  })

  let revenue = 0
  let expenses = 0
  const byMethod: Record<string, number> = {}

  for (const t of items) {
    const amt = Number(t.amount)
    if (t.type === 'revenue') {
      revenue += amt
      const method = t.paymentMethod || 'pending'
      byMethod[method] = (byMethod[method] || 0) + amt
    } else {
      expenses += amt
    }
  }

  return { revenue: Math.round(revenue * 100) / 100, expenses: Math.round(expenses * 100) / 100, byMethod }
}

export async function createTransactionAction(formData: FormData) {
  const clinicId = await getClinicId()
  if (!clinicId) throw new Error('Clinica nao encontrada')

  await prisma.transaction.create({
    data: {
      clinicId,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as string,
      paymentMethod: (formData.get('payment_method') as string) || null,
      date: new Date(formData.get('date') as string),
      clientId: (formData.get('client_id') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })

  redirect('/dashboard/financeiro')
}
