'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export async function createAppointmentAction(formData: FormData) {
  const session = await requireAuth()
  const { clinicId } = getSessionData(session)

  if (!clinicId) redirect('/portal')

  await prisma.appointment.create({
    data: {
      petId: formData.get('pet_id') as string,
      clinicId,
      scheduledAt: new Date(formData.get('scheduled_at') as string),
      type: formData.get('type') as string,
      notes: (formData.get('notes') as string) || null,
    },
  })

  redirect('/portal/dashboard')
}
