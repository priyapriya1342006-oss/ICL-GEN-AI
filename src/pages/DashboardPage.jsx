import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Wand2,
  Trash2,
  Copy,
  CheckCircle2,
  PlusCircle,
  Heart,
  Sparkles,
  User,
  History,
  Eye,
  X,
  Globe,
  Compass,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { subscribeUserStories, deleteStory, toggleFavouriteStory } from '../services/storyService'
import { subscribeUserHistory } from '../services/historyService'
import { subscribeUserProfile } from '../services/userService'

export default function DashboardPage() {
  const { currentUser } = useAuth()

  // Real-time Firestore state
  const [userProfile, setUserProfile] = useState(null)
  const [stories, setStories] = useState([])
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // UI state
  const [activeTab, setActiveTab] = useState('stories') // 'stories' | 'favourites' | 'history'
  const [selectedStoryForModal, setSelectedStoryForModal] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [actionNotice, setActionNotice] = useState('')

  // 1. Subscribe to User Profile `profiles/{uid}`
  useEffect(() => {
    if (!currentUser?.uid) return
    const unsubscribe = subscribeUserProfile(
      currentUser.uid,
      (profileData) => {
        setUserProfile(profileData)
      },
      (err) => console.warn('Profile listener notice:', err?.message)
    )
    return () => unsubscribe()
  }, [currentUser])

  // 2. Subscribe to Saved Stories `stories` where userId == currentUser.uid
  useEffect(() => {
    if (!currentUser?.uid) return
    const unsubscribe = subscribeUserStories(
      currentUser.uid,
      (storiesData) => {
        setStories(storiesData)
        setIsLoading(false)
      },
      (err) => {
        console.warn('Stories listener notice:', err?.message)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [currentUser])

  // 3. Subscribe to Generation History `generationHistory` where userId == currentUser.uid
  useEffect(() => {
    if (!currentUser?.uid) return
    const unsubscribe = subscribeUserHistory(
      currentUser.uid,
      (historyData) => {
        setHistoryItems(historyData)
      },
      (err) => console.warn('History listener notice:', err?.message)
    )
    return () => unsubscribe()
  }, [currentUser])

  const authorName =
    userProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Storyteller'

  // Actions
  const handleToggleFavourite = async (story) => {
    try {
      await toggleFavouriteStory(story.id, story.isFavourite)
      setActionNotice(story.isFavourite ? 'Removed from favourites.' : 'Added to favourites!')
      setTimeout(() => setActionNotice(''), 2500)
    } catch (err) {
      console.error('Failed to toggle favourite:', err)
    }
  }

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story from your library?')) return
    try {
      await deleteStory(storyId)
      setActionNotice('Story deleted from your library.')
      setTimeout(() => setActionNotice(''), 2500)
    } catch (err) {
      console.error('Failed to delete story:', err)
    }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const favouriteStories = stories.filter((s) => s.isFavourite)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Authenticated Creator Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            Welcome, {authorName}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explore your real-time cloud library, review your favourite drafts, and track generation history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <User className="w-4 h-4 text-purple-400" />
            <span>Edit Profile</span>
          </Link>
          <Link
            to="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New</span>
          </Link>
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="mb-6 p-3 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Real Firestore Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Saved Stories</p>
            <p className="text-2xl font-bold text-white">{stories.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
            <Heart className="w-6 h-6 fill-pink-500/30 text-pink-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Favourites</p>
            <p className="text-2xl font-bold text-white">{favouriteStories.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Generation History</p>
            <p className="text-2xl font-bold text-white">{historyItems.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Preferred Language</p>
            <p className="text-lg font-bold text-white truncate max-w-[130px]">
              {userProfile?.preferredLanguage || 'English'}
            </p>
          </div>
        </div>
      </div>

      {/* Author Profile Quick Summary Banner */}
      {userProfile && (userProfile.bio || userProfile.country || (userProfile.favouriteGenres && userProfile.favouriteGenres.length > 0)) && (
        <div className="mb-8 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-white">{authorName}</span>
              {userProfile.country && (
                <span className="text-xs text-slate-400 font-mono">({userProfile.country})</span>
              )}
              {userProfile.age && (
                <span className="text-xs text-slate-400">• Age: {userProfile.age}</span>
              )}
            </div>
            {userProfile.bio && (
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                "{userProfile.bio}"
              </p>
            )}
          </div>

          {userProfile.favouriteGenres && userProfile.favouriteGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {userProfile.favouriteGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Tabs: My Stories, Favourites, Generation History */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('stories')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'stories'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Stories ({stories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('favourites')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'favourites'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Favourites ({favouriteStories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Generation History ({historyItems.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: All Stories & Tab 2: Favourites */}
        {(activeTab === 'stories' || activeTab === 'favourites') && (
          <div>
            {isLoading ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading your story vault from Firestore...</p>
              </div>
            ) : (activeTab === 'stories' ? stories : favouriteStories).length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 px-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 w-fit mx-auto mb-4 text-purple-400 opacity-60">
                  {activeTab === 'favourites' ? <Heart className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {activeTab === 'favourites' ? 'No favourite stories yet' : 'Your story library is empty'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  {activeTab === 'favourites'
                    ? 'Click the heart icon on any saved story to add it to your favourites list.'
                    : 'Jump into the Story Generator, ignite an idea, and click Save Story to preserve it forever.'}
                </p>
                <Link
                  to="/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all hover:scale-105"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Launch Story Generator
                </Link>
              </div>
            ) : (
              /* Stories Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeTab === 'stories' ? stories : favouriteStories).map((story) => (
                  <div
                    key={story.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                          {story.mode}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {story.createdAtFormatted || 'Saved'}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-2 line-clamp-1">{story.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 whitespace-pre-line">
                        {story.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px] truncate max-w-[100px]">{story.genre}</span>

                      <div className="flex items-center gap-1.5">
                        {/* Open in reading modal */}
                        <button
                          onClick={() => setSelectedStoryForModal(story)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Read full story"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle favourite */}
                        <button
                          onClick={() => handleToggleFavourite(story)}
                          className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                            story.isFavourite ? 'text-pink-400' : 'text-slate-400 hover:text-pink-400'
                          }`}
                          title={story.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                        >
                          <Heart className={`w-4 h-4 ${story.isFavourite ? 'fill-pink-400' : ''}`} />
                        </button>

                        {/* Copy story */}
                        <button
                          onClick={() => handleCopy(story.id, story.content)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy content"
                        >
                          {copiedId === story.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete story */}
                        <button
                          onClick={() => handleDelete(story.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Generation History */}
        {activeTab === 'history' && (
          <div>
            {historyItems.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 w-fit mx-auto mb-4 text-amber-400 opacity-60">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Generation History Logged</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Every time you spark an idea in the Story Generator while signed in, it is preserved here automatically.
                </p>
                <Link
                  to="/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all hover:scale-105"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Try Story Generator
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          {item.mode}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {item.createdAtFormatted}
                        </span>
                        <span className="text-[10px] text-purple-300">
                          {item.genre} • {item.tone}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">"{item.prompt}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-400">
                        Status: {item.status}
                      </span>
                      <Link
                        to={`/generate?mode=${item.mode}`}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 font-semibold text-[11px] transition-colors"
                      >
                        Re-spark
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story Reading Modal */}
      {selectedStoryForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="max-w-2xl w-full max-h-[90vh] p-4 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {selectedStoryForModal.mode}
                </span>
                <h2 className="text-lg font-bold text-white mt-1.5">{selectedStoryForModal.title}</h2>
              </div>
              <button
                onClick={() => setSelectedStoryForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-5 pr-2">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-normal">
                {selectedStoryForModal.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Genre: {selectedStoryForModal.genre} • Tone: {selectedStoryForModal.tone}</span>
              <button
                onClick={() => handleCopy(selectedStoryForModal.id, selectedStoryForModal.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                {copiedId === selectedStoryForModal.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
