'use client'

import { useState } from 'react'
import { formatPhone } from '@/lib/utils/masks'

interface PhoneInputProps {
  name: string
  label: string
  required?: boolean
  defaultValue?: string
}

export function PhoneInput({ name, label, required, defaultValue }: PhoneInputProps) {
  const [value, setValue] = useState(defaultValue ? formatPhone(defaultValue) : '')

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="tel"
        required={required}
        value={value}
        onChange={(e) => setValue(formatPhone(e.target.value))}
        placeholder="(99) 99999-9999"
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
