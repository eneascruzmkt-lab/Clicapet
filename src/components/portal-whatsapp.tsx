'use client'

import { useEffect, useState } from 'react'

export function PortalWhatsApp() {
  const [phone, setPhone] = useState<string | null>(null)
  const [clinicName, setClinicName] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/portal/clinic-info')
      if (!res.ok) return
      const data = await res.json()
      if (data.phone) {
        setPhone(data.phone)
        setClinicName(data.name || '')
      }
    }
    load()
  }, [])

  if (!phone) return null

  const cleanPhone = phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Ola ${clinicName}, estou entrando em contato pelo ClicaPet.`)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors group"
      title={`Falar com ${clinicName} no WhatsApp`}
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      </svg>
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Falar com a clinica
      </span>
    </a>
  )
}
