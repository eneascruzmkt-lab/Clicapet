import { NextResponse } from 'next/server'
import { processPendingReminders } from '@/services/reminders'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const result = await processPendingReminders()
  return NextResponse.json(result)
}
