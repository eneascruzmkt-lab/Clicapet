'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createMedicalRecordAction(formData: FormData) {
  const petId = formData.get('pet_id') as string
  const weightRaw = formData.get('weight_kg') as string

  const supabase = await createClient()

  const { error } = await supabase.from('medical_records').insert({
    pet_id: petId,
    date: formData.get('date') as string,
    type: formData.get('type') as string,
    diagnosis: (formData.get('diagnosis') as string) || null,
    treatment: (formData.get('treatment') as string) || null,
    notes: (formData.get('notes') as string) || null,
    weight_kg: weightRaw ? parseFloat(weightRaw) : null,
    vet_name: (formData.get('vet_name') as string) || null,
  })

  if (error) throw new Error('Falha ao registrar prontuario')

  redirect(`/dashboard/pets/${petId}`)
}
