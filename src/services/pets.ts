'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export async function getPet(id: string) {
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, id: true } },
      vaccines: { include: { reminders: true } },
      medicalRecords: true,
    },
  })
  return pet
}

export async function createPetAction(formData: FormData) {
  const clientId = formData.get('client_id') as string

  await prisma.pet.create({
    data: {
      clientId,
      name: formData.get('name') as string,
      species: formData.get('species') as string,
      breed: (formData.get('breed') as string) || null,
    },
  })

  redirect(`/dashboard/clients/${clientId}`)
}

export async function createPetAsTutor(formData: FormData) {
  const session = await requireAuth()
  const { userId } = getSessionData(session)

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!profile) throw new Error('Perfil nao encontrado')

  const client = await prisma.client.findFirst({
    where: { profileId: profile.id },
    select: { id: true },
  })

  if (!client) throw new Error('Cliente nao encontrado')

  await prisma.pet.create({
    data: {
      clientId: client.id,
      name: formData.get('name') as string,
      species: formData.get('species') as string,
      breed: (formData.get('breed') as string) || null,
    },
  })

  redirect('/portal/dashboard')
}
