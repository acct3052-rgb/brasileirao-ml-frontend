'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import { RetrainButton } from '@/components/admin/RetrainButton'
import { SyncResultsButton } from '@/components/admin/SyncResultsButton'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/historico', label: 'Histórico' },
  { href: '/value-bets', label: 'Value Bets' },
  { href: '/apostas', label: 'Minhas Apostas' },
  { href: '/times', label: 'Times' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-primary">
          <BarChart3 className="w-5 h-5" />
          <span>Brasileirão ML</span>
        </div>
        <nav className="flex gap-1 flex-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <SyncResultsButton />
        <RetrainButton />
      </div>
    </header>
  )
}
