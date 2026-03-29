export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/header'
import { createClient } from '@/lib/supabase/server'
import { getClinic } from '@/services/clinics'

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const typeColors: Record<string, string> = {
  vaccine: 'bg-green-500',
  consultation: 'bg-blue-500',
}

const typeLabels: Record<string, string> = {
  vaccine: 'Vacina',
  consultation: 'Consulta',
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const clinic = await getClinic()

  const now = new Date()
  let year = now.getFullYear()
  let monthIdx = now.getMonth()

  if (month) {
    const [y, m] = month.split('-').map(Number)
    if (y && m) { year = y; monthIdx = m - 1 }
  }

  const firstDay = new Date(year, monthIdx, 1)
  const lastDay = new Date(year, monthIdx + 1, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const supabase = await createClient()
  const startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`
  const endDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`

  let appointments: any[] = []
  if (clinic) {
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, type, pets(name)')
      .eq('clinic_id', clinic.id)
      .gte('scheduled_at', `${startDate}T00:00:00`)
      .lte('scheduled_at', `${endDate}T23:59:59`)
      .order('scheduled_at')

    appointments = data ?? []
  }

  // Group appointments by day
  const byDay: Record<number, any[]> = {}
  for (const apt of appointments) {
    const day = new Date(apt.scheduled_at).getDate()
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(apt)
  }

  const prevMonth = monthIdx === 0 ? `${year - 1}-12` : `${year}-${String(monthIdx).padStart(2, '0')}`
  const nextMonth = monthIdx === 11 ? `${year + 1}-01` : `${year}-${String(monthIdx + 2).padStart(2, '0')}`
  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIdx

  return (
    <div>
      <Header title="Calendario" />

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/dashboard/calendario?month=${prevMonth}`} className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
            &larr; Anterior
          </Link>
          <h2 className="text-lg font-semibold">{monthNames[monthIdx]} {year}</h2>
          <Link href={`/dashboard/calendario?month=${nextMonth}`} className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
            Proximo &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {dayNames.map((d) => (
            <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}

          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1
            const dayAppts = byDay[day] || []
            const isToday = isCurrentMonth && day === today

            return (
              <div key={day} className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{day}</span>
                  {dayAppts.length > 0 && (
                    <span className="text-[10px] text-gray-400">{dayAppts.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map((apt: any) => (
                    <div key={apt.id} className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${typeColors[apt.type] || 'bg-gray-400'}`} />
                      <span className="text-[10px] text-gray-600 truncate">{apt.pets?.name}</span>
                    </div>
                  ))}
                  {dayAppts.length > 2 && (
                    <span className="text-[10px] text-gray-400">+{dayAppts.length - 2} mais</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Consulta</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Vacina</div>
        </div>
      </div>
    </div>
  )
}
