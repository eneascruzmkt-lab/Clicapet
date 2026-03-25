'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createVaccineAction(formData: FormData) {
  const petId = formData.get('pet_id') as string
  const nextDueDate = formData.get('next_due_date') as string

  const supabase = await createClient()

  const { data: vaccine, error } = await supabase
    .from('vaccines')
    .insert({
      pet_id: petId,
      name: formData.get('name') as string,
      applied_at: formData.get('applied_at') as string,
      next_due_date: nextDueDate || null,
    })
    .select()
    .single()

  if (error || !vaccine) {
    redirect(`/dashboard/pets/${petId}`)
  }

  // Cria lembrete automaticamente se tem próxima dose
  if (nextDueDate) {
    await supabase.from('reminders').insert({
      vaccine_id: vaccine.id,
      send_at: nextDueDate,
      status: 'pending',
    })
  }

  redirect(`/dashboard/pets/${petId}`)
}
