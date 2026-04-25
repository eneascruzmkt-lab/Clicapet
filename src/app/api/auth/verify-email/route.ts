import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })

    await prisma.verificationCode.deleteMany({
      where: { email },
    })

    return NextResponse.json({ message: 'Email verificado com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar email' }, { status: 500 })
  }
}
