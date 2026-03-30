'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'

type MonthData = { month: string; count: number }
type TypeData = { type: string; count: number }
type RevenueData = { month: string; total: number }

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getLastSixMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${names[parseInt(m) - 1]}/${y.slice(2)}`
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [appointmentsByMonth, setAppointmentsByMonth] = useState<MonthData[]>([])
  const [appointmentsByType, setAppointmentsByType] = useState<TypeData[]>([])
  const [totalPets, setTotalPets] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueData[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!clinic) return

    const months = getLastSixMonths()
    const startDate = `${months[0]}-01`

    // Appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, type')
      .eq('clinic_id', clinic.id)
      .gte('date', startDate)

    // Count by month
    const byMonth: Record<string, number> = {}
    const byType: Record<string, number> = {}
    months.forEach((m) => (byMonth[m] = 0))

    ;(appointments ?? []).forEach((a: any) => {
      const ym = a.date?.slice(0, 7)
      if (ym && byMonth[ym] !== undefined) byMonth[ym]++
      const t = a.type || 'consultation'
      byType[t] = (byType[t] || 0) + 1
    })

    setAppointmentsByMonth(months.map((m) => ({ month: m, count: byMonth[m] })))
    setAppointmentsByType(Object.entries(byType).map(([type, count]) => ({ type, count })))

    // Pets count
    const { count: petsCount } = await supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id)

    setTotalPets(petsCount ?? 0)

    // Clients count
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinic.id)

    setTotalClients(clientsCount ?? 0)

    // Transactions by month
    const { data: transactions } = await supabase
      .from('transactions')
      .select('date, amount, type')
      .eq('clinic_id', clinic.id)
      .eq('type', 'revenue')
      .gte('date', startDate)

    const revByMonth: Record<string, number> = {}
    months.forEach((m) => (revByMonth[m] = 0))

    ;(transactions ?? []).forEach((t: any) => {
      const ym = t.date?.slice(0, 7)
      if (ym && revByMonth[ym] !== undefined) revByMonth[ym] += parseFloat(t.amount) || 0
    })

    setRevenueByMonth(months.map((m) => ({ month: m, total: revByMonth[m] })))
    setLoading(false)
  }

  if (loading) {
    return (
      <div>
        <Header title="Relatorios" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const maxAppointments = Math.max(...appointmentsByMonth.map((d) => d.count), 1)
  const totalAppointments = appointmentsByType.reduce((s, d) => s + d.count, 0) || 1
  const maxRevenue = Math.max(...revenueByMonth.map((d) => d.total), 1)

  const typeLabels: Record<string, string> = {
    vaccine: 'Vacina',
    consultation: 'Consulta',
  }
  const typeColors: Record<string, string> = {
    vaccine: 'bg-teal-500',
    consultation: 'bg-blue-500',
  }

  return (
    <div>
      <Header title="Relatorios" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total de clientes</p>
          <p className="text-3xl font-bold text-teal-600">{totalClients}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total de pets</p>
          <p className="text-3xl font-bold text-teal-600">{totalPets}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Atendimentos (6 meses)</p>
          <p className="text-3xl font-bold text-teal-600">
            {appointmentsByMonth.reduce((s, d) => s + d.count, 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Receita (6 meses)</p>
          <p className="text-3xl font-bold text-teal-600">
            {fmtMoney(revenueByMonth.reduce((s, d) => s + d.total, 0))}
          </p>
        </div>
      </div>

      {/* Appointments by month */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Atendimentos por mes</h2>
        <div className="space-y-3">
          {appointmentsByMonth.map((d) => (
            <div key={d.month} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 text-right">{monthLabel(d.month)}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all"
                  style={{ width: `${(d.count / maxAppointments) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment types */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tipo de atendimento</h2>
        <div className="space-y-3">
          {appointmentsByType.map((d) => {
            const pct = Math.round((d.count / totalAppointments) * 100)
            return (
              <div key={d.type} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 text-right">
                  {typeLabels[d.type] || d.type}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${typeColors[d.type] || 'bg-gray-400'} h-full rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-16">{pct}% ({d.count})</span>
              </div>
            )
          })}
          {appointmentsByType.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum atendimento registrado.</p>
          )}
        </div>
      </div>

      {/* Revenue by month */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Receita por mes</h2>
        <div className="space-y-3">
          {revenueByMonth.map((d) => (
            <div key={d.month} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 text-right">{monthLabel(d.month)}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: `${(d.total / maxRevenue) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-24 text-right">{fmtMoney(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
