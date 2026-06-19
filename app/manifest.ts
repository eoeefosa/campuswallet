import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CampusWallet — Student Expense Tracker',
    short_name: 'CampusWallet',
    description: 'Track expenses, set budgets, and manage your student wallet',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f0fdf4',
    theme_color: '#16a34a',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icons/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [],
  }
}
