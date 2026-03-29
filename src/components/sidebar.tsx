'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/clients', label: 'Clientes' },
  { href: '/dashboard/calendario', label: 'Calendario' },
  { href: '/dashboard/financeiro', label: 'Financeiro' },
  { href: '/dashboard/lembretes', label: 'Lembretes' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r min-h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-6">Clicapet</h2>
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
