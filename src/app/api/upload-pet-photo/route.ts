import { auth } from '@/lib/auth'
import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const petId = formData.get('pet_id') as string || formData.get('petId') as string

  if (!file || !petId) {
    return NextResponse.json({ error: 'Arquivo e petId sao obrigatorios' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'clicapet/pets', public_id: `${petId}-${Date.now()}` },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    await prisma.pet.update({
      where: { id: petId },
      data: { photoUrl: result.secure_url },
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no upload: ' + error.message }, { status: 400 })
  }
}
