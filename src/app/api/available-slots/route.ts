import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.clinic_id) return NextResponse.json({ slots: [], appointments: [] })

  // Buscar horarios configurados da clinica
  const { data: slots } = await supabase
    .from('available_slots')
    .select('*')
    .eq('clinic_id', profile.clinic_id)
    .eq('active', true)
    .order('day_of_week')
    .order('start_time')

  // Buscar agendamentos existentes para os proximos 30 dias (para marcar como ocupados)
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .eq('clinic_id', profile.clinic_id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', in30Days.toISOString())

  return NextResponse.json({
    slots: slots ?? [],
    appointments: (appointments ?? []).map((a) => a.scheduled_at),
  })
}
