export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, clinic_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  const clientIds = clients?.map((c) => c.id) ?? []

  const { data: pets } = clientIds.length
    ? await supabase
        .from('pets')
        .select('*, vaccines(id, name, next_due_date)')
        .in('client_id', clientIds)
    : { data: [] }

  const petIds = pets?.map((p) => p.id) ?? []

  const { data: appointments } = petIds.length
    ? await supabase
        .from('appointments')
        .select('*, pets(name)')
        .in('pet_id', petIds)
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_at', { ascending: true })
        .limit(5)
    : { data: [] }

  return (
    <div>
      <Header title={`Ola, ${profile.name}`} />

      <div className="mb-8">
        <h2 className="font-semibold mb-3">Proximos agendamentos</h2>
        {appointments && appointments.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {appointments.map((a: any) => (
              <div key={a.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{a.type === 'vaccine' ? 'Vacina' : 'Consulta'}</p>
                  <p className="text-sm text-gray-500">{a.pets?.name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum agendamento" />
        )}
      </div>

      <h2 className="font-semibold mb-3">Meus pets</h2>
      {pets && pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet: any) => (
            <div key={pet.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="font-medium">{pet.name}</p>
              <p className="text-sm text-gray-500">
                {pet.species} {pet.breed ? `- ${pet.breed}` : ''}
              </p>
              {pet.vaccines?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">Vacinas:</p>
                  {pet.vaccines.map((v: any) => (
                    <p key={v.id} className="text-sm">
                      {v.name}
                      {v.next_due_date && (
                        <span className="text-gray-400 ml-1">(prox: {v.next_due_date})</span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhum pet cadastrado" />
      )}
    </div>
  )
}
