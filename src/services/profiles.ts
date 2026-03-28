'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*, clinics(*)')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function createClinicOwnerProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { generateInviteCode } = await import('@/lib/utils/invite-code')

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({
      user_id: user.id,
      name: formData.get('clinic_name') as string,
      phone: (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || null,
      address: (formData.get('clinic_address') as string) || null,
      invite_code: generateInviteCode(),
    })
    .select()
    .single()

  if (clinicError || !clinic) throw new Error('Failed to create clinic')

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      role: 'clinic_owner',
      name: formData.get('clinic_name') as string,
      phone: (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || null,
      clinic_id: clinic.id,
      onboarding_complete: true,
    })

  if (profileError) throw new Error('Failed to create profile')
}

export async function createClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inviteCode = formData.get('invite_code') as string

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, user_id')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (!clinic) throw new Error('Codigo de convite invalido')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      role: 'client',
      name,
      phone,
      cpf: (formData.get('cpf') as string)?.replace(/\D/g, '') || null,
      clinic_id: clinic.id,
      onboarding_complete: true,
    })
    .select()
    .single()

  if (profileError || !profile) throw new Error('Failed to create profile')

  const { error: clientError } = await supabase.from('clients').insert({
    user_id: clinic.user_id,
    profile_id: profile.id,
    name,
    phone,
    email: user.email,
  })

  if (clientError) throw new Error('Failed to create client record')
}
