export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { createMedicalRecordAction } from '@/services/medical-records'

export default async function NewMedicalRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ pet_id?: string }>
}) {
  const { pet_id } = await searchParams

  return (
    <div>
      <Header title="Novo registro clinico" />
      <div className="max-w-lg bg-white p-6 rounded-lg shadow-sm border">
        <form action={createMedicalRecordAction} className="space-y-4">
          <input type="hidden" name="pet_id" value={pet_id} />
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select id="type" name="type" required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="consultation">Consulta</option>
              <option value="surgery">Cirurgia</option>
              <option value="exam">Exame</option>
              <option value="emergency">Emergencia</option>
            </select>
          </div>
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">Diagnostico</label>
            <textarea id="diagnosis" name="diagnosis" rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-1">Tratamento</label>
            <textarea id="treatment" name="treatment" rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
            <input id="weight_kg" name="weight_kg" type="number" step="0.01" min="0" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="vet_name" className="block text-sm font-medium text-gray-700 mb-1">Veterinario</label>
            <input id="vet_name" name="vet_name" type="text" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
            <textarea id="notes" name="notes" rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar registro</button>
        </form>
      </div>
    </div>
  )
}
