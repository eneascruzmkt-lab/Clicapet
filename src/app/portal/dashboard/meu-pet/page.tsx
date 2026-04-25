export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'
import Image from 'next/image'

function getPetImage(species: string) {
  if (species === 'Cao') return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&q=80'
  if (species === 'Gato') return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&q=80'
  return 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=100&h=100&fit=crop&q=80'
}

function getPetBg(species: string) {
  if (species === 'Cao') return 'bg-amber-50 border-l-amber-400'
  if (species === 'Gato') return 'bg-purple-50 border-l-purple-400'
  if (species === 'Ave') return 'bg-blue-50 border-l-blue-400'
  return 'bg-gray-50 border-l-gray-400'
}

function getSpeciesBadge(species: string) {
  if (species === 'Cao') return 'bg-amber-100 text-amber-700'
  if (species === 'Gato') return 'bg-purple-100 text-purple-700'
  if (species === 'Ave') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-700'
}

function calcAge(birthDate: Date | null): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years >= 1) return `${years} ano${years > 1 ? 's' : ''}`
  if (months > 0) return `${months} ${months > 1 ? 'meses' : 'mes'}`
  return 'Recem-nascido'
}

export default async function MeuPetPage() {
  const session = await auth()
  if (!session?.user) return null

  const { userId } = getSessionData(session)

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!profile) return null

  const clients = await prisma.client.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  })

  const clientIds = clients.map((c) => c.id)

  const pets = clientIds.length
    ? await prisma.pet.findMany({
        where: { clientId: { in: clientIds } },
        include: { vaccines: true },
      })
    : []

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus pets</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os dados dos seus companheiros</p>
        </div>
        <Link
          href="/portal/dashboard/pets/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-medium text-sm rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Cadastrar pet
        </Link>
      </div>

      {pets && pets.length > 0 ? (
        <div className="space-y-4">
          {pets.map((pet: any) => (
            <Link key={pet.id} href={`/portal/dashboard/pets/${pet.id}`} className="block group">
              <div className={`flex items-center gap-4 p-5 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all ${getPetBg(pet.species)}`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={getPetImage(pet.species)}
                      alt={pet.species}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getSpeciesBadge(pet.species)}`}>
                      {pet.species}
                    </span>
                  </div>
                  {(pet.breed || pet.sex || pet.birthDate) && (
                    <p className="text-sm text-gray-500">
                      {pet.breed}
                      {pet.breed && (pet.sex || pet.birthDate) ? ' · ' : ''}
                      {pet.sex && (
                        <span className={pet.sex === 'M' ? 'text-blue-500' : 'text-pink-500'}>
                          {pet.sex === 'M' ? '\u2642' : '\u2640'}
                        </span>
                      )}
                      {pet.sex && pet.birthDate ? ' ' : ''}
                      {calcAge(pet.birthDate)}
                    </p>
                  )}
                  {pet.vaccines?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pet.vaccines.slice(0, 4).map((v: any) => (
                        <span key={v.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-md">
                          {v.name}
                        </span>
                      ))}
                      {pet.vaccines.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-md">
                          +{pet.vaccines.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="relative h-48">
            <Image
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=300&fit=crop&q=80"
              alt="Pets"
              width={600}
              height={300}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-xl font-bold">Cadastre seu primeiro pet</h3>
              <p className="text-white/70 text-sm mt-1">Adicione as informacoes do seu companheiro</p>
            </div>
          </div>
          <div className="p-6 text-center">
            <Link
              href="/portal/dashboard/pets/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Cadastrar pet
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
