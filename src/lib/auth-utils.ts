import { auth } from './auth'
import { redirect } from 'next/navigation'

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

export async function requireRole(role: 'clinic_owner' | 'client') {
  const session = await requireAuth()
  if ((session as any).role !== role) redirect('/login')
  return session
}

export function getSessionData(session: any) {
  return {
    userId: session.user.id as string,
    role: session.role as string,
    clinicId: session.clinicId as string | null,
    profileId: session.profileId as string | null,
    onboardingComplete: session.onboardingComplete as boolean,
  }
}
