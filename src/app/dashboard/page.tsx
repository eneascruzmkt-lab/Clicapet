export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { InviteCodeCard } from '@/components/invite-code-card'
import { getClinic } from '@/services/clinics'
import { getMonthlyStats } from '@/services/transactions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [clinic, stats] = await Promise.all([getClinic(), getMonthlyStats()])

  const { count: petsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })

  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { data: upcomingVaccines } = await supabase
    .from('vaccines')
    .select('id, name, next_due_date, pets(name)')
    .not('next_due_date', 'is', null)
    .gte('next_due_date', new Date().toISOString().split('T')[0])
    .order('next_due_date')
    .limit(5)

  const { data: pendingAppointments } = await supabase
    .from('appointments')
    .select('id, scheduled_at, type, status, pets(name)')
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(5)

  const clinicName = clinic?.name ?? 'Clinica'

  return (
    <div className="max-w-6xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ola, {clinicName}</h1>
        <p className="text-sm text-gray-400 mt-1">Painel de gestao da sua clinica</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Clientes"
          value={clientsCount ?? 0}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-1.997M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
          color="blue"
          href="/dashboard/clients"
        />
        <StatCard
          label="Pets"
          value={petsCount ?? 0}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>}
          color="amber"
        />
        <StatCard
          label="Proximas vacinas"
          value={upcomingVaccines?.length ?? 0}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" /></svg>}
          color="teal"
        />
        <Link href="/dashboard/financeiro" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75" /></svg>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Receita do mes</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Invite code */}
        {clinic && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Codigo de convite</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">Compartilhe com seus tutores para que se cadastrem no portal.</p>
            <div className="flex items-center gap-3">
              <code className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-mono font-bold text-teal-600 tracking-wider">
                {clinic.invite_code}
              </code>
              <p className="text-xs text-gray-400">Link: clicapet.vercel.app/portal</p>
            </div>
          </div>
        )}

        {/* Pending appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Proximos agendamentos</h2>
            </div>
            <Link href="/dashboard/calendario" className="text-xs text-teal-600 hover:underline">Ver todos</Link>
          </div>
          {pendingAppointments && pendingAppointments.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {pendingAppointments.map((a: any) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.type === 'vaccine' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                      {a.type === 'vaccine' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.pets?.name}</p>
                      <p className="text-xs text-gray-400">{a.type === 'vaccine' ? 'Vacina' : 'Consulta'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{new Date(a.scheduled_at).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-400">{new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">Nenhum agendamento pendente</div>
          )}
        </div>
      </div>

      {/* Upcoming vaccines */}
      {upcomingVaccines && upcomingVaccines.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" /></svg>
            </div>
            <h2 className="font-semibold text-gray-900">Proximas vacinas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingVaccines.map((v: any) => (
              <div key={v.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.pets?.name}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg">
                  {new Date(v.next_due_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color, href }: { label: string; value: number; icon: React.ReactNode; color: string; href?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-green-50 text-green-600',
  }
  const content = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
  if (href) return <Link href={href} className="hover:shadow-md transition-all">{content}</Link>
  return content
}
