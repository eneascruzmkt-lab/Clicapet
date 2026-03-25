export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { getClients } from '@/services/clients'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Header title="Clientes" />
        <Link
          href="/dashboard/clients/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Novo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState message="Nenhum cliente cadastrado." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-gray-500">
                {client.email} · {client.phone}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
