export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { FormField } from '@/components/form-field'
import { createClientAction } from '@/services/clients'

export default function NewClientPage() {
  return (
    <div className="max-w-lg">
      <Header title="Novo cliente" />
      <form
        action={createClientAction}
        className="space-y-4 bg-white p-6 rounded-lg shadow-sm border"
      >
        <FormField label="Nome" name="name" required />
        <FormField label="Telefone" name="phone" placeholder="(11) 99999-9999" />
        <FormField label="Email" name="email" type="email" />
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
