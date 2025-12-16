import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface FieldErrors {
  email?: string
  password?: string
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return undefined
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required'
  }
  return undefined
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }))
    }
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))
    } else if (field === 'password') {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password)
    }
    setFieldErrors(errors)
    setTouched({ email: true, password: true })
    return !errors.email && !errors.password
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      navigate(redirectTo)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
  }

  const getInputClassName = (field: keyof FieldErrors) => {
    const base =
      'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
    if (touched[field] && fieldErrors[field]) {
      return `${base} border-red-300 bg-red-50`
    }
    return `${base} border-gray-300`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
          &larr; Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-600 mb-6">Sign in to create and manage meetings</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                className={getInputClassName('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                className={getInputClassName('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link
              to={`/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
