export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { FormField } from '@/components/form-field'
import { createVaccineAction } from '@/services/vaccines'

export default async function NewVaccinePage({
  searchParams,
}: {
  searchParams: Promise<{ pet_id?: string }>
}) {
  const { pet_id } = await searchParams
  if (!pet_id) return <p>Pet não encontrado.</p>

  return (
    <div className="max-w-lg">
      <Header title="Nova vacina" />
      <form
        action={createVaccineAction}
        className="space-y-4 bg-white p-6 rounded-lg shadow-sm border"
      >
        <input type="hidden" name="pet_id" value={pet_id} />
        <FormField label="Nome da vacina" name="name" required />
        <FormField label="Data de aplicação" name="applied_at" type="date" required />
        <FormField label="Próxima dose" name="next_due_date" type="date" />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Registrar vacina
        </button>
      </form>
    </div>
  )
}
