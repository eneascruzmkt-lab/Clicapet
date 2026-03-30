'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type Slot = {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
}

type AvailableDate = {
  date: string
  dayOfWeek: number
  dayNum: number
  monthShort: string
  dayShort: string
}

type TimeOption = {
  time: string
  period: 'manha' | 'tarde'
}

export default function NewAppointmentPage() {
  const [pets, setPets] = useState<any[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [petId, setPetId] = useState('')
  const [type, setType] = useState('consultation')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', profile.id)

      const clientIds = clients?.map((c) => c.id) ?? []
      if (clientIds.length) {
        const { data } = await supabase.from('pets').select('id, name, species').in('client_id', clientIds)
        const petList = data ?? []
        setPets(petList)
        // Auto-selecionar se tem apenas 1 pet
        if (petList.length === 1) setPetId(petList[0].id)
      }
    }

    const res = await fetch('/api/available-slots')
    const json = await res.json()
    setSlots(json.slots ?? [])
    setBookedTimes(json.appointments ?? [])
    setLoading(false)
  }

  function getAvailableDates(): AvailableDate[] {
    const dates: AvailableDate[] = []
    const now = new Date()
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const dow = d.getDay()
      if (slots.some((s) => s.day_of_week === dow)) {
        dates.push({
          date: d.toISOString().split('T')[0],
          dayOfWeek: dow,
          dayNum: d.getDate(),
          monthShort: MONTHS[d.getMonth()],
          dayShort: DAYS_SHORT[dow],
        })
      }
    }
    return dates
  }

  function getTimesForDate(date: string): TimeOption[] {
    const d = new Date(date + 'T00:00:00')
    const dow = d.getDay()
    const daySlots = slots.filter((s) => s.day_of_week === dow)
    const times: TimeOption[] = []

    for (const slot of daySlots) {
      const [startH, startM] = slot.start_time.split(':').map(Number)
      const [endH, endM] = slot.end_time.split(':').map(Number)
      const startMin = startH * 60 + startM
      const endMin = endH * 60 + endM

      for (let m = startMin; m + slot.slot_duration <= endMin; m += slot.slot_duration) {
        const h = Math.floor(m / 60)
        const min = m % 60
        const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        const datetime = `${date}T${timeStr}:00`

        const isBooked = bookedTimes.some((bt) => {
          const booked = new Date(bt)
          const slotDate = new Date(datetime)
          return Math.abs(booked.getTime() - slotDate.getTime()) < slot.slot_duration * 60 * 1000
        })

        if (!isBooked) {
          times.push({
            time: timeStr,
            period: h < 12 ? 'manha' : 'tarde',
          })
        }
      }
    }
    return times
  }

  async function handleSubmit() {
    if (!petId || !selectedDate || !selectedTime) {
      setError('Selecione pet, data e horario')
      return
    }

    setError('')
    setSubmitting(true)

    const scheduledAt = `${selectedDate}T${selectedTime}:00`

    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!profile?.clinic_id) {
      setError('Clinica nao encontrada')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('appointments').insert({
      pet_id: petId,
      clinic_id: profile.clinic_id,
      scheduled_at: scheduledAt,
      type,
      notes: notes || null,
    })

    if (insertError) {
      setError('Erro ao agendar: ' + insertError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/portal/dashboard')
      router.refresh()
    }, 1500)
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Agendar consulta</h1>
        <div className="mt-6 flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="text-sm">Carregando horarios...</span>
        </div>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Agendar consulta</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          </div>
          <p className="text-gray-500 text-sm mb-2">Cadastre um pet antes de agendar</p>
          <a href="/portal/dashboard/pets/new" className="text-sm text-amber-600 hover:underline font-medium">Cadastrar pet</a>
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Agendar consulta</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-sm">A clinica ainda nao configurou horarios disponiveis.</p>
          <p className="text-gray-400 text-xs mt-1">Entre em contato com a clinica para agendar.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Agendado com sucesso!</h2>
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>
    )
  }

  const availableDates = getAvailableDates()
  const availableTimes = selectedDate ? getTimesForDate(selectedDate) : []
  const manhaTimes = availableTimes.filter((t) => t.period === 'manha')
  const tardeTimes = availableTimes.filter((t) => t.period === 'tarde')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Agendar consulta</h1>
      <p className="text-sm text-gray-400 mb-6">Selecione as opcoes abaixo</p>

      <div className="space-y-6">
        {/* Step 1: Tipo — toggle visual */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Tipo de atendimento</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('consultation')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                type === 'consultation' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'consultation' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586" /></svg>
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${type === 'consultation' ? 'text-amber-700' : 'text-gray-700'}`}>Consulta</p>
                <p className="text-xs text-gray-400">Atendimento geral</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('vaccine')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                type === 'vaccine' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'vaccine' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" /></svg>
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${type === 'vaccine' ? 'text-teal-700' : 'text-gray-700'}`}>Vacina</p>
                <p className="text-xs text-gray-400">Vacinacao do pet</p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Pet — auto-select se 1, senao cards */}
        {pets.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Selecione o pet</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setPetId(pet.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    petId === pet.id ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className={`text-sm font-medium ${petId === pet.id ? 'text-amber-700' : 'text-gray-700'}`}>{pet.name}</p>
                  <p className="text-xs text-gray-400">{pet.species}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Data — calendario horizontal */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Escolha a data</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDates.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => { setSelectedDate(d.date); setSelectedTime('') }}
                className={`flex-shrink-0 w-16 py-3 rounded-xl border-2 text-center transition-all ${
                  selectedDate === d.date
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-[10px] text-gray-400 uppercase">{d.dayShort}</p>
                <p className={`text-lg font-bold ${selectedDate === d.date ? 'text-amber-600' : 'text-gray-900'}`}>{d.dayNum}</p>
                <p className="text-[10px] text-gray-400">{d.monthShort}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Horario — agrupado por periodo */}
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Horario disponivel
              {availableTimes.length === 0 && <span className="text-gray-400 font-normal ml-1">— nenhum livre</span>}
            </p>
            {availableTimes.length > 0 ? (
              <div className="space-y-4">
                {manhaTimes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Manha</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {manhaTimes.map((t) => (
                        <button
                          key={t.time}
                          type="button"
                          onClick={() => setSelectedTime(t.time)}
                          className={`py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                            selectedTime === t.time
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-700 border-gray-100 hover:border-amber-300'
                          }`}
                        >
                          {t.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tardeTimes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tarde</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {tardeTimes.map((t) => (
                        <button
                          key={t.time}
                          type="button"
                          onClick={() => setSelectedTime(t.time)}
                          className={`py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                            selectedTime === t.time
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-700 border-gray-100 hover:border-amber-300'
                          }`}
                        >
                          {t.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Todos os horarios estao ocupados nesta data.</p>
            )}
          </div>
        )}

        {/* Observacoes — colapsavel */}
        {selectedTime && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Observacoes <span className="text-gray-400 font-normal">(opcional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Sintomas, motivo da consulta..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        )}

        {/* Resumo + confirmar */}
        {selectedTime && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <p className="text-xs text-amber-600 uppercase tracking-wider font-medium mb-2">Resumo</p>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{type === 'consultation' ? 'Consulta' : 'Vacina'} — {pets.find((p) => p.id === petId)?.name}</span>
              <span className="font-medium">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} as {selectedTime}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !petId || !selectedDate || !selectedTime}
          className="w-full py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm text-base"
        >
          {submitting ? 'Agendando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </div>
  )
}
