'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClinic() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('clinics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}
