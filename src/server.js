import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { analyzeRepo } from './github_loader.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))

io.on('connection', (socket) => {
  console.log('Client connected')

  socket.on('analyzeRepo', async (repoQuery) => {
    try {
      const result = await analyzeRepo(repoQuery)
      socket.emit('analysisResult', result)
    } catch (error) {
      socket.emit('error', 'Error analyzing the repository.')
    }
  })
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
