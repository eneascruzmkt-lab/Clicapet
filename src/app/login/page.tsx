'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { PhoneInput } from '@/components/phone-input'

export default function LoginPage() {
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
      const clinicName = formData.get('clinic_name') as string
      const clinicPhone = (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || ''
      const clinicAddress = formData.get('clinic_address') as string || ''

      if (!clinicName) {
        setError('Nome da clinica e obrigatorio')
        setLoading(false)
        return
      }

      const { error, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'clinic_owner',
            clinic_name: clinicName,
            clinic_phone: clinicPhone,
            clinic_address: clinicAddress,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Se auto-confirmado (sem email), criar perfil e ir direto pro dashboard
      if (signUpData.session) {
        try {
          const fd = new FormData()
          fd.set('clinic_name', clinicName)
          fd.set('clinic_phone', clinicPhone)
          fd.set('clinic_address', clinicAddress)
          const { createClinicOwnerProfile } = await import('@/services/profiles')
          await createClinicOwnerProfile(fd)
          router.push('/dashboard')
          router.refresh()
          return
        } catch {
          // Falha — vai pro onboarding
          router.push('/onboarding/clinic')
          return
        }
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

      if (!profile) {
        // Perfil nao existe — tentar criar a partir do user_metadata (auto-confirm)
        const meta = data.user.user_metadata
        if (meta?.role === 'clinic_owner' && meta?.clinic_name) {
          try {
            const formData = new FormData()
            formData.set('clinic_name', meta.clinic_name)
            formData.set('clinic_phone', meta.clinic_phone || '')
            formData.set('clinic_address', meta.clinic_address || '')
            const { createClinicOwnerProfile } = await import('@/services/profiles')
            await createClinicOwnerProfile(formData)
            router.push('/dashboard')
            router.refresh()
            return
          } catch {
            // Falhou — vai pro onboarding
          }
        }
        router.push('/onboarding/clinic')
      } else if (!profile.onboarding_complete) {
        if (profile.role === 'clinic_owner') router.push('/onboarding/clinic')
        else router.push('/onboarding/client')
      } else if (profile.role === 'client') {
        router.push('/portal/dashboard')
      } else {
        router.push('/dashboard')
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
          {isSignUp ? 'Cadastrar clinica' : 'Entrar'} — Clinica
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
              <p className="text-sm font-medium text-gray-600">Dados da clinica</p>
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
              <PhoneInput name="clinic_phone" label="Telefone da clinica" />
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
          <Link href="/portal" className="text-sm text-gray-500 hover:underline">
            Sou tutor →
          </Link>
        </div>
      </div>
    </div>
  )
}
