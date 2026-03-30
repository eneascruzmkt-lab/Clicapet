'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: petId,
        medication: formData.get('medication'),
        dosage: formData.get('dosage'),
        frequency: formData.get('frequency'),
        duration: formData.get('duration') || null,
        instructions: formData.get('instructions') || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao salvar receita')
      setLoading(false)
      return
    }

    router.push(`/dashboard/pets/${petId}`)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/pets/${petId}`}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Nova Receita</h1>
      </div>

      <div className="max-w-lg bg-white p-6 rounded-lg shadow-sm border">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="medication" className="block text-sm font-medium text-gray-700 mb-1">
              Medicamento
            </label>
            <input
              id="medication"
              name="medication"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-1">
              Dosagem
            </label>
            <input
              id="dosage"
              name="dosage"
              type="text"
              required
              placeholder="Ex: 1 comprimido"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequencia
            </label>
            <input
              id="frequency"
              name="frequency"
              type="text"
              required
              placeholder="Ex: 2x ao dia"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duracao
            </label>
            <input
              id="duration"
              name="duration"
              type="text"
              placeholder="Ex: 7 dias"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Instrucoes
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar receita'}
          </button>
        </form>
      </div>
    </div>
  )
}
