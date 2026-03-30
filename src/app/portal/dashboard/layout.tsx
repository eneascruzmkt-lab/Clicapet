import { PortalSidebar } from '@/components/portal-sidebar'
import { PortalWhatsApp } from '@/components/portal-whatsapp'

export default function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-teal-50/20">
      <PortalSidebar />
      <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-8">{children}</main>
      <PortalWhatsApp />
    </div>
  )
}
