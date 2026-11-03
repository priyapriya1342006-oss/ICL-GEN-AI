import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Records an entry into the Firestore `generationHistory` collection.
 * Clearly records status as 'demo' while AI connection is in demo mode.
 */
export async function recordGenerationHistory({
  userId,
  prompt,
  mode,
  genre,
  language,
  tone,
  status = 'demo',
}) {
  if (!userId || !db) return null

  try {
    const historyData = {
      userId,
      prompt: prompt?.trim() || 'Untitled idea',
      mode: mode || 'idea',
      genre: genre || 'Fantasy',
      language: language || 'English',
      tone: tone || 'Inspiring',
      status: status || 'demo', // Explicitly records 'success' or 'demo'
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'generationHistory'), historyData)
    return { id: docRef.id, ...historyData }
  } catch (error) {
    console.warn('[StorySpark AI] Generation history logging notice:', error?.message)
    return null
  }
}

/**
 * Subscribes in real-time to generation history for the authenticated user.
 * Filters strictly by `userId == authenticated UID`.
 * Sorts client-side to prevent missing index errors.
 * Returns unsubscribe function to clean up on unmount.
 */
export function subscribeUserHistory(userId, onUpdate, onError) {
  if (!userId || !db) return () => {}

  const historyQuery = query(
    collection(db, 'generationHistory'),
    where('userId', '==', userId)
  )

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const historyItems = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
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
      historyItems.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)

      onUpdate(historyItems)
    },
    (err) => {
      console.warn('[StorySpark AI] Generation history listener error:', err?.message)
      if (onError) onError(err)
    }
  )
}
