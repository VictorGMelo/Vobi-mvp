import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'
import { TopHeader } from '@/components/ui/TopHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-vobi-cream">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          userName={profile?.full_name ?? null}
          userEmail={profile?.email ?? session.user.email ?? null}
        />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </main>
    </div>
  )
}
