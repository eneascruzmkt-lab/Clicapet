'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getClients() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*, pets(*)')
    .eq('id', id)
    .single()
  return data
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('clients').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
  })

  redirect('/dashboard/clients')
}
