import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, User, Mail, Lock, UserPlus, ArrowRight, AlertCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { getFriendlyAuthErrorMessage, logAuthDiagnostic } from '../utils/authErrors'

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const { signup, loginWithGoogle, currentUser, loading, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()

  // If user is already authenticated once auth finished loading, send them directly to dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, loading, navigate])

  // Handle standard registration
  const handleSignup = async (e) => {
    e.preventDefault()
    if (isLoading || isGoogleLoading) return

    setError('')

    const trimmedName = displayName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all the required fields.')
      return
    }

    if (trimmedName.length < 2) {
      setError('Please enter a pen or author name with at least 2 characters.')
      return
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.')
      return
    }

    setIsLoading(true)

    try {
      await signup(trimmedEmail, password, trimmedName)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      logAuthDiagnostic('Email/Password Registration', err)
      const friendlyMessage = getFriendlyAuthErrorMessage(err)
      setError(friendlyMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google sign-in/sign-up
  const handleGoogleSignUp = async () => {
    if (isLoading || isGoogleLoading) return

    setError('')
    setIsGoogleLoading(true)

    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      logAuthDiagnostic('Google Sign-Up', err)
      const friendlyMessage = getFriendlyAuthErrorMessage(err)
      setError(friendlyMessage)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white shadow-lg shadow-purple-500/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create an Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join StorySpark AI to create, save & manage your stories
          </p>
        </div>

        {/* Development Setup Notice if Firebase is not yet configured */}
        {!isFirebaseConfigured && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-amber-200">Firebase Configuration Pending:</strong>
              Your <code className="bg-slate-950 px-1 py-0.5 rounded text-[11px]">.env.local</code> file needs your Firebase project credentials. Fill them in and restart the dev server to authenticate.
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Sign-in/Sign-up */}
        <button
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white font-medium text-sm border border-slate-700/80 transition-all duration-200 cursor-pointer mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign up with Google</span>
        </button>

        {/* Separator */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500 font-medium">
            or register with email
          </span>
          <div className="border-t border-slate-800 w-full"></div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Author / Pen Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Arthur C. Clarke"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/80 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="author@storyspark.ai"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/80 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/80 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/80 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-0.5"
          >
            Sign in <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  )
}
