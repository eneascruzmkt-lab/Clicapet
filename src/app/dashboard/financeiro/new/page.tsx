export const dynamic = 'force-dynamic'

import { Header } from '@/components/header'
import { createTransactionAction } from '@/services/transactions'
import { getClients } from '@/services/clients'

export default async function NewTransactionPage() {
  const clients = await getClients()

  return (
    <div>
      <Header title="Nova transacao" />
      <div className="max-w-lg bg-white p-6 rounded-lg shadow-sm border">
        <form action={createTransactionAction} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <input id="description" name="description" type="text" required placeholder="Ex: Consulta, Vacina V10, Racao..." className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select id="type" name="type" required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="revenue">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">Metodo de pagamento</label>
            <select id="payment_method" name="payment_method" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartao</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
            <select id="client_id" name="client_id" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Nenhum —</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
            <textarea id="notes" name="notes" rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar transacao</button>
        </form>
      </div>
    </div>
  )
}
