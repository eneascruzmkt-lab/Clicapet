'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClientProfile } from '@/services/profiles'
import { PhoneInput } from '@/components/phone-input'
import { CpfInput } from '@/components/cpf-input'

export default function ClientOnboardingPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const router = useRouter()

  useEffect(() => {
    const code = localStorage.getItem('clicapet_invite_code')
    if (code) setInviteCode(code)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('invite_code', inviteCode || (formData.get('invite_code') as string))
      await createClientProfile(formData)
      localStorage.removeItem('clicapet_invite_code')
      router.push('/portal/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar perfil')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-2">Seus dados</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Preencha suas informacoes para continuar
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <PhoneInput name="phone" label="Telefone" required />
          <CpfInput name="cpf" label="CPF" required />
          {!inviteCode && (
            <div>
              <label htmlFor="invite_code" className="block text-sm font-medium text-gray-700 mb-1">
                Codigo de convite
              </label>
              <input
                id="invite_code"
                name="invite_code"
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          )}
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
