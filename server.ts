// @ts-nocheck
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server: SocketIOServer } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

interface Player {
  position: { x: number; y: number; z: number }
  color: string
}

const players = new Map<string, Player>()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
  })

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

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
}) 