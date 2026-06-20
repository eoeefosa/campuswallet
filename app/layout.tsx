import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import SwRegister from './sw-register'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CampusWallet - Student Expense Tracker',
  description: 'Track expenses, set budgets, and manage your student wallet',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusWallet',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
