'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'

const ROLES = [
  { value: 'vet', label: 'Veterinario' },
  { value: 'assistant', label: 'Assistente' },
  { value: 'groomer', label: 'Tosador' },
  { value: 'receptionist', label: 'Recepcionista' },
]

const roleLabels: Record<string, string> = {
  vet: 'Veterinario',
  assistant: 'Assistente',
  groomer: 'Tosador',
  receptionist: 'Recepcionista',
}

type Staff = {
  id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  active: boolean
}

export default function FuncionariosPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('vet')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
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
      .from('staff')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('name')

    setStaff(data ?? [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!clinicId || !formName.trim()) return
    setSaving(true)

    const { error } = await supabase.from('staff').insert({
      clinic_id: clinicId,
      name: formName.trim(),
      role: formRole,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
    })

    if (!error) {
      setShowForm(false)
      setFormName('')
      setFormRole('vet')
      setFormPhone('')
      setFormEmail('')
      await loadStaff()
    }
    setSaving(false)
  }

  async function handleToggle(id: string, active: boolean) {
    await supabase.from('staff').update({ active: !active }).eq('id', id)
    await loadStaff()
  }

  async function handleDelete(id: string) {
    await supabase.from('staff').delete().eq('id', id)
    await loadStaff()
  }

  if (loading) {
    return (
      <div>
        <Header title="Funcionarios" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div>
      <Header title="Funcionarios" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Gerencie os funcionarios da sua clinica.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          + Adicionar funcionario
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 max-w-lg">
          <h3 className="font-semibold mb-4">Novo funcionario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcao</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 disabled:opacity-50"
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

      {staff.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
          <p>Nenhum funcionario cadastrado.</p>
          <p className="text-sm mt-1">Adicione funcionarios para gerenciar sua equipe.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {staff.map((member) => (
            <div key={member.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${member.active ? 'bg-teal-400' : 'bg-gray-300'}`} />
                <div>
                  <span className="text-sm font-medium text-gray-900">{member.name}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {roleLabels[member.role] || member.role}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {member.phone && <span>{member.phone}</span>}
                    {member.phone && member.email && <span className="mx-1">|</span>}
                    {member.email && <span>{member.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(member.id, member.active)}
                  className={`text-xs px-2 py-1 rounded ${member.active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {member.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
