'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export async function getClients() {
  const session = await requireAuth()
  const { clinicId } = getSessionData(session)

  if (!clinicId) return []

  const clients = await prisma.client.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
  })

  return clients
}

export async function getClient(id: string) {
  const session = await requireAuth()
  const { clinicId } = getSessionData(session)

  const client = await prisma.client.findFirst({
    where: { id, clinicId: clinicId ?? undefined },
    include: { pets: true },
  })

  return client
}

export async function createClientAction(formData: FormData) {
  const session = await requireAuth()
  const { userId, clinicId } = getSessionData(session)

  if (!clinicId) throw new Error('Clinica nao encontrada')

  await prisma.client.create({
    data: {
      userId,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      clinicId,
    },
  })

  redirect('/dashboard/clients')
}
