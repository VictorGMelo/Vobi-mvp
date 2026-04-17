'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface TopHeaderProps {
  userName: string | null
  userEmail: string | null
}

const SEGMENT_LABELS: Record<string, string> = {
  servicos: 'Serviços',
  novo: 'Novo serviço',
  resumo: 'Resumo',
}

function isIdSegment(s: string) {
  // UUID or nanoid-like tokens
  return /^[0-9a-f-]{8,}$/i.test(s) && s.length >= 12
}

function getInitials(name: string | null, email: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || '').trim()
  if (!source) return '?'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function TopHeader({ userName, userEmail }: TopHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const segments = pathname.split('/').filter(Boolean).filter((s) => !isIdSegment(s))
  const crumbs = segments.map((s) => SEGMENT_LABELS[s] ?? s)
  const initials = getInitials(userName, userEmail)
  const displayName = userName?.trim() || userEmail || 'Usuário'

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-14 items-center justify-between gap-4 px-6 bg-white border-b border-vobi-border">
      <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
        {crumbs.length === 0 ? (
          <span className="text-vobi-dark font-semibold">Início</span>
        ) : crumbs.map((label, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span key={i} className="flex items-center gap-2 min-w-0">
              {i > 0 && (
                <svg className="w-3.5 h-3.5 text-vobi-gray-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              <span
                className={cn(
                  'truncate',
                  isLast ? 'text-vobi-primary font-semibold' : 'text-vobi-gray'
                )}
              >
                {label}
              </span>
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          aria-label="Notificações"
          className="relative w-9 h-9 rounded-full text-vobi-gray hover:text-vobi-dark hover:bg-vobi-cream transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            1
          </span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu do usuário"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-vobi-primary to-indigo-600 text-white text-xs font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-white border border-vobi-border rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-vobi-border">
                <p className="text-sm font-semibold text-vobi-dark truncate">{displayName}</p>
                {userEmail && userName && (
                  <p className="text-xs text-vobi-gray truncate mt-0.5">{userEmail}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-vobi-gray hover:bg-vobi-cream hover:text-vobi-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
