'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PhoneInput } from '@/components/phone-input'
import { CpfInput } from '@/components/cpf-input'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      const formData = new FormData(e.currentTarget)
      const inviteCode = ((formData.get('invite_code') as string) || '').toUpperCase().trim()
      const name = formData.get('name') as string
      const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || ''
      const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '') || ''

      if (!inviteCode) {
        setError('Codigo de convite e obrigatorio')
        setLoading(false)
        return
      }

      // Create account via signup API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        // Store tutor data in localStorage for onboarding after verification
        localStorage.setItem('clicapet_invite_code', inviteCode)
        localStorage.setItem('clicapet_tutor_data', JSON.stringify({
          name,
          phone,
          cpf,
          invite_code: inviteCode,
        }))
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao criar conta')
        setLoading(false)
      }
    } else {
      // Login flow
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha invalidos')
        setLoading(false)
        return
      }

      // Fetch session to check role and onboarding status
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()

        if (!session?.role) {
          router.push('/onboarding/client')
        } else if (!session.onboardingComplete) {
          router.push('/onboarding/client')
        } else if (session.role === 'clinic_owner') {
          setError('Esta conta e de dono de clinica. Use a tela "Sou Veterinario" para entrar.')
          setLoading(false)
          return
        } else {
          router.push('/portal/dashboard')
        }
      } catch {
        router.push('/portal/dashboard')
      }
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=1600&fit=crop&q=80"
          alt="Cachorro feliz"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-amber-800/70 to-amber-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold">ClicaPet</span>
          </Link>
          <div>
            <div className="inline-block px-3 py-1 bg-amber-500/30 backdrop-blur rounded-full text-sm font-medium mb-4">
              Portal do Tutor
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Acompanhe a saude<br />do seu pet
            </h2>
            <p className="text-amber-100 text-lg leading-relaxed max-w-md">
              Veja o historico de consultas, vacinas em dia, agende retornos e fique por dentro de tudo sobre a saude do seu companheiro.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-amber-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <span>Cuide de quem voce ama</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ClicaPet</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Portal do Tutor</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {isSignUp ? 'Criar sua conta' : 'Entrar no portal'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimo 6 caracteres"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {isSignUp && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-sm font-semibold text-gray-900">Seus dados</p>
                    <p className="text-xs text-gray-400">Preencha suas informacoes pessoais</p>
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome completo
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Seu nome"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <PhoneInput name="phone" label="Telefone" required />
                  <CpfInput name="cpf" label="CPF" required />
                  <div>
                    <label htmlFor="invite_code" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Codigo de convite
                    </label>
                    <input
                      id="invite_code"
                      name="invite_code"
                      type="text"
                      required
                      placeholder="Ex: ABC12345"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all uppercase"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Peca o codigo para a sua clinica veterinaria</p>
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Carregando...' : isSignUp ? 'Criar minha conta' : 'Entrar'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                {isSignUp ? 'Ja tem conta? Entrar' : 'Nao tem conta? Cadastrar'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Acesso exclusivo para tutores convidados por uma clinica
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
