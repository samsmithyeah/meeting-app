import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthButton() {
  const { user, displayName, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-gray-700 text-sm hidden sm:inline">{displayName}</span>
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  const redirectParam =
    location.pathname !== '/' ? `?redirect=${encodeURIComponent(location.pathname)}` : ''

  return (
    <Link
      to={`/login${redirectParam}`}
      className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
    >
      Sign In
    </Link>
  )
}
