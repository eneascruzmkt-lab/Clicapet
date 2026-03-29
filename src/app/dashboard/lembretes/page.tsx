export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { createClient } from '@/lib/supabase/server'
import { buildVaccineReminderMessage, buildAppointmentReminderMessage } from '@/lib/whatsapp'
import { getClinic } from '@/services/clinics'

export default async function LembretesPage() {
  const supabase = await createClient()
  const clinic = await getClinic()

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  // Vacinas com proxima dose nos proximos 7 dias
  const { data: vaccineReminders } = await supabase
    .from('vaccines')
    .select('id, name, next_due_date, pets(name, clients(name, phone))')
    .not('next_due_date', 'is', null)
    .gte('next_due_date', today)
    .lte('next_due_date', weekFromNow)
    .order('next_due_date')

  // Consultas nos proximos 7 dias
  let appointmentReminders: any[] = []
  if (clinic) {
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, type, pets(name, clients(name, phone))')
      .eq('clinic_id', clinic.id)
      .eq('status', 'pending')
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${weekFromNow}T23:59:59`)
      .order('scheduled_at')

    appointmentReminders = data ?? []
  }

  const hasVaccines = vaccineReminders && vaccineReminders.length > 0
  const hasAppointments = appointmentReminders.length > 0

  return (
    <div>
      <Header title="Lembretes" />

      <h2 className="text-lg font-semibold mb-4">Vacinas nos proximos 7 dias</h2>
      {!hasVaccines ? (
        <EmptyState message="Nenhuma vacina pendente esta semana." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y mb-8">
          {vaccineReminders.map((v: any) => {
            const client = v.pets?.clients
            const message = buildVaccineReminderMessage(
              client?.name || 'Cliente',
              v.pets?.name || 'Pet',
              v.name,
              v.next_due_date
            )
            return (
              <div key={v.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{v.name} — {v.pets?.name}</p>
                  <p className="text-sm text-gray-500">
                    Tutor: {client?.name || '—'} | Vence: {v.next_due_date}
                  </p>
                </div>
                <WhatsAppButton phone={client?.phone || ''} message={message} />
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Consultas nos proximos 7 dias</h2>
      {!hasAppointments ? (
        <EmptyState message="Nenhuma consulta agendada esta semana." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {appointmentReminders.map((a: any) => {
            const client = a.pets?.clients
            const dateStr = new Date(a.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            const message = buildAppointmentReminderMessage(
              client?.name || 'Cliente',
              a.pets?.name || 'Pet',
              dateStr,
              a.type
            )
            return (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {a.type === 'vaccine' ? 'Vacinacao' : 'Consulta'} — {a.pets?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tutor: {client?.name || '—'} | {dateStr}
                  </p>
                </div>
                <WhatsAppButton phone={client?.phone || ''} message={message} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
