import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Saves a generated story to the Firestore `stories` collection.
 * Only authenticated users can save stories.
 */
export async function saveStory({
  userId,
  title,
  content,
  mode,
  genre,
  language,
  tone,
  isFavourite = false,
  isDemo = false,
}) {
  if (!userId) {
    throw new Error('You must be signed in to save stories.')
  }
  if (!db) {
    throw new Error('Firestore database is not initialized.')
  }
  if (!content || !content.trim()) {
    throw new Error('Cannot save an empty story.')
  }

  // Auto-generate title if none provided
  const cleanTitle =
    title?.trim() ||
    (content.length > 40 ? content.slice(0, 40).replace(/[#*_\n]/g, '').trim() + '...' : 'Untitled Creation')

  const storyData = {
    userId,
    title: cleanTitle,
    content: content.trim(),
    mode: mode || 'full_story',
    genre: genre || 'Fantasy',
    language: language || 'English',
    tone: tone || 'Inspiring',
    isFavourite: Boolean(isFavourite),
    isDemo: Boolean(isDemo), // Records true for demo output, false for real AI output
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'stories'), storyData)
  return { id: docRef.id, ...storyData }
}

/**
 * Deletes a story by its document ID.
 */
export async function deleteStory(storyId) {
  if (!storyId) throw new Error('Story ID is required to delete.')
  if (!db) throw new Error('Firestore database is not initialized.')

  const storyRef = doc(db, 'stories', storyId)
  await deleteDoc(storyRef)
  return storyId
}

/**
 * Toggles the favourite status of a saved story.
 */
export async function toggleFavouriteStory(storyId, currentStatus) {
  if (!storyId) throw new Error('Story ID is required.')
  if (!db) throw new Error('Firestore database is not initialized.')

  const storyRef = doc(db, 'stories', storyId)
  const newStatus = !currentStatus

  await updateDoc(storyRef, {
    isFavourite: newStatus,
    updatedAt: serverTimestamp(),
  })

  return newStatus
}

/**
 * Subscribes in real-time to all stories belonging to the authenticated user.
 * Filters strictly by `userId == authenticated UID`.
 * Sorts client-side to prevent Firestore missing composite index errors.
 * Returns unsubscribe function to clean up on component unmount.
 */
export function subscribeUserStories(userId, onUpdate, onError) {
  if (!userId || !db) return () => {}

  const storiesQuery = query(
    collection(db, 'stories'),
    where('userId', '==', userId)
  )

  return onSnapshot(
    storiesQuery,
    (snapshot) => {
      const stories = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        // Convert server timestamp safely
        let createdAtDate = new Date()
        if (data.createdAt?.toDate) {
          createdAtDate = data.createdAt.toDate()
        } else if (data.createdAt?.seconds) {
          createdAtDate = new Date(data.createdAt.seconds * 1000)
        }

        return {
          id: docSnap.id,
          ...data,
          createdAtFormatted: createdAtDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAtTimestamp: createdAtDate.getTime(),
        }
      })

      // Client-side sort: newest first
      stories.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)

      onUpdate(stories)
    },
    (err) => {
      console.warn('[StorySpark AI] Real-time stories listener error:', err?.message)
      if (onError) onError(err)
    }
  )
}
