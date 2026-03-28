'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createAppointmentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal')

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.clinic_id) redirect('/portal')

  const { error } = await supabase.from('appointments').insert({
    pet_id: formData.get('pet_id') as string,
    clinic_id: profile.clinic_id,
    scheduled_at: formData.get('scheduled_at') as string,
    type: formData.get('type') as string,
    notes: (formData.get('notes') as string) || null,
  })

  if (error) throw new Error('Falha ao agendar consulta')

  redirect('/portal/dashboard')
}
