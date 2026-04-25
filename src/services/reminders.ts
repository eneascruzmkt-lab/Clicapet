import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'

export async function processPendingReminders() {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const reminders = await prisma.reminder.findMany({
    where: {
      status: 'pending',
      sendAt: { lte: today },
    },
    include: {
      vaccine: {
        include: {
          pet: {
            include: {
              client: true,
            },
          },
        },
      },
    },
  })

  let sent = 0
  let errors = 0

  for (const reminder of reminders) {
    const vaccine = reminder.vaccine
    const pet = vaccine?.pet
    const client = pet?.client

    if (!client?.email) {
      errors++
      continue
    }

    try {
      await getResend().emails.send({
        from: 'Clicapet <onboarding@resend.dev>',
        to: client.email,
        subject: `Lembrete de vacina: ${vaccine.name} para ${pet.name}`,
        html: `
          <h2>Ola, ${client.name}!</h2>
          <p>Este e um lembrete de que a vacina <strong>${vaccine.name}</strong> do(a) <strong>${pet.name}</strong> esta prevista para <strong>${vaccine.nextDueDate ? new Date(vaccine.nextDueDate).toLocaleDateString('pt-BR') : 'em breve'}</strong>.</p>
          <p>Entre em contato com a clinica para agendar a aplicacao.</p>
        `,
      })

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'sent' },
      })

      sent++
    } catch (err) {
      console.error(`Falha ao enviar lembrete ${reminder.id}:`, err)
      errors++
    }
  }

  return { sent, errors }
}
