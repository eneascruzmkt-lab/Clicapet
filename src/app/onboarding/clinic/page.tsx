'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClinicOwnerProfile } from '@/services/profiles'
import { PhoneInput } from '@/components/phone-input'

export default function ClinicOnboardingPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createClinicOwnerProfile(formData)
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar clinica')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-2">Dados da clinica</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Preencha as informacoes da sua clinica veterinaria
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da clinica
            </label>
            <input
              id="clinic_name"
              name="clinic_name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <PhoneInput name="clinic_phone" label="Telefone" />
          <div>
            <label htmlFor="clinic_address" className="block text-sm font-medium text-gray-700 mb-1">
              Endereco
            </label>
            <input
              id="clinic_address"
              name="clinic_address"
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rua, numero, bairro, cidade"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
