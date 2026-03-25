'use client'

import { useState } from 'react'

export function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <p className="text-sm text-gray-500 mb-1">Codigo de convite</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-mono font-bold tracking-wider">{code}</span>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Compartilhe com seus clientes para que se cadastrem</p>
    </div>
  )
}
