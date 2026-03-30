import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const body = await request.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, phone, clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 400 })

  // Se o perfil nao tem clinic_id, tentar recuperar do user_metadata
  let clinicId = profile.clinic_id
  if (!clinicId) {
    const inviteCode = user.user_metadata?.invite_code
    if (inviteCode) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .single()

      if (clinic) {
        clinicId = clinic.id
        // Atualizar o perfil com o clinic_id
        await supabase
          .from('profiles')
          .update({ clinic_id: clinic.id, onboarding_complete: true })
          .eq('id', profile.id)
      }
    }
  }

  if (!clinicId) return NextResponse.json({ error: 'Nao foi possivel encontrar sua clinica. Entre em contato com o veterinario.' }, { status: 400 })

  // Buscar client vinculado ao perfil
  let { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  // Se nao existe, criar o registro de client
  if (!client) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('user_id')
      .eq('id', clinicId)
      .single()

    if (clinic) {
      const { data: newClient, error: clientError } = await supabase.from('clients').insert({
        user_id: clinic.user_id,
        profile_id: profile.id,
        name: profile.name,
        phone: profile.phone,
        email: user.email,
      }).select().single()

      if (clientError) return NextResponse.json({ error: 'Erro ao criar registro: ' + clientError.message }, { status: 400 })
      client = newClient
    }
  }

  if (!client) return NextResponse.json({ error: 'Falha ao vincular perfil' }, { status: 400 })

  const { data: pet, error } = await supabase.from('pets').insert({
    client_id: client.id,
    name: body.name,
    species: body.species,
    breed: body.breed || null,
    birth_date: body.birth_date || null,
    sex: body.sex || null,
    color: body.color || null,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Falha ao cadastrar pet: ' + error.message }, { status: 400 })

  return NextResponse.json({ pet })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const body = await request.json()
  const { id, name, species, breed } = body

  if (!id) return NextResponse.json({ error: 'ID do pet obrigatorio' }, { status: 400 })

  const update: Record<string, any> = {}
  if (name) update.name = name
  if (species) update.species = species
  if (breed !== undefined) update.breed = breed || null
  if (body.birth_date !== undefined) update.birth_date = body.birth_date || null
  if (body.sex !== undefined) update.sex = body.sex || null
  if (body.color !== undefined) update.color = body.color || null

  const { error } = await supabase
    .from('pets')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao atualizar: ' + error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { id } = await request.json()

  if (!id) return NextResponse.json({ error: 'ID do pet obrigatorio' }, { status: 400 })

  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao excluir: ' + error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
