import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const body = await request.json()

  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 400 })

  const { data, error } = await supabase.from('prescriptions').insert({
    pet_id: body.pet_id,
    clinic_id: clinic.id,
    medication: body.medication,
    dosage: body.dosage,
    frequency: body.frequency,
    duration: body.duration || null,
    instructions: body.instructions || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ prescription: data })
}
