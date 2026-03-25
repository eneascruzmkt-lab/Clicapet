'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { PhoneInput } from '@/components/phone-input'
import { CpfInput } from '@/components/cpf-input'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      const formData = new FormData(e.currentTarget)
      const inviteCode = (formData.get('invite_code') as string)?.toUpperCase().trim()
      const name = formData.get('name') as string
      const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || ''
      const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '') || ''

      // Validar codigo de convite
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single()

      if (!clinic) {
        setError('Codigo de convite invalido')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'client',
            name,
            phone,
            cpf,
            invite_code: inviteCode,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setEmailSent(true)
      setLoading(false)
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('user_id', data.user.id)
        .single()

      if (!profile || !profile.onboarding_complete) {
        router.push('/onboarding/client')
      } else if (profile.role === 'clinic_owner') {
        router.push('/dashboard')
      } else {
        router.push('/portal/dashboard')
      }
      router.refresh()
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-2">Confirme seu email</h1>
          <p className="text-gray-500 mb-4">
            Enviamos um link de confirmacao para <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Verifique sua caixa de entrada e clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => { setEmailSent(false); setIsSignUp(false) }}
            className="mt-6 text-sm text-blue-600 hover:underline"
          >
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className={`w-full ${isSignUp ? 'max-w-md' : 'max-w-sm'} p-8 bg-white rounded-lg shadow`}>
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Cadastrar' : 'Entrar'} — Tutor
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isSignUp && (
            <>
              <hr className="my-2" />
              <p className="text-sm font-medium text-gray-600">Seus dados</p>
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
              <div>
                <label htmlFor="invite_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Codigo de convite
                </label>
                <input
                  id="invite_code"
                  name="invite_code"
                  type="text"
                  required
                  placeholder="Ex: ABC12345"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Peca o codigo para a sua clinica</p>
              </div>
            </>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Ja tem conta? Entrar' : 'Nao tem conta? Cadastrar'}
        </button>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:underline">
            ← Sou dono de clinica
          </Link>
        </div>
      </div>
    </div>
  )
}
