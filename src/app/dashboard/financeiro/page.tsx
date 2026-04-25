export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/header'
import { EmptyState } from '@/components/empty-state'
import { getTransactions, getMonthlyStats } from '@/services/transactions'

const methodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  card: 'Cartao',
  pending: 'Pendente',
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage() {
  const [transactions, stats] = await Promise.all([getTransactions(), getMonthlyStats()])
  const balance = stats.revenue - stats.expenses

  return (
    <div>
      <Header title="Financeiro" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Receita do mes</p>
          <p className="text-3xl font-bold text-green-600">{fmtMoney(stats.revenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Despesas do mes</p>
          <p className="text-3xl font-bold text-red-600">{fmtMoney(stats.expenses)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmtMoney(balance)}</p>
        </div>
      </div>

      {Object.keys(stats.byMethod).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="font-semibold mb-3">Receita por metodo</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(stats.byMethod).map(([method, amount]) => (
              <div key={method} className="text-sm">
                <span className="text-gray-500">{methodLabels[method] || method}:</span>{' '}
                <span className="font-medium">{fmtMoney(amount as number)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Transacoes recentes</h2>
        <Link href="/dashboard/financeiro/new" className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          Nova transacao
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyState message="Nenhuma transacao registrada." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {transactions.map((t: any) => (
            <div key={t.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{t.description}</p>
                <p className="text-sm text-gray-500">
                  {t.date} {t.client?.name ? `— ${t.clients.name}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'revenue' ? '+' : '-'}{fmtMoney(parseFloat(t.amount))}
                </p>
                {t.paymentMethod && (
                  <span className="text-xs text-gray-400">{methodLabels[t.paymentMethod] || t.paymentMethod}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
