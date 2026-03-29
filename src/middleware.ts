import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // getSession() reads from cookie (fast, no API call) instead of getUser() (API call ~300ms)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const pathname = request.nextUrl.pathname

  // Sem usuario -> redirect para login
  if (!user) {
    // Clear cached role if user logged out
    if (request.cookies.get('x-role')) {
      supabaseResponse.cookies.set('x-role', '', { maxAge: 0 })
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return redirect(request, '/login')
    }
    if (pathname.startsWith('/portal/dashboard')) {
      return redirect(request, '/portal')
    }
    return supabaseResponse
  }

  // Check cached role cookie first (avoids DB query on every navigation)
  const cachedRole = request.cookies.get('x-role')?.value
  let role: string | null = null
  let onboardingComplete = false

  if (cachedRole && cachedRole !== 'none') {
    // Role is cached — skip DB query
    role = cachedRole
    onboardingComplete = true
  } else if (cachedRole === 'none') {
    // We know there's no profile — allow onboarding
    role = null
    onboardingComplete = false
  } else {
    // First visit or no cache — query DB and cache result
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      role = profile.role
      onboardingComplete = profile.onboarding_complete
      if (onboardingComplete) {
        supabaseResponse.cookies.set('x-role', profile.role, { path: '/', maxAge: 3600 })
      }
    } else {
      supabaseResponse.cookies.set('x-role', 'none', { path: '/', maxAge: 60 })
    }
  }

  // Sem perfil -> permitir acesso ao onboarding e login
  if (!role) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (pathname === '/login' || pathname === '/portal') return supabaseResponse
    return redirect(request, '/login')
  }

  // Onboarding incompleto -> forcar onboarding
  if (!onboardingComplete) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (role === 'clinic_owner') return redirect(request, '/onboarding/clinic')
    return redirect(request, '/onboarding/client')
  }

  // Login inteligente: redirecionar por role
  if (role === 'client') {
    if (pathname === '/login' || pathname === '/portal') return redirect(request, '/portal/dashboard')
    if (pathname.startsWith('/dashboard')) return redirect(request, '/portal/dashboard')
  }

  if (role === 'clinic_owner') {
    if (pathname === '/login' || pathname === '/portal') return redirect(request, '/dashboard')
    if (pathname.startsWith('/portal/dashboard')) return redirect(request, '/dashboard')
  }

  return supabaseResponse
}

function redirect(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login', '/onboarding/:path*'],
}
