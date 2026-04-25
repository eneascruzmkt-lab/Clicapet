'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export async function updatePortalProfile(formData: FormData) {
  const session = await requireAuth()
  const { userId, profileId } = getSessionData(session)

  if (!userId) redirect('/portal')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { userId },
      data: { name, phone },
    })

    if (profileId) {
      await tx.client.updateMany({
        where: { profileId },
        data: { name, phone },
      })
    }
  })

  redirect('/portal/dashboard/perfil')
}
