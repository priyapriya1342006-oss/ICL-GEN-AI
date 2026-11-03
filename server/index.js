import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import generateRouter from './routes/generate.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, or for tools/server requests with no origin, allow access
      if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by StorySpark CORS policy`))
      }
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '500kb' }))

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'StorySpark AI Backend',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
    serverTime: new Date().toISOString(),
  })
})

// Story Generation Route
app.use('/api', generateRouter)

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' })
})

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Server Error]:', err?.message || err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  })
})

app.listen(PORT, () => {
  console.log(`🚀 [StorySpark AI Server] Running on http://localhost:${PORT}`)
  console.log(`🔑 [Gemini Key Status]: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Pending in server/.env ⚠️'}`)
})
