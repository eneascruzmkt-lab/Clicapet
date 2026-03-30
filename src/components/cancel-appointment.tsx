'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CancelAppointmentButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-[11px] px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? '...' : 'Sim'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[11px] px-2 py-1 text-gray-500 hover:text-gray-700"
        >
          Nao
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[11px] px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
    >
      Cancelar
    </button>
  )
}
