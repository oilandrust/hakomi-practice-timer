import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, 'dist')

const app = express()

app.use(express.static(distPath))

// Use a regex to match all GET requests (Express 5 requires valid path patterns)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 5173
app.listen(port, () => {
  console.log(`Hakomi Practice Timer is serving dist on http://localhost:${port}`)
})

