import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email já verificado' }, { status: 400 })
    }

    await prisma.verificationCode.deleteMany({ where: { email } })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    })

    await getResend().emails.send({
      from: 'ClicaPet <noreply@clicapet.com>',
      to: email,
      subject: 'Novo código de verificação - ClicaPet',
      html: `<p>Seu novo código de verificação é: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`,
    })

    return NextResponse.json({ message: 'Novo código enviado' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao reenviar código' }, { status: 500 })
  }
}
