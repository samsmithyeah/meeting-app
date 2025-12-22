import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../components/GoogleIcon'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validateName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Name is required'
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters'
  }
  return undefined
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
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return undefined
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return undefined
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp, signInWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'
  const passwordStrength = getPasswordStrength(password)

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (touched.name) {
      setFieldErrors((prev) => ({ ...prev, name: validateName(value) }))
    }
  }

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
    if (touched.confirmPassword && confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, confirmPassword)
      }))
    }
  }

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(password, value)
      }))
    }
  }

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'name') {
      setFieldErrors((prev) => ({ ...prev, name: validateName(name) }))
    } else if (field === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))
    } else if (field === 'password') {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))
    } else if (field === 'confirmPassword') {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(password, confirmPassword)
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword)
    }
    setFieldErrors(errors)
    setTouched({ name: true, email: true, password: true, confirmPassword: true })
    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    const { data, error } = await signUp(email, password, name.trim())

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else if (data.session) {
      // User is automatically signed in when email confirmation is disabled
      navigate(redirectTo)
    } else {
      // Email confirmation is required
      setSuccess('Check your email to confirm your account, then sign in.')
      setIsLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">Sign up to create and manage meetings</p>

          {error && (
            <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                onBlur={() => handleBlur('name')}
                className={getInputClassName('name')}
                placeholder="Your name"
                autoComplete="name"
              />
              {touched.name && fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

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
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={getInputClassName('confirmPassword')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
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
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link
              to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
