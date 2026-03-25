import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clicapet - Gestão Veterinária',
  description: 'Sistema de gestão para clínicas veterinárias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
