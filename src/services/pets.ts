'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getPet(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pets')
    .select('*, clients(name, id), vaccines(*, reminders(*)), medical_records(*)')
    .eq('id', id)
    .single()
  return data
}

export async function createPetAction(formData: FormData) {
  const clientId = formData.get('client_id') as string

  const supabase = await createClient()
  const { error } = await supabase.from('pets').insert({
    client_id: clientId,
    name: formData.get('name') as string,
    species: formData.get('species') as string,
    breed: (formData.get('breed') as string) || null,
  })

  if (error) throw new Error('Falha ao cadastrar pet')

  redirect(`/dashboard/clients/${clientId}`)
}
