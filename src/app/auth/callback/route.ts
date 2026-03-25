import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateInviteCode } from '@/lib/utils/invite-code'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const user = session.user
  const meta = user.user_metadata

  // Checar se ja tem perfil (evita duplicacao)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (existingProfile) {
    if (existingProfile.role === 'client') {
      return NextResponse.redirect(`${origin}/portal/dashboard`)
    }
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Criar perfil baseado nos dados do signup
  if (meta?.role === 'clinic_owner') {
    // Criar clinica
    const { data: clinic } = await supabase
      .from('clinics')
      .insert({
        user_id: user.id,
        name: meta.clinic_name,
        phone: meta.clinic_phone || null,
        address: meta.clinic_address || null,
        invite_code: generateInviteCode(),
      })
      .select()
      .single()

    if (clinic) {
      await supabase.from('profiles').insert({
        user_id: user.id,
        role: 'clinic_owner',
        name: meta.clinic_name,
        phone: meta.clinic_phone || null,
        clinic_id: clinic.id,
        onboarding_complete: true,
      })
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  if (meta?.role === 'client') {
    // Buscar clinica pelo invite code
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, user_id')
      .eq('invite_code', meta.invite_code)
      .single()

    if (clinic) {
      const { data: profile } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          role: 'client',
          name: meta.name,
          phone: meta.phone || null,
          cpf: meta.cpf || null,
          clinic_id: clinic.id,
          onboarding_complete: true,
        })
        .select()
        .single()

      if (profile) {
        await supabase.from('clients').insert({
          user_id: clinic.user_id,
          profile_id: profile.id,
          name: meta.name,
          phone: meta.phone || null,
          email: user.email,
        })
      }
    }

    return NextResponse.redirect(`${origin}/portal/dashboard`)
  }

  // Sem role definido — redirecionar para login
  return NextResponse.redirect(`${origin}/login`)
}
