'use client'

import { useState } from 'react'
import { formatCpf, validateCpf } from '@/lib/utils/cpf'

interface CpfInputProps {
  name: string
  label: string
  required?: boolean
}

export function CpfInput({ name, label, required }: CpfInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCpf(e.target.value)
    setValue(formatted)
    if (formatted.replace(/\D/g, '').length === 11) {
      setError(validateCpf(formatted) ? '' : 'CPF invalido')
    } else {
      setError('')
    }
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        value={value}
        onChange={handleChange}
        placeholder="000.000.000-00"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
        }`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
