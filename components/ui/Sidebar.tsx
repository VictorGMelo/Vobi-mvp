'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'

const COLLAPSED_KEY = 'vobi:sidebar:collapsed'

/** Duotone icon — Serviços (clipboard + check) */
function ServicosIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M6 5a2 2 0 0 1 2-2h1.1a2.5 2.5 0 0 1 4.8 0H15a2 2 0 0 1 2 2v1H6V5zm0 2.5h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-12z" />
      <path d="M9.5 3a2.5 2.5 0 1 1 5 0H15a1 1 0 0 1 1 1v1.5H8V4a1 1 0 0 1 1-1h.5zm5.78 8.78a.75.75 0 0 0-1.06-1.06l-3.47 3.47-1.47-1.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4z" />
    </svg>
  )
}

/** Duotone icon — Início (casa) */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M4 10.5l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5z" />
      <path d="M11.36 3.21a1 1 0 0 1 1.28 0l8 6.5a1 1 0 0 1-1.26 1.55L12 5.29l-7.37 5.97a1 1 0 0 1-1.26-1.55l8-6.5zM9.5 14a.5.5 0 0 0-.5.5V21h6v-6.5a.5.5 0 0 0-.5-.5h-5z" />
    </svg>
  )
}

/** Duotone icon — Projetos (pasta) */
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M3 7a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.41.59l1.42 1.41H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M3 10h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" />
    </svg>
  )
}

/** Duotone icon — Clientes (aperto de mão simplificado) */
function HandshakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M2 9l4-3h5l2 2H8l-2 2H4a2 2 0 0 0-2 2v-3zm20 0v3a2 2 0 0 0-2-2h-2l-2-2h5l1 1z" />
      <path d="M12 8l-2 2 3.5 3.5a1.5 1.5 0 0 0 2.12-2.12L14 9l-2-1zm-6.5 3a1.5 1.5 0 0 0 0 2.12L9 16.62a1.5 1.5 0 0 0 2.12-2.12L7.62 11a1.5 1.5 0 0 0-2.12 0zm8 3a1.5 1.5 0 0 0 0 2.12l2 2a1.5 1.5 0 0 0 2.12-2.12l-2-2a1.5 1.5 0 0 0-2.12 0z" />
    </svg>
  )
}

/** Duotone icon — Financeiro (moedas empilhadas) */
function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse opacity="0.35" cx="12" cy="7" rx="8" ry="3" />
      <path d="M4 7v3c0 1.66 3.58 3 8 3s8-1.34 8-3V7c0 1.66-3.58 3-8 3s-8-1.34-8-3zm0 5v3c0 1.66 3.58 3 8 3s8-1.34 8-3v-3c0 1.66-3.58 3-8 3s-8-1.34-8-3zm0 5v2c0 1.66 3.58 3 8 3s8-1.34 8-3v-2c0 1.66-3.58 3-8 3s-8-1.34-8-3z" />
    </svg>
  )
}

/** Duotone icon — Ferramentas (chave + chave de fenda cruzadas) */
function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M14.7 6.3a5 5 0 0 1 6.6 6.6l-2.1-2.1a1 1 0 0 0-1.42 0l-1.58 1.58a1 1 0 0 0 0 1.42l2.1 2.1a5 5 0 0 1-6.6-6.6l2.1 2.1a1 1 0 0 0 1.42 0l1.58-1.58a1 1 0 0 0 0-1.42L14.7 6.3z" />
      <path d="M3.3 17.7l7.07-7.07 2.83 2.83L6.13 20.5a2 2 0 1 1-2.83-2.83zM5 18.5a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
    </svg>
  )
}

/** Duotone icon — Relatórios (lista/linhas) */
function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path opacity="0.35" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
      <circle cx="4.5" cy="7" r="1.25" />
      <circle cx="4.5" cy="12" r="1.25" />
      <circle cx="4.5" cy="17" r="1.25" />
    </svg>
  )
}

const navItems = [
  { label: 'Serviços', href: '/servicos', Icon: ServicosIcon },
]

// Apenas decorativos — não interativos
const mockItems = [
  { label: 'Início', Icon: HomeIcon },
  { label: 'Projetos', Icon: FolderIcon },
  { label: 'Clientes', Icon: HandshakeIcon },
  { label: 'Financeiro', Icon: CoinsIcon },
  { label: 'Ferramentas', Icon: ToolsIcon },
  { label: 'Relatórios', Icon: ListIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSED_KEY)
    if (stored === '1') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      try { window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const effectivelyCollapsed = mounted && collapsed

  return (
    <>
      {/* Topbar mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-white border-b border-vobi-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-vobi-gray hover:text-vobi-dark"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vobi-logo.svg" alt="Vobi" className="h-5 w-auto" />
      </header>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed md:sticky md:top-0 inset-y-0 left-0 z-50 flex flex-col min-h-screen md:h-screen bg-white border-r border-vobi-border shrink-0 transition-[width,transform] duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          effectivelyCollapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 border-b border-vobi-border shrink-0 relative',
          effectivelyCollapsed ? 'justify-center px-2' : 'px-5'
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vobi-logo.svg"
            alt="Vobi"
            className={cn('w-auto transition-all', effectivelyCollapsed ? 'h-5' : 'h-6')}
          />

          {/* Toggle (desktop) */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={effectivelyCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-vobi-border shadow-sm text-vobi-gray hover:text-vobi-primary hover:border-vobi-primary transition-colors items-center justify-center z-10"
          >
            <svg
              className={cn('w-3.5 h-3.5 transition-transform', effectivelyCollapsed ? 'rotate-180' : '')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.25}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 py-4', effectivelyCollapsed ? 'px-2' : 'px-3')}>
          {!effectivelyCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-vobi-gray-light uppercase tracking-widest">
              Menu
            </p>
          )}
          <div className="space-y-1">
            {navItems.map(({ label, href, Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  title={effectivelyCollapsed ? label : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm transition-colors duration-150 relative',
                    effectivelyCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-vobi-primary-light text-vobi-primary font-semibold'
                      : 'text-vobi-gray font-medium hover:bg-vobi-cream hover:text-vobi-dark'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!effectivelyCollapsed && <span>{label}</span>}
                </Link>
              )
            })}
          </div>

          {/* Mock items — apenas decorativos, não clicáveis */}
          <div className="mt-2 pt-3 border-t border-vobi-border/60 space-y-1" aria-hidden="true">
            {mockItems.map(({ label, Icon }) => (
              <div
                key={label}
                title={effectivelyCollapsed ? label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm text-vobi-gray-light/80 select-none cursor-default',
                  effectivelyCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                )}
              >
                <Icon className="w-5 h-5 shrink-0 text-vobi-gray-light" />
                {!effectivelyCollapsed && <span className="font-medium">{label}</span>}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-vobi-border py-3', effectivelyCollapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={handleLogout}
            title={effectivelyCollapsed ? 'Sair' : undefined}
            className={cn(
              'flex items-center w-full rounded-lg text-sm font-medium text-vobi-gray hover:bg-vobi-cream hover:text-vobi-dark transition-colors duration-150',
              effectivelyCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!effectivelyCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
