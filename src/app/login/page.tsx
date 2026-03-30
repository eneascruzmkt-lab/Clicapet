'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PhoneInput } from '@/components/phone-input'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('cadastro') === '1')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.role === 'client') {
        setSigningOut(true)
        supabase.auth.signOut().then(() => {
          setSigningOut(false)
          router.refresh()
        })
      }
    })
  }, [supabase, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      const formData = new FormData(e.currentTarget)
      const clinicName = formData.get('clinic_name') as string
      const clinicPhone = (formData.get('clinic_phone') as string)?.replace(/\D/g, '') || ''
      const clinicCep = (formData.get('clinic_cep') as string) || ''
      const clinicStreet = (formData.get('clinic_street') as string) || ''
      const clinicComplement = (formData.get('clinic_complement') as string) || ''
      const clinicAddress = [clinicStreet, clinicComplement, clinicCep].filter(Boolean).join(' - ')

      if (!clinicName) {
        setError('Nome da clinica e obrigatorio')
        setLoading(false)
        return
      }

      const { data: existingLogin } = await supabase.auth.signInWithPassword({ email, password })
      if (existingLogin?.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', existingLogin.user.id)
          .single()
        if (existingProfile?.role === 'client') {
          await supabase.auth.signOut()
          setError('Este email ja esta cadastrado como tutor. Use um email diferente.')
          setLoading(false)
          return
        }
      }
      if (existingLogin?.session) {
        await supabase.auth.signOut()
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
        await supabase.auth.signOut()
        setError('Esta conta e de tutor. Use a tela "Sou tutor" para entrar.')
        setLoading(false)
        return
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }
  }

  if (signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Saindo da conta de tutor...</p>
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Confirme seu email</h1>
          <p className="text-gray-500 mb-4">
            Enviamos um link de confirmacao para <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Verifique sua caixa de entrada e clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => { setEmailSent(false); setIsSignUp(false) }}
            className="mt-6 text-sm text-teal-600 hover:underline"
          >
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=1200&h=1600&fit=crop&q=80"
          alt="Veterinaria com pet"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/70 to-teal-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold">ClicaPet</span>
          </Link>
          <div>
            <div className="inline-block px-3 py-1 bg-teal-500/30 backdrop-blur rounded-full text-sm font-medium mb-4">
              Painel da Clinica
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Gerencie sua clinica<br />de forma simples
            </h2>
            <p className="text-teal-100 text-lg leading-relaxed max-w-md">
              Prontuarios, vacinas, agendamentos e financeiro — tudo em um unico lugar para voce focar no que importa: cuidar dos pets.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-teal-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span>Dados protegidos e seguros</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ClicaPet</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs font-medium text-teal-600 uppercase tracking-wider">Area da Clinica</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {isSignUp ? 'Cadastrar clinica' : 'Entrar na sua conta'}
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {isSignUp && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-sm font-semibold text-gray-900">Dados da clinica</p>
                    <p className="text-xs text-gray-400">Preencha as informacoes da sua clinica</p>
                  </div>
                  <div>
                    <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome da clinica
                    </label>
                    <input
                      id="clinic_name"
                      name="clinic_name"
                      type="text"
                      required
                      placeholder="Ex: Clinica VetCare"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <PhoneInput name="clinic_phone" label="Telefone da clinica" />
                  <div>
                    <label htmlFor="clinic_cep" className="block text-sm font-medium text-gray-700 mb-1.5">
                      CEP
                    </label>
                    <input
                      id="clinic_cep"
                      name="clinic_cep"
                      type="text"
                      required
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic_street" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rua e numero
                    </label>
                    <input
                      id="clinic_street"
                      name="clinic_street"
                      type="text"
                      required
                      placeholder="Ex: Rua das Flores, 123"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="clinic_complement" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Complemento <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      id="clinic_complement"
                      name="clinic_complement"
                      type="text"
                      placeholder="Ex: Sala 2, Bloco B"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
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
                className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Carregando...' : isSignUp ? 'Cadastrar clinica' : 'Entrar'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                {isSignUp ? 'Ja tem conta? Entrar' : 'Nao tem conta? Cadastrar clinica'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-teal-600 transition-colors">
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
