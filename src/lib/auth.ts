import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { profile: true },
        })

        if (!user) return null
        if (!user.emailVerified) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          role: user.profile?.role ?? null,
          clinicId: user.profile?.clinicId ?? null,
          profileId: user.profile?.id ?? null,
          onboardingComplete: user.profile?.onboardingComplete ?? false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.clinicId = (user as any).clinicId
        token.profileId = (user as any).profileId
        token.onboardingComplete = (user as any).onboardingComplete
      }
      // Allow updating session data (e.g., after onboarding completes)
      if (trigger === 'update' && session) {
        token.role = session.role ?? token.role
        token.clinicId = session.clinicId ?? token.clinicId
        token.profileId = session.profileId ?? token.profileId
        token.onboardingComplete = session.onboardingComplete ?? token.onboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      ;(session as any).role = token.role
      ;(session as any).clinicId = token.clinicId
      ;(session as any).profileId = token.profileId
      ;(session as any).onboardingComplete = token.onboardingComplete
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
