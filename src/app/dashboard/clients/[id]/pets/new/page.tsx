export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { FormField } from '@/components/form-field'
import { createPetAction } from '@/services/pets'

export default async function NewPetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="max-w-lg">
      <Header title="Novo pet" />
      <form
        action={createPetAction}
        className="space-y-4 bg-white p-6 rounded-lg shadow-sm border"
      >
        <input type="hidden" name="client_id" value={id} />
        <FormField label="Nome" name="name" required />
        <div>
          <label
            htmlFor="species"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Espécie
          </label>
          <select
            id="species"
            name="species"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            <option value="Cachorro">Cachorro</option>
            <option value="Gato">Gato</option>
            <option value="Ave">Ave</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <FormField label="Raça (opcional)" name="breed" />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Cadastrar
        </button>
      </form>
    </div>
  )
}
