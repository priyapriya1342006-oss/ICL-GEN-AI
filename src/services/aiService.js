/**
 * Client service to call the secure StorySpark AI backend endpoint.
 * Passes the user's Firebase ID token for verification.
 * Private AI keys are never accessed or stored on the client.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export async function generateStoryWithAI({
  idToken,
  mode,
  prompt,
  genre,
  language,
  tone,
  length,
}) {
  if (!idToken) {
    throw new Error('Authentication required. Please sign in to generate stories with the real AI model.')
  }

  const endpoint = `${API_BASE_URL}/api/generate`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      mode,
      prompt,
      genre,
      language,
      tone,
      length,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg =
      data.error ||
      `Server returned error ${response.status}: Failed to communicate with AI engine.`
    const err = new Error(errorMsg)
    err.code = data.code || `HTTP_${response.status}`
    throw err
  }

  return {
    content: data.content,
    mode: data.mode,
    genre: data.genre,
    language: data.language,
    tone: data.tone,
    isDemo: false,
    status: 'success',
  }
}
