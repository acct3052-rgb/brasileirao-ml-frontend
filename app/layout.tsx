import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { LeagueSidebar } from '@/components/layout/LeagueSidebar'
import { LeagueProvider } from '@/lib/league-context'
import { ChatWidget } from '@/components/ui/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Brasileirão ML — Predições',
  description: 'Predições de resultados do Campeonato Brasileiro com Machine Learning',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <LeagueProvider>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
              <LeagueSidebar />
              <main className="flex-1 min-w-0">
                {children}
              </main>
            </div>
            <ChatWidget />
          </LeagueProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
