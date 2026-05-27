import { Sidebar } from '@/components/dashboard/sidebar'
import { XPProvider } from '@/contexts/xp-context'
import { XPToastStack } from '@/components/xp-toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <XPProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        {/* pt-14 on mobile to clear the fixed top bar; md:pt-0 because sidebar is static there */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
      <XPToastStack />
    </XPProvider>
  )
}
