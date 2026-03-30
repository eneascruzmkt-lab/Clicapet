export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CancelAppointmentButton } from '@/components/cancel-appointment'
import { PetActions } from '@/components/pet-actions'

function getPetBannerImage(species: string) {
  if (species === 'Cao') return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&q=80'
  if (species === 'Gato') return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&q=80'
  return 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=100&h=100&fit=crop&q=80'
}

function getSpeciesGradient(species: string) {
  if (species === 'Cao') return 'from-amber-500/80 to-amber-600/70'
  if (species === 'Gato') return 'from-purple-500/80 to-purple-600/70'
  return 'from-blue-500/80 to-blue-600/70'
}

function getSpeciesBadgeColor(species: string) {
  if (species === 'Cao') return 'bg-amber-500/20 text-amber-100'
  if (species === 'Gato') return 'bg-purple-500/20 text-purple-100'
  return 'bg-blue-500/20 text-blue-100'
}

function calcAge(birthDate: string | null): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years >= 1) return `${years} ano${years > 1 ? 's' : ''}`
  if (months > 0) return `${months} ${months > 1 ? 'meses' : 'mes'}`
  return 'Recem-nascido'
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pet } = await supabase
    .from('pets')
    .select('*, vaccines(id, name, applied_at, next_due_date)')
    .eq('id', id)
    .single()

  if (!pet) return notFound()

  let records: any[] = []
  const { data: medRecords } = await supabase
    .from('medical_records')
    .select('id, type, description, created_at')
    .eq('pet_id', id)
  records = medRecords ?? []

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('pet_id', id)
    .order('created_at', { ascending: false })

  const { data: exams } = await supabase
    .from('exam_files')
    .select('*')
    .eq('pet_id', id)
    .order('created_at', { ascending: false })

  let appointments: any[] = []
  const { data: appts } = await supabase
    .from('appointments')
    .select('*')
    .eq('pet_id', id)
    .order('scheduled_at', { ascending: false })
    .limit(10)
  appointments = appts ?? []

  const vaccines = pet.vaccines ?? []

  return (
    <div className="max-w-4xl">
      {/* Header Banner */}
      <div className="relative mb-6 rounded-2xl overflow-hidden">
        <Image
          src={getPetBannerImage(pet.species)}
          alt={pet.name}
          width={800}
          height={250}
          className="w-full h-40 object-cover"
          priority
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${getSpeciesGradient(pet.species)}`} />
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/portal/dashboard/meu-pet" className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{pet.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-lg ${getSpeciesBadgeColor(pet.species)}`}>
                  {pet.species}
                </span>
                {pet.breed && (
                  <span className="text-white/70 text-sm">{pet.breed}</span>
                )}
                {pet.sex && (
                  <span className={`text-sm font-medium ${pet.sex === 'M' ? 'text-blue-200' : 'text-pink-200'}`}>
                    {pet.sex === 'M' ? '\u2642' : '\u2640'}
                  </span>
                )}
                {calcAge(pet.birth_date) && (
                  <span className="text-white/70 text-sm">{calcAge(pet.birth_date)}</span>
                )}
                {pet.color && (
                  <span className="text-white/70 text-sm">{pet.color}</span>
                )}
              </div>
            </div>
          </div>
          <PetActions pet={{ id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, photo_url: pet.photo_url ?? null, birth_date: pet.birth_date ?? null, sex: pet.sex ?? null, color: pet.color ?? null }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Carteirinha de Vacinacao */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Carteirinha de Vacinacao</h2>
              </div>
              <span className="text-xs text-gray-400">{vaccines.length} vacina{vaccines.length !== 1 ? 's' : ''}</span>
            </div>
            {vaccines.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {vaccines.map((v: any) => {
                  const isOverdue = v.next_due_date && new Date(v.next_due_date) < new Date()
                  return (
                    <div key={v.id} className={`p-4 flex items-center justify-between border-l-4 ${isOverdue ? 'border-l-red-400 bg-red-50/30' : v.next_due_date ? 'border-l-teal-400' : 'border-l-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-400' : v.next_due_date ? 'bg-teal-400' : 'bg-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{v.name}</p>
                          <p className="text-xs text-gray-400">
                            Aplicada em {new Date(v.applied_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {v.next_due_date && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                          {isOverdue ? 'Atrasada' : `Prox: ${new Date(v.next_due_date).toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhuma vacina registrada ainda
              </div>
            )}
          </div>

          {/* Receitas (Prescriptions) */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6 shadow-sm">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Receitas</h2>
              </div>
              <span className="text-xs text-gray-400">{(prescriptions ?? []).length} receita{(prescriptions ?? []).length !== 1 ? 's' : ''}</span>
            </div>
            {prescriptions && prescriptions.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {prescriptions.map((p: any) => (
                  <div key={p.id} className="p-4 border-l-4 border-l-purple-400">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">{p.medication}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {p.dosage} &middot; {p.frequency}
                    </p>
                    {p.duration && (
                      <p className="text-xs text-purple-600 mt-1">
                        Duracao: {p.duration}
                      </p>
                    )}
                    {p.instructions && (
                      <p className="text-xs text-gray-400 mt-1">{p.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhuma receita registrada
              </div>
            )}
          </div>

          {/* Exames (Exam Files) */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6 shadow-sm">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Exames</h2>
              </div>
              <span className="text-xs text-gray-400">{(exams ?? []).length} exame{(exams ?? []).length !== 1 ? 's' : ''}</span>
            </div>
            {exams && exams.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="p-4 border-l-4 border-l-indigo-400 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(exam.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <a
                      href={exam.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum exame registrado
              </div>
            )}
          </div>

          {/* Medical Records */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6 shadow-sm">
            <div className="p-5 border-b border-gray-50 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-900">Prontuarios</h2>
            </div>
            {records.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {records.map((r: any) => {
                  const typeLabels: Record<string, string> = {
                    consultation: 'Consulta',
                    surgery: 'Cirurgia',
                    exam: 'Exame',
                    emergency: 'Emergencia',
                  }
                  const typeColors: Record<string, string> = {
                    consultation: 'bg-blue-50 text-blue-600',
                    surgery: 'bg-red-50 text-red-600',
                    exam: 'bg-purple-50 text-purple-600',
                    emergency: 'bg-orange-50 text-orange-600',
                  }
                  const typeBorders: Record<string, string> = {
                    consultation: 'border-l-blue-400',
                    surgery: 'border-l-red-400',
                    exam: 'border-l-purple-400',
                    emergency: 'border-l-orange-400',
                  }
                  return (
                    <div key={r.id} className={`p-4 border-l-4 ${typeBorders[r.type] ?? 'border-l-gray-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeColors[r.type] ?? 'bg-gray-50 text-gray-600'}`}>
                          {typeLabels[r.type] ?? r.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum prontuario registrado
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Appointments */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-50 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-900">Agendamentos</h2>
            </div>
            {appointments && appointments.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {appointments.map((a: any) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-50 text-yellow-700',
                    confirmed: 'bg-teal-50 text-teal-700',
                    done: 'bg-gray-50 text-gray-500',
                    cancelled: 'bg-red-50 text-red-600',
                  }
                  const statusLabels: Record<string, string> = {
                    pending: 'Pendente',
                    confirmed: 'Confirmado',
                    done: 'Realizado',
                    cancelled: 'Cancelado',
                  }
                  const statusBorders: Record<string, string> = {
                    pending: 'border-l-yellow-400',
                    confirmed: 'border-l-teal-400',
                    done: 'border-l-gray-300',
                    cancelled: 'border-l-red-400',
                  }
                  return (
                    <div key={a.id} className={`p-4 border-l-4 ${statusBorders[a.status] ?? 'border-l-gray-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {a.type === 'vaccine' ? 'Vacina' : 'Consulta'}
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusColors[a.status] ?? ''}`}>
                          {statusLabels[a.status] ?? a.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(a.scheduled_at).toLocaleDateString('pt-BR')} as{' '}
                        {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {a.notes && <p className="text-xs text-gray-500 mt-1">{a.notes}</p>}
                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <div className="mt-2">
                          <CancelAppointmentButton id={a.id} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">
                Nenhum agendamento
              </div>
            )}
          </div>

          <Link
            href="/portal/dashboard/appointments/new"
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agendar consulta
          </Link>
        </div>
      </div>
    </div>
  )
}
