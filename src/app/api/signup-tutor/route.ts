import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const body = await request.json()
  const { name, phone, cpf, invite_code } = body

  // Verificar se ja tem perfil
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, clinic_id')
    .eq('user_id', user.id)
    .single()

  if (existingProfile?.clinic_id) {
    return NextResponse.json({ ok: true, message: 'Perfil ja existe' })
  }

  // Buscar clinica pelo invite code
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, user_id')
    .eq('invite_code', invite_code.toUpperCase().trim())
    .single()

  if (!clinic) return NextResponse.json({ error: 'Codigo de convite invalido' }, { status: 400 })

  if (existingProfile) {
    // Perfil existe mas sem clinic_id — atualizar
    await supabase
      .from('profiles')
      .update({ clinic_id: clinic.id, onboarding_complete: true, name, phone, cpf: cpf || null })
      .eq('id', existingProfile.id)

    // Criar client record
    await supabase.from('clients').insert({
      user_id: clinic.user_id,
      profile_id: existingProfile.id,
      name,
      phone: phone || null,
      email: user.email,
    })

    return NextResponse.json({ ok: true })
  }

  // Criar perfil do zero
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      role: 'client',
      name,
      phone: phone || null,
      cpf: cpf || null,
      clinic_id: clinic.id,
      onboarding_complete: true,
    })
    .select()
    .single()

  if (profileError) return NextResponse.json({ error: 'Erro ao criar perfil: ' + profileError.message }, { status: 400 })

  // Criar client record
  const { error: clientError } = await supabase.from('clients').insert({
    user_id: clinic.user_id,
    profile_id: profile.id,
    name,
    phone: phone || null,
    email: user.email,
  })

  if (clientError) return NextResponse.json({ error: 'Erro ao criar cliente: ' + clientError.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
