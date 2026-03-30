'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
  birth_date: string | null
  sex: string | null
  color: string | null
}

export function PetActions({ pet }: { pet: Pet }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(pet.name)
  const [species, setSpecies] = useState(pet.species)
  const [breed, setBreed] = useState(pet.breed || '')
  const [birthDate, setBirthDate] = useState(pet.birth_date || '')
  const [sex, setSex] = useState(pet.sex || '')
  const [color, setColor] = useState(pet.color || '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(pet.photo_url)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleEdit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/pets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pet.id, name, species, breed, birth_date: birthDate, sex, color }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao atualizar')
      setLoading(false)
      return
    }

    // Upload foto se mudou
    const file = fileInputRef.current?.files?.[0]
    if (file) {
      setUploadingPhoto(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('pet_id', pet.id)
      await fetch('/api/upload-pet-photo', { method: 'POST', body: fd })
      setUploadingPhoto(false)
    }

    setShowEdit(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const res = await fetch('/api/pets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pet.id }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao excluir')
      setLoading(false)
      return
    }

    router.push('/portal/dashboard/meu-pet')
    router.refresh()
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-medium rounded-lg hover:bg-white/30 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="px-3 py-1.5 bg-red-500/20 backdrop-blur text-white text-xs font-medium rounded-lg hover:bg-red-500/40 transition-colors"
        >
          Excluir
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEdit(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Editar pet</h2>

            <div className="space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Pet" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-200" />
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-amber-600 hover:underline"
                >
                  {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="Cao">Cao</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Roedor">Roedor</option>
                  <option value="Reptil">Reptil</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raca <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo <span className="text-gray-400 font-normal">(opcional)</span></label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="M">Macho</option>
                  <option value="F">Femea</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ex: Caramelo, Preto e branco..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleEdit}
                  disabled={loading || uploadingPhoto}
                  className="flex-1 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {uploadingPhoto ? 'Enviando foto...' : loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2.5 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDelete(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir {pet.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Isso vai remover o pet e todo seu historico. Esta acao nao pode ser desfeita.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
