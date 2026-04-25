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
            href={`/dashboard/clients/${pet.client.id}`}
            className="text-blue-600 hover:underline"
          >
            {pet.client.name}
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
                    Aplicada em: {vaccine.appliedAt}
                  </p>
                  {vaccine.nextDueDate && (
                    <p className="text-sm text-gray-500">
                      Próxima dose: {vaccine.nextDueDate}
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

      <div className="flex items-center justify-between mb-4 mt-8">
        <h2 className="text-lg font-semibold">Historico clinico</h2>
        <Link
          href={`/dashboard/pets/${id}/medical-records/new?pet_id=${id}`}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Novo registro
        </Link>
      </div>

      {!pet.medicalRecords || pet.medicalRecords.length === 0 ? (
        <EmptyState message="Nenhum registro clinico." />
      ) : (
        <div className="space-y-3">
          {pet.medicalRecords
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((record: any) => {
              const borderColor: Record<string, string> = {
                consultation: 'border-l-blue-500',
                surgery: 'border-l-red-500',
                exam: 'border-l-green-500',
                emergency: 'border-l-orange-500',
              }
              const typeLabel: Record<string, string> = {
                consultation: 'Consulta',
                surgery: 'Cirurgia',
                exam: 'Exame',
                emergency: 'Emergencia',
              }
              return (
                <div key={record.id} className={`bg-white p-4 rounded-lg shadow-sm border border-l-4 ${borderColor[record.type] || 'border-l-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{record.date}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{typeLabel[record.type] || record.type}</span>
                    {record.vetName && <span className="text-xs text-gray-400">Dr(a). {record.vetName}</span>}
                  </div>
                  {record.diagnosis && <p className="text-sm"><span className="text-gray-500">Diagnostico:</span> {record.diagnosis}</p>}
                  {record.treatment && <p className="text-sm"><span className="text-gray-500">Tratamento:</span> {record.treatment}</p>}
                  {record.weightKg && <p className="text-sm"><span className="text-gray-500">Peso:</span> {record.weightKg} kg</p>}
                  {record.notes && <p className="text-sm text-gray-400 mt-1">{record.notes}</p>}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
