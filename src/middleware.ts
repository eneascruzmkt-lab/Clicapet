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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Sem usuario -> redirect para login
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      return redirect(request, '/login')
    }
    if (pathname.startsWith('/portal/dashboard')) {
      return redirect(request, '/portal')
    }
    return supabaseResponse
  }

  // Usuario logado -> buscar perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  // Sem perfil -> permitir acesso ao onboarding e login
  if (!profile) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (pathname === '/login' || pathname === '/portal') return supabaseResponse
    return redirect(request, '/login')
  }

  // Onboarding incompleto -> forcar onboarding
  if (!profile.onboarding_complete) {
    if (pathname.startsWith('/onboarding')) return supabaseResponse
    if (profile.role === 'clinic_owner') return redirect(request, '/onboarding/clinic')
    return redirect(request, '/onboarding/client')
  }

  // Login inteligente: redirecionar por role
  if (profile.role === 'client') {
    if (pathname === '/login' || pathname === '/portal') return redirect(request, '/portal/dashboard')
    if (pathname.startsWith('/dashboard')) return redirect(request, '/portal/dashboard')
  }

  if (profile.role === 'clinic_owner') {
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
