export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

export function buildVaccineReminderMessage(clientName: string, petName: string, vaccineName: string, dueDate: string): string {
  return `Ola ${clientName}! Lembramos que a vacina *${vaccineName}* do(a) *${petName}* esta prevista para *${dueDate}*. Entre em contato para agendar!`
}

export function buildAppointmentReminderMessage(clientName: string, petName: string, date: string, type: string): string {
  const typeLabel = type === 'vaccine' ? 'vacinacao' : 'consulta'
  return `Ola ${clientName}! Lembramos da ${typeLabel} do(a) *${petName}* agendada para *${date}*. Ate la!`
}
