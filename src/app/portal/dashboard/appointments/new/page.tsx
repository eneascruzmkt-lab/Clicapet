export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { createAppointmentAction } from '@/services/appointments'

export default async function NewAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)

  const clientIds = clients?.map((c) => c.id) ?? []

  const { data: pets } = clientIds.length
    ? await supabase.from('pets').select('id, name').in('client_id', clientIds)
    : { data: [] }

  return (
    <div>
      <Header title="Agendar" />
      <div className="max-w-md">
        <form action={createAppointmentAction} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-1">
              Pet
            </label>
            <select
              id="pet_id"
              name="pet_id"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              {pets?.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="consultation">Consulta</option>
              <option value="vaccine">Vacina</option>
            </select>
          </div>
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
              Data e hora
            </label>
            <input
              id="scheduled_at"
              name="scheduled_at"
              type="datetime-local"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observacoes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Agendar
          </button>
        </form>
      </div>
    </div>
  )
}
