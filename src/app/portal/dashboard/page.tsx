export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { CancelAppointmentButton } from '@/components/cancel-appointment'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, phone, clinic_id, clinics(name)')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  const clientIds = clients?.map((c) => c.id) ?? []

  const { data: pets } = clientIds.length
    ? await supabase
        .from('pets')
        .select('*, vaccines(id, name, applied_at, next_due_date)')
        .in('client_id', clientIds)
    : { data: [] }

  const petIds = pets?.map((p) => p.id) ?? []

  let appointments: any[] = []
  if (petIds.length) {
    const { data } = await supabase
      .from('appointments')
      .select('*, pets(name)')
      .in('pet_id', petIds)
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at', { ascending: true })
      .limit(5)
    appointments = data ?? []
  }

  let medicalRecords: any[] = []
  if (petIds.length) {
    const { data } = await supabase
      .from('medical_records')
      .select('*, pets(name)')
      .in('pet_id', petIds)
      .order('created_at', { ascending: false })
      .limit(5)
    medicalRecords = data ?? []
  }

  // Vaccine alerts
  const today = new Date()
  const upcomingVaccines = (pets ?? []).flatMap((pet: any) =>
    (pet.vaccines ?? [])
      .filter((v: any) => v.next_due_date && new Date(v.next_due_date) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))
      .map((v: any) => ({ ...v, petName: pet.name, petId: pet.id }))
  ).sort((a: any, b: any) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())

  const clinicName = (profile as any).clinics?.name

  function getPetImage(species: string) {
    if (species === 'Cao') return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&q=80'
    if (species === 'Gato') return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&q=80'
    return 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=100&h=100&fit=crop&q=80'
  }

  function getPetBg(species: string) {
    if (species === 'Cao') return 'bg-amber-50 border-l-amber-400'
    if (species === 'Gato') return 'bg-purple-50 border-l-purple-400'
    if (species === 'Ave') return 'bg-blue-50 border-l-blue-400'
    return 'bg-gray-50 border-l-gray-400'
  }

  function getSpeciesBadge(species: string) {
    if (species === 'Cao') return 'bg-amber-100 text-amber-700'
    if (species === 'Gato') return 'bg-purple-100 text-purple-700'
    if (species === 'Ave') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="max-w-5xl">
      {/* Welcome Banner */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=400&fit=crop&q=80"
          alt="Banner"
          width={1200}
          height={400}
          className="w-full h-48 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/90 to-amber-600/80" />
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Ola, {profile.name}</h1>
            {clinicName && (
              <p className="text-amber-100 text-sm mt-1">
                Vinculado a <span className="font-semibold text-white">{clinicName}</span>
              </p>
            )}
          </div>
          <Link
            href="/portal/dashboard/appointments/new"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 font-semibold rounded-xl hover:bg-amber-50 transition-colors shadow-lg text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Agendar consulta
          </Link>
        </div>
      </div>

      {/* Vaccine Alerts */}
      {upcomingVaccines.length > 0 && (
        <div className="mb-8 p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm font-semibold">Vacinas proximas</p>
          </div>
          <div className="space-y-2">
            {upcomingVaccines.map((v: any) => {
              const dueDate = new Date(v.next_due_date)
              const isOverdue = dueDate < today
              return (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/90">
                    <span className="font-medium text-white">{v.petName}</span> — {v.name}
                  </span>
                  <span className={`font-semibold ${isOverdue ? 'text-yellow-200' : 'text-white'}`}>
                    {isOverdue ? 'Atrasada' : dueDate.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pets" value={pets?.length ?? 0} color="amber" />
        <StatCard label="Agendamentos" value={appointments.length} color="blue" />
        <StatCard label="Vacinas aplicadas" value={(pets ?? []).reduce((acc: number, p: any) => acc + (p.vaccines?.length ?? 0), 0)} color="teal" />
        <StatCard label="Consultas" value={medicalRecords.length} color="purple" />
      </div>

      {/* Appointments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Proximos agendamentos</h2>
          <Link href="/portal/dashboard/appointments/new" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            + Agendar
          </Link>
        </div>
        {appointments.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
            {appointments.map((a: any) => (
              <div key={a.id} className="p-4 flex justify-between items-center border-l-4 border-l-amber-400">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.type === 'vaccine' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                    {a.type === 'vaccine' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.type === 'vaccine' ? 'Vacina' : 'Consulta'}</p>
                    <p className="text-xs text-gray-400">{a.pets?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <CancelAppointmentButton id={a.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-1">Nenhum agendamento</p>
            <Link href="/portal/dashboard/appointments/new" className="text-sm text-amber-600 hover:underline mt-2 inline-block font-medium">
              Agendar consulta
            </Link>
          </div>
        )}
      </div>

      {/* Pets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Meus pets</h2>
          <Link href="/portal/dashboard/pets/new" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            + Cadastrar pet
          </Link>
        </div>
        {pets && pets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.map((pet: any) => (
              <Link key={pet.id} href={`/portal/dashboard/pets/${pet.id}`} className="block group">
                <div className={`p-5 rounded-2xl border border-gray-100 border-l-4 ${getPetBg(pet.species)} hover:shadow-md hover:shadow-amber-500/5 transition-all`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={getPetImage(pet.species)}
                          alt={pet.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{pet.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${getSpeciesBadge(pet.species)}`}>
                            {pet.species}
                          </span>
                          {pet.breed && (
                            <span className="text-xs text-gray-400">{pet.breed}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                  {pet.vaccines?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Vacinas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pet.vaccines.slice(0, 3).map((v: any) => (
                          <span key={v.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-md">
                            {v.name}
                          </span>
                        ))}
                        {pet.vaccines.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-md">
                            +{pet.vaccines.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=300&fit=crop&q=80"
              alt="Cadastre seu primeiro pet"
              width={600}
              height={300}
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
              <p className="text-white text-lg font-bold mb-3">Cadastre seu primeiro pet</p>
              <Link
                href="/portal/dashboard/pets/new"
                className="px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-lg text-sm"
              >
                Cadastrar meu primeiro pet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const bgColors: Record<string, string> = {
    amber: 'bg-amber-50',
    blue: 'bg-blue-50',
    teal: 'bg-teal-50',
    purple: 'bg-purple-50',
  }
  const iconColors: Record<string, string> = {
    amber: 'text-amber-600 bg-amber-100',
    blue: 'text-blue-600 bg-blue-100',
    teal: 'text-teal-600 bg-teal-100',
    purple: 'text-purple-600 bg-purple-100',
  }
  const textColors: Record<string, string> = {
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    teal: 'text-teal-700',
    purple: 'text-purple-700',
  }
  const icons: Record<string, React.ReactNode> = {
    amber: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
    blue: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    teal: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
      </svg>
    ),
    purple: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586" />
      </svg>
    ),
  }

  return (
    <div className={`${bgColors[color]} rounded-2xl p-4 border border-gray-100/50`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          {icons[color]}
        </div>
      </div>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
