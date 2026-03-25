import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/resend'

// Usa service role para o cron — bypassa RLS
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function processPendingReminders() {
  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(
      `
      id,
      vaccine_id,
      vaccines (
        name,
        next_due_date,
        pets (
          name,
          clients (
            name,
            email
          )
        )
      )
    `
    )
    .eq('status', 'pending')
    .lte('send_at', today)

  if (error || !reminders) {
    console.error('Erro ao buscar lembretes:', error)
    return { sent: 0, errors: 0 }
  }

  let sent = 0
  let errors = 0

  for (const reminder of reminders) {
    const vaccine = (reminder as any).vaccines
    const pet = vaccine?.pets
    const client = pet?.clients

    if (!client?.email) {
      errors++
      continue
    }

    try {
      await getResend().emails.send({
        from: 'VetClinic <onboarding@resend.dev>',
        to: client.email,
        subject: `Lembrete de vacina: ${vaccine.name} para ${pet.name}`,
        html: `
          <h2>Olá, ${client.name}!</h2>
          <p>Este é um lembrete de que a vacina <strong>${vaccine.name}</strong> do(a) <strong>${pet.name}</strong> está prevista para <strong>${vaccine.next_due_date}</strong>.</p>
          <p>Entre em contato com a clínica para agendar a aplicação.</p>
        `,
      })

      await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .eq('id', reminder.id)

      sent++
    } catch (err) {
      console.error(`Falha ao enviar lembrete ${reminder.id}:`, err)
      errors++
    }
  }

  return { sent, errors }
}
