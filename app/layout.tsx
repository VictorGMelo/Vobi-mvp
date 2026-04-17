import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vobi Service — Checklist de Revisão',
  description: 'Revisão técnica padronizada com diagnóstico e resumo por IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans bg-vobi-cream text-vobi-dark`}>
        {children}
      </body>
    </html>
  )
}
