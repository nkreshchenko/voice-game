import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST']
}))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

interface Player {
  position: { x: number; y: number; z: number }
  color: string
}

const players = new Map<string, Player>()

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)

  socket.on('initialize', ({ position, color }) => {
    console.log('Player initialized:', socket.id, { position, color })
    
    // Store new player
    players.set(socket.id, { position, color })

    // Send existing players to new player
    players.forEach((player, playerId) => {
      if (playerId !== socket.id) {
        socket.emit('playerJoined', playerId, player.position, player.color)
      }
    })

    // Broadcast new player to all other players
    socket.broadcast.emit('playerJoined', socket.id, position, color)
  })

  socket.on('position', (position) => {
    console.log('Player moved:', socket.id, position)
    const player = players.get(socket.id)
    if (player) {
      player.position = position
      socket.broadcast.emit('playerMoved', socket.id, position)
    }
  })

  // Handle WebRTC signaling
  socket.on('voice-offer', (targetId, description) => {
    console.log('Voice offer from', socket.id, 'to', targetId)
    io.to(targetId).emit('voice-offer', socket.id, description)
  })

  socket.on('voice-answer', (targetId, description) => {
    console.log('Voice answer from', socket.id, 'to', targetId)
    io.to(targetId).emit('voice-answer', socket.id, description)
  })

  socket.on('voice-candidate', (targetId, candidate) => {
    console.log('Voice candidate from', socket.id, 'to', targetId)
    io.to(targetId).emit('voice-candidate', socket.id, candidate)
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
    players.delete(socket.id)
    io.emit('playerLeft', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 