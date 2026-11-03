import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Sparkles,
  LogOut,
  Save,
  Shield,
  Mail,
  Calendar,
  Globe,
  Heart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { subscribeUserProfile, updateUserProfileDocument } from '../services/userService'

const AVAILABLE_GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Mystery',
  'Thriller',
  'Adventure',
  'Comedy',
  'Horror',
  'Drama',
]

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Japanese',
  'Italian',
  'Portuguese',
]

export default function ProfilePage() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [favouriteGenres, setFavouriteGenres] = useState([])
  const [bio, setBio] = useState('')

  // UI state
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Subscribe to real-time updates from `profiles/{uid}`
  useEffect(() => {
    if (!currentUser?.uid) return

    const unsubscribe = subscribeUserProfile(
      currentUser.uid,
      (profileData) => {
        if (profileData) {
          setName(profileData.name || currentUser.displayName || '')
          setAge(profileData.age || '')
          setCountry(profileData.country || '')
          setPreferredLanguage(profileData.preferredLanguage || 'English')
          setFavouriteGenres(Array.isArray(profileData.favouriteGenres) ? profileData.favouriteGenres : [])
          setBio(profileData.bio || '')
        } else {
          // Defaults if document not yet created
          setName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Author')
        }
        setIsLoadingProfile(false)
      },
      (err) => {
        setSaveError('Could not load profile from Firestore: ' + (err?.message || 'Permission denied'))
        setIsLoadingProfile(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  // Genre selection toggle
  const toggleGenre = (genre) => {
    setFavouriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess('')

    if (!name.trim()) {
      setSaveError('Please provide your author or full name.')
      return
    }

    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 130)) {
      setSaveError('Please enter a valid age between 1 and 130.')
      return
    }

    setIsSaving(true)

    try {
      await updateUserProfileDocument(currentUser.uid, {
        name,
        age,
        country,
        preferredLanguage,
        favouriteGenres,
        bio,
      })
      setSaveSuccess('Profile updated successfully in Firestore!')
      setTimeout(() => setSaveSuccess(''), 4000)
    } catch (err) {
      setSaveError(err?.message || 'Failed to update profile. Please verify Firestore security rules.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const joinedDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently Joined'

  const authProvider =
    currentUser?.providerData?.[0]?.providerId === 'google.com'
      ? 'Google Sign-In'
      : 'Email & Password'

  if (isLoadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
        <p className="text-white text-sm font-semibold">Loading author profile from Firestore...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Verified Author Account</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Author Profile & Preferences
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize your author persona, demographics, and creative preferences stored in your secure Firestore document.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Author Card & Account Summary (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center flex flex-col items-center shadow-xl">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-1 mb-4 shadow-xl shadow-purple-500/20">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white text-3xl font-extrabold">
              {name ? name.charAt(0).toUpperCase() : <User className="w-10 h-10 text-purple-300" />}
            </div>
          </div>
          <h2 className="text-lg font-bold text-white max-w-[220px] truncate">{name || 'Storyteller'}</h2>
          <p className="text-xs text-slate-400 mb-4 max-w-[220px] truncate">{currentUser?.email}</p>

          <div className="w-full pt-4 border-t border-slate-800 space-y-2.5 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Tier:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Pro Storyteller
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Auth Method:
              </span>
              <span className="text-white font-medium">{authProvider}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Language:
              </span>
              <span className="text-slate-300">{preferredLanguage}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Member Since:
              </span>
              <span className="text-slate-300">{joinedDate}</span>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-mono block truncate">
                UID: {currentUser?.uid}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            type="button"
            className="w-full mt-6 py-2.5 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Column: Edit Profile Form (8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Edit Profile Details
          </h3>

          {saveError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Full Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Pen Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arthur C. Clarke"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="34"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Country & Preferred Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom, Canada, India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Registered Email (Managed by Firebase Auth)
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-slate-400 text-sm cursor-not-allowed font-mono"
              />
            </div>

            {/* Favourite Genres Multi-Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                Favourite Story Genres (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((g) => {
                  const isSelected = favouriteGenres.includes(g)
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Short Bio / Creative Vision
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a sentence or two about your world-building ideas or favorite storytelling tropes..."
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
