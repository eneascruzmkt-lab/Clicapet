'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'

const DAYS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  active: boolean
}

export default function HorariosPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formDay, setFormDay] = useState(1)
  const [formStart, setFormStart] = useState('08:00')
  const [formEnd, setFormEnd] = useState('18:00')
  const [formDuration, setFormDuration] = useState(30)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!clinic) return
    setClinicId(clinic.id)

    const { data } = await supabase
      .from('available_slots')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('day_of_week')
      .order('start_time')

    setSlots(data ?? [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!clinicId) return
    setSaving(true)

    const { error } = await supabase.from('available_slots').insert({
      clinic_id: clinicId,
      day_of_week: formDay,
      start_time: formStart,
      end_time: formEnd,
      slot_duration: formDuration,
    })

    if (!error) {
      setShowForm(false)
      await loadSlots()
    }
    setSaving(false)
  }

  async function handleToggle(id: string, active: boolean) {
    await supabase.from('available_slots').update({ active: !active }).eq('id', id)
    await loadSlots()
  }

  async function handleDelete(id: string) {
    await supabase.from('available_slots').delete().eq('id', id)
    await loadSlots()
  }

  if (loading) {
    return (
      <div>
        <Header title="Horarios" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  // Agrupar por dia
  const slotsByDay: Record<number, Slot[]> = {}
  slots.forEach((s) => {
    if (!slotsByDay[s.day_of_week]) slotsByDay[s.day_of_week] = []
    slotsByDay[s.day_of_week].push(s)
  })

  return (
    <div>
      <Header title="Horarios de atendimento" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Configure os horarios que sua clinica atende. Os tutores podrao agendar consultas apenas nesses horarios.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Adicionar horario
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 max-w-lg">
          <h3 className="font-semibold mb-4">Novo horario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia da semana</label>
              <select
                value={formDay}
                onChange={(e) => setFormDay(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duracao da consulta</label>
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="time"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input
                type="time"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 text-sm rounded-md hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Slots by day */}
      {slots.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
          <p>Nenhum horario configurado.</p>
          <p className="text-sm mt-1">Adicione horarios para que os tutores possam agendar consultas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = slotsByDay[dayIndex]
            if (!daySlots) return null
            return (
              <div key={dayIndex} className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-900">{dayName}</h3>
                </div>
                <div className="divide-y">
                  {daySlots.map((slot) => (
                    <div key={slot.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${slot.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({slot.slot_duration} min por consulta)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(slot.id, slot.active)}
                          className={`text-xs px-2 py-1 rounded ${slot.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {slot.active ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
