'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'

type GroomingService = {
  id: string
  name: string
  price: number
  duration: number
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BanhoTosaPage() {
  const [services, setServices] = useState<GroomingService[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDuration, setFormDuration] = useState('30')

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const res = await fetch('/api/grooming-services')
    if (!res.ok) return
    const data = await res.json()
    setServices(data)
    setLoading(false)
  }

  async function handleAdd() {
    if (!formName.trim() || !formPrice) return
    setSaving(true)

    const res = await fetch('/api/grooming-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName.trim(),
        price: parseFloat(formPrice),
        duration: parseInt(formDuration),
      }),
    })

    if (res.ok) {
      setShowForm(false)
      setFormName('')
      setFormPrice('')
      setFormDuration('30')
      await loadServices()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/grooming-services?id=${id}`, { method: 'DELETE' })
    await loadServices()
  }

  if (loading) {
    return (
      <div>
        <Header title="Banho e Tosa" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div>
      <Header title="Banho e Tosa" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Gerencie os servicos de banho e tosa da sua clinica.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          + Adicionar servico
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 max-w-lg">
          <h3 className="font-semibold mb-4">Novo servico</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do servico</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Banho completo"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preco (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duracao (minutos)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="30"
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

      {services.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
          <p>Nenhum servico cadastrado.</p>
          <p className="text-sm mt-1">Adicione servicos de banho e tosa para sua clinica.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {services.map((service) => (
            <div key={service.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-teal-600">{fmtMoney(Number(service.price))}</span>
                    <span className="mx-1">|</span>
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(service.id)}
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
