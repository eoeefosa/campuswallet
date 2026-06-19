'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getToken, clearAuth, getStoredUser } from '@/lib/api'
import type { User } from '@/lib/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/expenses', label: 'Expenses', icon: '📋' },
  { href: '/budgets', label: 'Budgets', icon: '🎯' },
  { href: '/wallet', label: 'Wallet', icon: '💳' },
  { href: '/reports', label: 'Reports', icon: '📊' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
    setUser(getStoredUser())
  }, [router])

  function handleLogout() {
    clearAuth()
    router.replace('/login')
  }

  // Always render the same shell on server and client.
  // Auth redirect happens in useEffect — no hydration mismatch.
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-10">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-bold text-green-700">CampusWallet</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div suppressHydrationWarning className="text-xs text-gray-500 mb-1 truncate">{user?.name ?? ''}</div>
          <div suppressHydrationWarning className="text-xs text-gray-400 mb-3 truncate">{user?.school ?? ''}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 flex">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium gap-0.5 transition-colors ${
                active ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
