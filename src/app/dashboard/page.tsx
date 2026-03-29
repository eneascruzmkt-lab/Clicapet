export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { InviteCodeCard } from '@/components/invite-code-card'
import { getClinic } from '@/services/clinics'
import { getMonthlyStats } from '@/services/transactions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [clinic, stats] = await Promise.all([getClinic(), getMonthlyStats()])

  const { count: petsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })

  const { data: upcomingVaccines } = await supabase
    .from('vaccines')
    .select('id, name, next_due_date, pets(name)')
    .not('next_due_date', 'is', null)
    .gte('next_due_date', new Date().toISOString().split('T')[0])
    .order('next_due_date')
    .limit(5)

  return (
    <div>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total de pets</p>
          <p className="text-3xl font-bold">{petsCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Próximas vacinas</p>
          <p className="text-3xl font-bold">{upcomingVaccines?.length ?? 0}</p>
        </div>
        <Link href="/dashboard/financeiro" className="bg-white p-6 rounded-lg shadow-sm border hover:border-blue-200 transition-colors">
          <p className="text-sm text-gray-500">Receita do mes</p>
          <p className="text-3xl font-bold text-green-600">
            {stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </Link>
        {clinic && <InviteCodeCard code={clinic.invite_code} />}
      </div>

      {upcomingVaccines && upcomingVaccines.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Próximas vacinas</h2>
          </div>
          <ul className="divide-y">
            {upcomingVaccines.map((v: any) => (
              <li key={v.id} className="p-4 flex justify-between">
                <span>
                  {v.name} — {v.pets?.name}
                </span>
                <span className="text-sm text-gray-500">{v.next_due_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
