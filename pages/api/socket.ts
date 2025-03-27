import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Socket } from 'net'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface Player {
  position: { x: number; y: number; z: number }
  color: string
}

interface ExtendedSocket extends Socket {
  server: any;
}

interface ExtendedNextApiResponse extends NextApiResponse {
  socket: ExtendedSocket;
}

const players = new Map<string, Player>()

const ioHandler = (req: NextApiRequest, res: ExtendedNextApiResponse) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')
    
    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
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

    res.socket.server.io = io
  }

  res.end()
}

export default ioHandler 