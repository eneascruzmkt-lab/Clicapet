import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const userId = session.user.id

  const body = await request.json()

  const clinic = await prisma.clinic.findFirst({
    where: { userId },
    select: { id: true },
  })

  if (!clinic) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 400 })

  try {
    // Montar o conteudo da prescricao a partir dos campos enviados
    const contentParts: string[] = []
    if (body.medication) contentParts.push(`Medicamento: ${body.medication}`)
    if (body.dosage) contentParts.push(`Dosagem: ${body.dosage}`)
    if (body.frequency) contentParts.push(`Frequencia: ${body.frequency}`)
    if (body.duration) contentParts.push(`Duracao: ${body.duration}`)
    if (body.instructions) contentParts.push(`Instrucoes: ${body.instructions}`)

    const content = body.content || contentParts.join('\n') || ''

    const prescription = await prisma.prescription.create({
      data: {
        petId: body.pet_id,
        clinicId: clinic.id,
        content,
        vetName: body.vet_name || null,
      },
    })

    return NextResponse.json({ prescription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
