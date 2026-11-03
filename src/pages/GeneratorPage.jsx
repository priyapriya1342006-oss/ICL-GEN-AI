import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Wand2,
  BookOpen,
  Users,
  Film,
  Lightbulb,
  Copy,
  CheckCircle2,
  Bookmark,
  RotateCcw,
  AlertCircle,
  Info,
  Globe,
  Sliders,
  ChevronRight,
  Feather,
  LogIn,
  Check,
  Cpu,
} from 'lucide-react'
import { generateDemoContent } from '../services/demoStoryGenerator'
import { generateStoryWithAI } from '../services/aiService'
import { useAuth } from '../context/useAuth'
import { saveStory } from '../services/storyService'
import { recordGenerationHistory } from '../services/historyService'

// The 5 creative modes
const CREATIVE_MODES = [
  {
    id: 'idea',
    name: 'Story Idea Generator',
    shortName: 'Story Ideas',
    icon: Lightbulb,
    color: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Brainstorm unexpected premises, central dilemmas, hooks, and twists.',
    placeholder: 'E.g., A clockmaker discovers a gear that turns time backward only by three minutes...',
  },
  {
    id: 'full_story',
    name: 'Full Story Generator',
    shortName: 'Full Story',
    icon: Wand2,
    color: 'text-pink-400',
    accentBorder: 'border-pink-500/40',
    badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    description: 'Immerse readers in complete narrative prose with rich atmospheres and dialogue.',
    placeholder: 'E.g., Two rival astronomers witness an eclipse that reveals an ancient constellation...',
  },
  {
    id: 'script',
    name: 'Script Generator',
    shortName: 'Screenplay / Script',
    icon: Film,
    color: 'text-teal-400',
    accentBorder: 'border-teal-500/40',
    badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    description: 'Generate formatted film/TV scenes with sluglines, action lines, and dialogue.',
    placeholder: 'E.g., INT. SUBMARINE COMMAND ROOM - CRISIS: Sonar detects an uncharted trench door opening...',
  },
  {
    id: 'character',
    name: 'Character Generator',
    shortName: 'Character Forge',
    icon: Users,
    color: 'text-purple-400',
    accentBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Craft unforgettable characters with archetypes, fatal flaws, backstories, and quirks.',
    placeholder: 'E.g., A cynical cybernetic doctor who secretly runs an underground shelter for rogue synthetics...',
  },
  {
    id: 'plot',
    name: 'Plot and Outline Generator',
    shortName: 'Plot & Outlines',
    icon: BookOpen,
    color: 'text-indigo-400',
    accentBorder: 'border-indigo-500/40',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    description: 'Structure a compelling 3-Act arc with inciting incidents, midpoints, and climaxes.',
    placeholder: 'E.g., A deep-sea mining expedition uncovers a sunken temple that mirrors the city directly above it...',
  },
]

// Genres
const GENRES = [
  'Fantasy',
  'Romance',
  'Mystery',
  'Thriller',
  'Adventure',
  'Comedy',
  'Horror',
  'Sci-Fi',
  'Drama',
]

// Languages
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

// Tones
const TONES = [
  'Emotional',
  'Funny',
  'Dark',
  'Inspiring',
  'Suspenseful',
  'Whimsical',
  'Epic & Dramatic',
]

// Lengths
const LENGTHS = [
  'Quick Spark (~250 words)',
  'Standard (~500 words)',
  'Extended (~1,000 words)',
  'In-Depth Scene (~1,500+ words)',
]

// Quick starter inspiration prompts
const QUICK_PROMPTS = {
  idea: [
    'A library where books rewrite themselves based on who is reading them.',
    'A city where shadows belong to people who died a century ago.',
    'A mirror that shows what your closest friend is thinking right now.',
  ],
  full_story: [
    'The night the northern lights began whispering lost names across the tundra.',
    'A quiet tea shop at the edge of the universe that only appears during rainstorms.',
  ],
  script: [
    'INT. ORBITAL STATION - MIDNIGHT: A routine maintenance bot refuses to open the airlock.',
    'EXT. RAIN-SLICK ALLEY - NIGHT: A private investigator meets their client under flickering neon.',
  ],
  character: [
    'An immortal archivist who has forgotten their own original homeland.',
    'A brilliant lockpicker who refuses to steal anything worth more than one coin.',
  ],
  plot: [
    'A detective investigating a murder discovers the victim left clues intended only for them.',
    'An expedition across a desert that shifts geography every full moon.',
  ],
}

export default function GeneratorPage() {
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()

  // Initialize mode from query param
  const getInitialMode = () => {
    const modeParam = searchParams.get('mode')
    if (modeParam) {
      const normalized = modeParam.toLowerCase()
      if (normalized.includes('idea')) return 'idea'
      if (normalized.includes('plot')) return 'plot'
      if (normalized.includes('character')) return 'character'
      if (normalized.includes('script') || normalized.includes('screenplay')) return 'script'
      if (normalized.includes('stori') || normalized.includes('story')) return 'full_story'
    }
    return 'idea'
  }

  const [selectedMode, setSelectedMode] = useState(getInitialMode)
  const [genre, setGenre] = useState(GENRES[0])
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [tone, setTone] = useState(TONES[0])
  const [length, setLength] = useState(LENGTHS[1])
  const [prompt, setPrompt] = useState('')
  const [validationError, setValidationError] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState('')
  const [isRealAI, setIsRealAI] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generationError, setGenerationError] = useState('')

  // Firestore saving states
  const [isSaving, setIsSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState(null)

  const activeMode = CREATIVE_MODES.find((m) => m.id === selectedMode) || CREATIVE_MODES[0]

  // Main Generation Handler (Calls real AI backend if authenticated)
  const handleGenerate = async (e) => {
    if (e) e.preventDefault()
    if (isGenerating) return

    if (!prompt.trim()) {
      setValidationError('Please enter an idea or prompt before generating.')
      return
    }

    if (prompt.trim().length < 5) {
      setValidationError('Your prompt is a bit too short. Give at least a few words to spark the story.')
      return
    }

    setValidationError('')
    setGenerationError('')
    setIsGenerating(true)
    setGeneratedStory('')
    setSaveFeedback(null)

    // Check if user is signed in
    if (!currentUser) {
      // Allow guest to generate with demo preview with an invitation to sign in
      setTimeout(() => {
        const demoResult = generateDemoContent({
          mode: selectedMode,
          prompt,
          genre,
          language,
          tone,
          length,
        })
        setGeneratedStory(demoResult)
        setIsRealAI(false)
        setIsGenerating(false)
      }, 900)
      return
    }

    // Authenticated user: Call real backend endpoint
    try {
      const idToken = await currentUser.getIdToken()

      const result = await generateStoryWithAI({
        idToken,
        mode: selectedMode,
        prompt: prompt.trim(),
        genre,
        language,
        tone,
        length,
      })

      setGeneratedStory(result.content)
      setIsRealAI(true)

      // Record in generationHistory collection with status: 'success'
      try {
        await recordGenerationHistory({
          userId: currentUser.uid,
          prompt: prompt.trim(),
          mode: selectedMode,
          genre,
          language,
          tone,
          status: 'success',
        })
      } catch (histErr) {
        console.warn('History logging notice:', histErr?.message)
      }
    } catch (err) {
      console.warn('[Generator] Real AI call failed:', err?.message)
      setGenerationError(err?.message || 'Failed to communicate with AI engine.')

      // Provide demo fallback so the user can continue testing
      const fallbackResult = generateDemoContent({
        mode: selectedMode,
        prompt,
        genre,
        language,
        tone,
        length,
      })
      setGeneratedStory(fallbackResult)
      setIsRealAI(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generatedStory) return
    navigator.clipboard.writeText(generatedStory)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // Save story to Firestore `stories` collection
  const handleSaveToFirestore = async () => {
    if (!generatedStory) return

    if (!currentUser) {
      setSaveFeedback({
        type: 'auth_required',
        message: 'Please sign in or create an account to save stories to your personal library.',
      })
      return
    }

    setIsSaving(true)
    setSaveFeedback(null)

    try {
      const titlePrompt = prompt.slice(0, 36) + (prompt.length > 36 ? '...' : '')
      const title = `${activeMode.shortName}: ${titlePrompt}`

      await saveStory({
        userId: currentUser.uid,
        title,
        content: generatedStory,
        mode: selectedMode,
        genre,
        language,
        tone,
        isFavourite: false,
        isDemo: !isRealAI,
      })

      setSaveFeedback({
        type: 'success',
        message: 'Story successfully saved to your Cloud Story Vault! You can view it on your Dashboard.',
      })
    } catch (err) {
      console.error('[StorySpark AI] Save error:', err)
      setSaveFeedback({
        type: 'error',
        message: err?.message || 'Failed to save story to Firestore. Please verify Firestore rules.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const wordCount = generatedStory
    ? generatedStory
        .replace(/\[DEMO PREVIEW[^\]]*\]/g, '')
        .split(/\s+/)
        .filter(Boolean).length
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>StorySpark AI Creation Studio (Google Gemini Engine)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI Story Generator
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-3xl">
          Powered by Google Gemini. Select a creative mode, choose custom parameters, and ignite cinematic stories, plots, and characters.
        </p>
      </div>

      {/* 5 Creative Modes Tab Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {CREATIVE_MODES.map((mode) => {
          const Icon = mode.icon
          const isSelected = selectedMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setSelectedMode(mode.id)
                setValidationError('')
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${mode.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {mode.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {mode.shortName}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Workspace: Controls Left & Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm space-y-5"
          >
            {/* Active Mode Banner */}
            <div className={`p-3 rounded-xl border ${activeMode.badgeBg} flex items-start gap-2.5`}>
              <Info className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
              <p className="text-xs leading-relaxed">
                <strong>{activeMode.name}:</strong> {activeMode.description}
              </p>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Generation Error Banner (with fallback explanation) */}
            {generationError && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold text-amber-200">Backend AI Engine Notice:</p>
                  <p>{generationError}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Showing demo fallback output while the backend server or API key is being configured.
                  </p>
                </div>
              </div>
            )}

            {/* Prompt Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-purple-400" />
                  Your Story Idea or Prompt <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {prompt.length} / 1200 chars
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={1200}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  if (validationError) setValidationError('')
                }}
                placeholder={activeMode.placeholder}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 resize-none transition-colors"
              />
            </div>

            {/* Quick Inspiration Sparks */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Try a quick inspiration spark:
              </p>
              <div className="space-y-1.5">
                {(QUICK_PROMPTS[selectedMode] || []).map((quick, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPrompt(quick)
                      setValidationError('')
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer line-clamp-1 flex items-center justify-between group"
                  >
                    <span>"{quick}"</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selectors Grid: Genre, Language, Tone, Length */}
            <div className="pt-2 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Story Settings & Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tone & Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Target Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {LENGTHS.map((len) => (
                      <option key={len} value={len}>
                        {len}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate {activeMode.shortName}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output Canvas & Save Actions (7 cols) */}
        <div className="lg:col-span-7">
          <div className="min-h-[560px] rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Header Action Bar */}
            <div className="px-3.5 sm:px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${activeMode.badgeBg}`}>
                  {activeMode.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {wordCount > 0 ? `${wordCount} words` : 'Ready to generate'}
                </span>
              </div>

              {/* Action Buttons: Copy, Regenerate, Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!generatedStory || isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 text-xs font-medium text-slate-200 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 text-xs font-medium text-slate-200 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Regenerate story with current parameters"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToFirestore}
                  disabled={!generatedStory || isGenerating || isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Save story to Firestore database"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveFeedback?.type === 'success' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Story</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Save Feedback Alerts */}
            {saveFeedback && (
              <div
                className={`px-5 py-3 border-b text-xs flex items-center justify-between gap-3 animate-fade-in ${
                  saveFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : saveFeedback.type === 'auth_required'
                    ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                    : 'bg-red-950/60 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {saveFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                  {saveFeedback.type === 'auth_required' && <Info className="w-4 h-4 shrink-0 text-amber-400" />}
                  {saveFeedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                  <span>{saveFeedback.message}</span>
                </div>

                {saveFeedback.type === 'auth_required' ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </Link>
                ) : (
                  <button
                    onClick={() => setSaveFeedback(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

            {/* Story Display Canvas */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {isGenerating ? (
                /* Loading State Animation */
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Composing with Google Gemini...
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Harmonizing {genre} conventions with a {tone.toLowerCase()} style in {language}.
                  </p>
                </div>
              ) : generatedStory ? (
                /* Story Content Output */
                <div className="space-y-4">
                  {/* Status Badge: Real AI vs Demo Preview */}
                  {isRealAI ? (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                      <p className="leading-relaxed">
                        <strong>Generated by Google Gemini AI:</strong> This content was generated by Gemini 2.5 Flash via our secure backend.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Demo Preview Output:</strong> To generate with live Gemini AI, run the backend server and ensure you are signed in.
                      </p>
                    </div>
                  )}

                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-slate-200 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line shadow-inner">
                    {generatedStory}
                  </div>
                </div>
              ) : (
                /* Empty Canvas State */
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4 shadow-md">
                    <Wand2 className="w-8 h-8 text-purple-400 opacity-60" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300 mb-1">
                    Your Story Canvas is Empty
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                    Select a mode, write an idea in the box or click one of the quick prompts, then press <strong>Generate {activeMode.shortName}</strong>.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Google Gemini 2.5 Flash Connected</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
