'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createMedicalRecordAction(formData: FormData) {
  const petId = formData.get('pet_id') as string
  const weightRaw = formData.get('weight_kg') as string

  await prisma.medicalRecord.create({
    data: {
      petId,
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as string,
      diagnosis: (formData.get('diagnosis') as string) || null,
      treatment: (formData.get('treatment') as string) || null,
      notes: (formData.get('notes') as string) || null,
      weightKg: weightRaw ? parseFloat(weightRaw) : null,
      vetName: (formData.get('vet_name') as string) || null,
    },
  })

  redirect(`/dashboard/pets/${petId}`)
}
