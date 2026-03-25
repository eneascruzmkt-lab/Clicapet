export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { getClient } from '@/services/clients'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  return (
    <div>
      <Header title={client.name} />
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <p className="text-sm text-gray-500">Email: {client.email || '—'}</p>
        <p className="text-sm text-gray-500">Telefone: {client.phone || '—'}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pets</h2>
        <Link
          href={`/dashboard/clients/${id}/pets/new`}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Novo pet
        </Link>
      </div>

      {!client.pets || client.pets.length === 0 ? (
        <EmptyState message="Nenhum pet cadastrado." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {client.pets.map((pet: any) => (
            <Link
              key={pet.id}
              href={`/dashboard/pets/${pet.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <p className="font-medium">{pet.name}</p>
              <p className="text-sm text-gray-500">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
