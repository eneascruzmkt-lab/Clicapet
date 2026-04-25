import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, name } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    })

    await getResend().emails.send({
      from: 'ClicaPet <noreply@clicapet.com>',
      to: email,
      subject: 'Código de verificação - ClicaPet',
      html: `<p>Seu código de verificação é: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`,
    })

    return NextResponse.json({ message: 'Código enviado para o email' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
