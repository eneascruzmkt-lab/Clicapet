export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { updatePortalProfile } from '@/services/portal-profile'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user) return null

  const { userId } = getSessionData(session)

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { name: true, phone: true, cpf: true, clinic: { select: { name: true, phone: true } } },
  })

  if (!profile) return null

  const clinic = profile.clinic

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Meu perfil</h1>
      <p className="text-sm text-gray-400 mb-6">Gerencie suas informacoes pessoais</p>

      <form action={updatePortalProfile} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={profile.name ?? ''}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ''}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            disabled
            value={session.user.email ?? ''}
            className="w-full px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-400"
          />
        </div>
        {profile.cpf && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CPF
            </label>
            <input
              type="text"
              disabled
              value={profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              className="w-full px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-400"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
        >
          Salvar alteracoes
        </button>
      </form>

      {/* Clinic info */}
      {clinic && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900">Minha clinica</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700"><span className="text-gray-400">Nome:</span> {clinic.name}</p>
            {clinic.phone && (
              <p className="text-sm text-gray-700"><span className="text-gray-400">Telefone:</span> {clinic.phone}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
