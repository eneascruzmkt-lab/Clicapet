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

export async function createPetAsTutor(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nao autenticado')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Perfil nao encontrado: ' + (profileError?.message ?? 'null'))

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  if (clientError || !client) throw new Error('Cliente nao encontrado: ' + (clientError?.message ?? 'null'))

  const { data: pet, error } = await supabase.from('pets').insert({
    client_id: client.id,
    name: formData.get('name') as string,
    species: formData.get('species') as string,
    breed: (formData.get('breed') as string) || null,
  }).select().single()

  if (error || !pet) throw new Error('Falha ao cadastrar pet: ' + (error?.message ?? 'sem dados retornados'))

  redirect('/portal/dashboard')
}
