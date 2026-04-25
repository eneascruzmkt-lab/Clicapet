export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { prisma } from '@/lib/prisma'
import { buildVaccineReminderMessage, buildAppointmentReminderMessage } from '@/lib/whatsapp'
import { getClinic } from '@/services/clinics'

export default async function LembretesPage() {
  const clinic = await getClinic()

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  // Vacinas com proxima dose nos proximos 7 dias
  const vaccineReminders = await prisma.vaccine.findMany({
    where: {
      nextDueDate: {
        not: null,
        gte: new Date(`${today}T00:00:00`),
        lte: new Date(`${weekFromNow}T23:59:59`),
      },
    },
    include: {
      pet: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { nextDueDate: 'asc' },
  })

  // Consultas nos proximos 7 dias
  let appointmentReminders: any[] = []
  if (clinic) {
    appointmentReminders = await prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        status: 'pending',
        scheduledAt: {
          gte: new Date(`${today}T00:00:00`),
          lte: new Date(`${weekFromNow}T23:59:59`),
        },
      },
      include: {
        pet: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })
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
            const client = v.pet?.client
            const nextDueDateStr = v.nextDueDate ? new Date(v.nextDueDate).toISOString().split('T')[0] : ''
            const message = buildVaccineReminderMessage(
              client?.name || 'Cliente',
              v.pet?.name || 'Pet',
              v.name,
              nextDueDateStr
            )
            return (
              <div key={v.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{v.name} - {v.pet?.name}</p>
                  <p className="text-sm text-gray-500">
                    Tutor: {client?.name || '-'} | Vence: {nextDueDateStr}
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
            const client = a.pet?.client
            const dateStr = new Date(a.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            const message = buildAppointmentReminderMessage(
              client?.name || 'Cliente',
              a.pet?.name || 'Pet',
              dateStr,
              a.type
            )
            return (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {a.type === 'vaccine' ? 'Vacinacao' : 'Consulta'} - {a.pet?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tutor: {client?.name || '-'} | {dateStr}
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
