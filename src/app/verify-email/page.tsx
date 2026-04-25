'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  )
}

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setDigits(newDigits)

    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) {
      setError('Digite o codigo completo de 6 digitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao verificar codigo')
        setLoading(false)
        return
      }

      router.push('/login?verified=1')
    } catch {
      setError('Erro de conexao. Tente novamente.')
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResendSuccess(false)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao reenviar codigo')
      } else {
        setResendSuccess(true)
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50 p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 11.5c1.38 0 2.5-1.34 2.5-3S5.88 5.5 4.5 5.5 2 6.84 2 8.5s1.12 3 2.5 3zm15 0c1.38 0 2.5-1.34 2.5-3s-1.12-3-2.5-3-2.5 1.34-2.5 3 1.12 3 2.5 3zm-11-1c1.38 0 2.5-1.34 2.5-3s-1.12-3-2.5-3S6 6.16 6 7.5s1.12 3 2.5 3zm7 0c1.38 0 2.5-1.34 2.5-3s-1.12-3-2.5-3-2.5 1.34-2.5 3 1.12 3 2.5 3zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">ClicaPet</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Icon */}
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Verifique seu email</h1>
          <p className="text-gray-500 text-sm text-center mb-6">
            Enviamos um codigo de 6 digitos para{' '}
            <strong className="text-gray-700">{email}</strong>
          </p>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* 6-digit inputs */}
            <div className="flex justify-center gap-2">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="w-11 h-12 text-center text-lg font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {resendSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl">
                <p className="text-teal-700 text-sm text-center">Novo codigo enviado com sucesso!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500 mb-1">Nao recebeu o codigo?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
            >
              {resending ? 'Reenviando...' : 'Reenviar codigo'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}
