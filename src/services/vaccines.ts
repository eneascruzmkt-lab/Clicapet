'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createVaccineAction(formData: FormData) {
  const petId = formData.get('pet_id') as string
  const nextDueDate = formData.get('next_due_date') as string

  if (nextDueDate) {
    await prisma.$transaction(async (tx) => {
      const vaccine = await tx.vaccine.create({
        data: {
          petId,
          name: formData.get('name') as string,
          appliedAt: new Date(formData.get('applied_at') as string),
          nextDueDate: new Date(nextDueDate),
        },
      })

      await tx.reminder.create({
        data: {
          vaccineId: vaccine.id,
          sendAt: new Date(nextDueDate),
          status: 'pending',
        },
      })
    })
  } else {
    await prisma.vaccine.create({
      data: {
        petId,
        name: formData.get('name') as string,
        appliedAt: new Date(formData.get('applied_at') as string),
        nextDueDate: null,
      },
    })
  }

  redirect(`/dashboard/pets/${petId}`)
}
