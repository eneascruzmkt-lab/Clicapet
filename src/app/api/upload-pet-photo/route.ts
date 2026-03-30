import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const petId = formData.get('pet_id') as string

  if (!file || !petId) return NextResponse.json({ error: 'Arquivo e pet_id obrigatorios' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${petId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('pet-photos')
    .upload(fileName, file, { upsert: true })

  if (uploadError) return NextResponse.json({ error: 'Erro no upload: ' + uploadError.message }, { status: 400 })

  const { data: urlData } = supabase.storage
    .from('pet-photos')
    .getPublicUrl(fileName)

  // Salvar URL na tabela pets (coluna photo_url)
  const { error: updateError } = await supabase
    .from('pets')
    .update({ photo_url: urlData.publicUrl })
    .eq('id', petId)

  if (updateError) return NextResponse.json({ error: 'Erro ao salvar: ' + updateError.message }, { status: 400 })

  return NextResponse.json({ url: urlData.publicUrl })
}
