import express from 'express'
import { GoogleGenAI } from '@google/genai'
import { generationLimiter } from '../middleware/rateLimiter.js'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = express.Router()

const VALID_MODES = ['idea', 'full_story', 'script', 'character', 'plot']

/**
 * Builds structured creative writing instructions for Google Gemini
 */
function buildGeminiPrompt({ mode, prompt, genre, language, tone, length }) {
  const baseContext = `You are StorySpark AI, an elite, imaginative storytelling engine.
Genre: ${genre}
Tone & Style: ${tone}
Language: Write the entire response in ${language}.
Length Goal: Target approximately ${length}.
User Spark / Seed: "${prompt}"

`

  switch (mode) {
    case 'idea':
      return `${baseContext}Generate 3 to 4 captivating, original story ideas and hooks based on the user spark.
For each idea, format clearly with:
1. Title / High-Concept Logline
2. Central Moral Dilemma & Conflict
3. Inciting Incident & Page 1 Hook
4. Unexpected Narrative Twist

Make them fresh, avoiding generic clichés.`

    case 'plot':
      return `${baseContext}Develop a detailed, compelling 3-Act Plot Outline based on the user spark.
Structure as follows:
• ACT I (Setup & Inciting Spark): The Ordinary World, the Inciting Incident, and the Point of No Return.
• ACT II (Rising Action & Midpoint Crisis): Escalating obstacles, subplots, the Midpoint Revelation, and the Dark Night of the Soul.
• ACT III (Climax & Resolution): The final confrontation, moral breakthrough, and satisfying aftermath.`

    case 'character':
      return `${baseContext}Create a rich, multi-dimensional character profile based on the user spark.
Format with:
• Full Name & Title / Moniker
• Archetype & Core Role
• Visual Description & Distinct Mannerisms
• Deepest Need vs. Surface Want
• Fatal Flaw & Moral Vulnerability
• Formative Backstory / Origin Wound
• Signature Dialogue Line that reveals their worldview.`

    case 'script':
      return `${baseContext}Write a cinematic screenplay scene in standard Hollywood script formatting based on the user spark.
Include:
• SCENE HEADING (e.g., EXT. or INT. LOCATION - DAY/NIGHT)
• Vivid, concise action lines in present tense.
• Character cue names in ALL CAPS before dialogue.
• Natural dialogue with parentheticals where necessary.
• Dramatic beats, tension, and sound cues.`

    case 'full_story':
    default:
      return `${baseContext}Write a complete, immersive short story based on the user spark.
Focus on:
• Evocative sensory descriptions and atmospheric world-building.
• Engaging pacing with clear rising tension.
• Believable character dialogue and inner thoughts.
• A resonant climax and meaningful emotional conclusion.`
  }
}

/**
 * POST /api/generate
 * Requires valid Firebase ID token in Authorization header.
 * Calls Gemini API securely on backend.
 */
router.post('/generate', generationLimiter, verifyFirebaseToken, async (req, res) => {
  try {
    const { mode, prompt, genre, language, tone, length } = req.body

    // 1. Validation
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Please provide a story idea or prompt.' })
    }

    if (prompt.trim().length > 1200) {
      return res.status(400).json({
        error: 'Prompt exceeds the 1,200 character limit. Please shorten your prompt.',
      })
    }

    const selectedMode = VALID_MODES.includes(mode) ? mode : 'full_story'
    const selectedGenre = genre?.trim() || 'Fantasy'
    const selectedLanguage = language?.trim() || 'English'
    const selectedTone = tone?.trim() || 'Inspiring'
    const selectedLength = length?.trim() || 'Standard (~500 words)'

    // 2. Check for Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the backend server. Please add your GEMINI_API_KEY in server/.env and restart the server.',
        code: 'API_KEY_MISSING',
      })
    }

    // 3. Call Google Gemini API with Timeout handling (30s)
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    const ai = new GoogleGenAI({ apiKey })
    const fullPrompt = buildGeminiPrompt({
      mode: selectedMode,
      prompt: prompt.trim(),
      genre: selectedGenre,
      language: selectedLanguage,
      tone: selectedTone,
      length: selectedLength,
    })

    const timeoutMs = 30000
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        const timeoutErr = new Error('AI generation request timed out after 30 seconds.')
        timeoutErr.code = 'REQUEST_TIMEOUT'
        reject(timeoutErr)
      }, timeoutMs)
    )

    const apiPromise = ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
    })

    const response = await Promise.race([apiPromise, timeoutPromise])

    const generatedText = response.text

    if (!generatedText || !generatedText.trim()) {
      return res.status(502).json({
        error: 'The AI model returned an empty response. Please adjust your prompt and try again.',
      })
    }

    // 4. Return success
    return res.json({
      success: true,
      content: generatedText.trim(),
      mode: selectedMode,
      genre: selectedGenre,
      language: selectedLanguage,
      tone: selectedTone,
      isDemo: false, // Confirmed real AI generation
      status: 'success',
      userId: req.user.uid,
    })
  } catch (error) {
    console.error('❌ [Server Gemini Error]:', error?.message || error)

    if (error?.code === 'REQUEST_TIMEOUT') {
      return res.status(504).json({
        error: 'The story generation request timed out. Please try again or simplify your prompt.',
        code: 'REQUEST_TIMEOUT',
      })
    }

    const errorMessage = error?.message || ''
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403')) {
      return res.status(401).json({
        error: 'Your GEMINI_API_KEY appears to be invalid. Please verify the key in server/.env.',
        code: 'INVALID_GEMINI_KEY',
      })
    }

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({
        error: 'Google Gemini quota exceeded. Please wait a minute before requesting another generation.',
        code: 'GEMINI_QUOTA_EXCEEDED',
      })
    }

    return res.status(500).json({
      error: 'An unexpected issue occurred while communicating with Google Gemini. Please try again.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    })
  }
})

export default router
