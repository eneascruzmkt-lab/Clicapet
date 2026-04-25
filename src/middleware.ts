import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const pathname = nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/login', '/portal', '/verify-email']
  const isPublic = publicRoutes.some(route => pathname === route)
  const isAuthApi = pathname.startsWith('/api/auth')
  const isCronApi = pathname.startsWith('/api/cron')

  if (isPublic || isAuthApi || isCronApi) return NextResponse.next()

  // No session → login
  if (!session?.user) {
    if (pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal', nextUrl))
    }
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  const role = (session as any).role
  const onboardingComplete = (session as any).onboardingComplete

  // No profile yet → allow onboarding
  if (!role) {
    if (pathname.startsWith('/onboarding')) return NextResponse.next()
    if (pathname === '/login' || pathname === '/portal') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Onboarding not complete
  if (!onboardingComplete) {
    if (pathname.startsWith('/onboarding')) return NextResponse.next()
    const onboardingPath = role === 'clinic_owner' ? '/onboarding/clinic' : '/onboarding/client'
    return NextResponse.redirect(new URL(onboardingPath, nextUrl))
  }

  // Role-based access
  if (role === 'client') {
    if (pathname === '/portal') return NextResponse.redirect(new URL('/portal/dashboard', nextUrl))
    if (pathname.startsWith('/dashboard')) return NextResponse.redirect(new URL('/portal/dashboard', nextUrl))
  }

  if (role === 'clinic_owner') {
    if (pathname === '/login') return NextResponse.redirect(new URL('/dashboard', nextUrl))
    if (pathname.startsWith('/portal/dashboard')) return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
