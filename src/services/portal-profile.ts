'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePortalProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null

  const { error } = await supabase
    .from('profiles')
    .update({ name, phone })
    .eq('user_id', user.id)

  if (error) throw new Error('Falha ao atualizar perfil')

  // Also update the client record
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profile) {
    await supabase
      .from('clients')
      .update({ name, phone })
      .eq('profile_id', profile.id)
  }

  redirect('/portal/dashboard/perfil')
}
