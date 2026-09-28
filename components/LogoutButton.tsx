// components/LogoutButton.tsx

'use client'

import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  variant?: 'default' | 'purple' | 'blue' | 'green'
}

export default function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const getStyles = () => {
    switch (variant) {
      case 'purple':
        return 'bg-purple-600 text-white hover:bg-purple-700'
      case 'blue':
        return 'bg-blue-700 text-white hover:bg-blue-800'
      case 'green':
        return 'bg-emerald-700 text-white hover:bg-emerald-800'
      default:
        return 'bg-red-500 text-white hover:bg-red-600'
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg transition ${getStyles()}`}
    >
      Logout
    </button>
  )
}