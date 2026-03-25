'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/portal/dashboard', label: 'Meus Pets' },
  { href: '/portal/dashboard/appointments/new', label: 'Agendar' },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/portal')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r min-h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-1">Clicapet</h2>
      <p className="text-xs text-gray-400 mb-6">Portal do Tutor</p>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-md text-sm ${
              pathname === link.href
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto text-sm text-gray-500 hover:text-gray-700"
      >
        Sair
      </button>
    </aside>
  )
}
