'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { auth } from '@/lib/auth'

export async function getProfile() {
  const session = await auth()
  if (!session?.user) return null

  const { userId } = getSessionData(session)

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { clinic: true },
  })

  return profile
}

export async function createClinicOwnerProfile(formData: FormData) {
  const session = await requireAuth()
  const { userId } = getSessionData(session)

  const { generateInviteCode } = await import('@/lib/utils/invite-code')

  const clinicName = formData.get('clinic_name') as string
  const clinicPhone = (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || null
  const clinicAddress = (formData.get('clinic_address') as string) || null

  await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        userId,
        name: clinicName,
        phone: clinicPhone,
        address: clinicAddress,
        inviteCode: generateInviteCode(),
      },
    })

    await tx.profile.create({
      data: {
        userId,
        role: 'clinic_owner',
        name: clinicName,
        phone: clinicPhone,
        clinicId: clinic.id,
        onboardingComplete: true,
      },
    })
  })
}

export async function createClientProfile(formData: FormData) {
  const session = await requireAuth()
  const { userId } = getSessionData(session)

  const inviteCode = formData.get('invite_code') as string

  const clinic = await prisma.clinic.findUnique({
    where: { inviteCode: inviteCode.toUpperCase().trim() },
    select: { id: true, userId: true },
  })

  if (!clinic) throw new Error('Codigo de convite invalido')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null
  const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '') || null

  // Get user email for the client record
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.create({
      data: {
        userId,
        role: 'client',
        name,
        phone,
        cpf,
        clinicId: clinic.id,
        onboardingComplete: true,
      },
    })

    await tx.client.create({
      data: {
        userId: clinic.userId,
        profileId: profile.id,
        name,
        phone,
        email: user?.email ?? null,
        clinicId: clinic.id,
      },
    })
  })
}
