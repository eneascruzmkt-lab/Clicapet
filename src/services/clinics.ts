'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getSessionData } from '@/lib/auth-utils'

export async function getClinic() {
  const session = await auth()
  if (!session?.user) return null

  const { userId } = getSessionData(session)

  const clinic = await prisma.clinic.findFirst({
    where: { userId },
  })

  return clinic
}
