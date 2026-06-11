import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import gpuRoutes from './routes/gpus.js'
import driverRoutes from './routes/drivers.js'
import downloadRoutes from './routes/downloads.js'
import feedbackRoutes from './routes/feedback.js'
import adminRoutes from './routes/admin.js'
import favoriteRoutes from './routes/favorites.js'
import miscRoutes from './routes/misc.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/gpus', gpuRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/downloads', downloadRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/misc', miscRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
