'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SPECIES = [
  { value: 'Cao', label: 'Cao', emoji: '🐕' },
  { value: 'Gato', label: 'Gato', emoji: '🐈' },
  { value: 'Ave', label: 'Ave', emoji: '🐦' },
  { value: 'Roedor', label: 'Roedor', emoji: '🐹' },
  { value: 'Reptil', label: 'Reptil', emoji: '🦎' },
  { value: 'Outro', label: 'Outro', emoji: '🐾' },
]

export default function NewPetPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [species, setSpecies] = useState('')
  const [sex, setSex] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!species) {
      setError('Selecione a especie do pet')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const body = {
      name: formData.get('name'),
      species,
      breed: formData.get('breed') || null,
      birth_date: formData.get('birth_date') || null,
      sex: sex || null,
      color: formData.get('color') || null,
    }

    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar pet')
        setLoading(false)
        return
      }

      // Upload foto se tiver
      const file = fileInputRef.current?.files?.[0]
      if (file && data.pet?.id) {
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('pet_id', data.pet.id)
        await fetch('/api/upload-pet-photo', { method: 'POST', body: uploadData })
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/portal/dashboard/meu-pet')
        router.refresh()
      }, 1200)
    } catch {
      setError('Erro de conexao')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Pet cadastrado!</h2>
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Cadastrar pet</h1>
      <p className="text-sm text-gray-400 mb-6">Adicione as informacoes do seu companheiro</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Foto + Nome lado a lado */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start gap-5">
            {/* Foto */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-200" />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors"
                >
                  <svg className="w-7 h-7 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                  <span className="text-[10px]">Foto</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
            </div>

            {/* Nome + Raca */}
            <div className="flex-1 space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do pet</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Rex, Luna, Thor..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-medium"
                />
              </div>
              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">Raca <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  id="breed"
                  name="breed"
                  type="text"
                  placeholder="Ex: Golden Retriever, Siames..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Especie — cards visuais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Especie</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SPECIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSpecies(s.value)}
                className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all ${
                  species === s.value
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl mb-1">{s.emoji}</span>
                <span className={`text-xs font-medium ${species === s.value ? 'text-amber-700' : 'text-gray-600'}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sexo + Nascimento + Cor — linha compacta */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Detalhes <span className="text-gray-400 font-normal">(opcional)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sexo toggle */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Sexo</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSex(sex === 'M' ? '' : 'M')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${
                    sex === 'M' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span className="text-lg">♂</span>
                  <span className="text-xs font-medium">Macho</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSex(sex === 'F' ? '' : 'F')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${
                    sex === 'F' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span className="text-lg">♀</span>
                  <span className="text-xs font-medium">Femea</span>
                </button>
              </div>
            </div>

            {/* Nascimento */}
            <div>
              <label htmlFor="birth_date" className="block text-xs text-gray-500 mb-2">Nascimento</label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Cor */}
            <div>
              <label htmlFor="color" className="block text-xs text-gray-500 mb-2">Cor</label>
              <input
                id="color"
                name="color"
                type="text"
                placeholder="Caramelo, Branco..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm text-base"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar pet'}
        </button>
      </form>
    </div>
  )
}
