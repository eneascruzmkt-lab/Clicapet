export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { getPet } from '@/services/pets'

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pet = await getPet(id)
  if (!pet) notFound()

  return (
    <div>
      <Header title={pet.name} />
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <p className="text-sm text-gray-500">Espécie: {pet.species}</p>
        {pet.breed && (
          <p className="text-sm text-gray-500">Raça: {pet.breed}</p>
        )}
        <p className="text-sm text-gray-500">
          Tutor:{' '}
          <Link
            href={`/dashboard/clients/${pet.clients.id}`}
            className="text-blue-600 hover:underline"
          >
            {pet.clients.name}
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Vacinas</h2>
        <Link
          href={`/dashboard/vaccines/new?pet_id=${id}`}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Nova vacina
        </Link>
      </div>

      {!pet.vaccines || pet.vaccines.length === 0 ? (
        <EmptyState message="Nenhuma vacina registrada." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {pet.vaccines.map((vaccine: any) => (
            <div key={vaccine.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{vaccine.name}</p>
                  <p className="text-sm text-gray-500">
                    Aplicada em: {vaccine.applied_at}
                  </p>
                  {vaccine.next_due_date && (
                    <p className="text-sm text-gray-500">
                      Próxima dose: {vaccine.next_due_date}
                    </p>
                  )}
                </div>
                {vaccine.reminders?.[0] && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      vaccine.reminders[0].status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {vaccine.reminders[0].status === 'sent'
                      ? 'Lembrete enviado'
                      : 'Lembrete pendente'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
