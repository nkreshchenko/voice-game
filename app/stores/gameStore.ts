import { create } from 'zustand'
import { Vector3 } from 'three'
import io from 'socket.io-client'

interface Player {
  position: Vector3
  color: string
  audioStream?: MediaStream
  peerConnection?: RTCPeerConnection
}

interface GameState {
  position: { x: number; y: number; z: number }
  players: Map<string, Player>
  audioContext?: AudioContext
  audioStream?: MediaStream
  socket?: any
  updatePosition: (newPosition: { x: number; y: number; z: number }) => void
  initializeAudio: () => Promise<void>
}

const SOCKET_URL = '/api/socket'

const createPeerConnection = (
  socket: any,
  targetId: string,
  localStream: MediaStream,
  onStream: (stream: MediaStream) => void
) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  })

  // Add local stream
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream)
  })

  // Handle ICE candidates
  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('voice-candidate', targetId, event.candidate)
    }
  }

  // Handle incoming stream
  pc.ontrack = event => {
    onStream(event.streams[0])
  }

  return pc
}

export const useGameStore = create<GameState>((set, get) => ({
  position: { x: 0, y: 0.5, z: 0 },
  players: new Map(),
  
  updatePosition: (newPosition) => {
    set({ position: newPosition })
    get().socket?.emit('position', newPosition)
  },

  initializeAudio: async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      
      // Connect to WebSocket server
      const socket = io(SOCKET_URL, {
        path: '/api/socket'
      })
      
      // Generate a random color for this player
      const myColor = `hsl(${Math.random() * 360}, 70%, 60%)`
      
      socket.on('playerJoined', async (playerId: string, position: Vector3, color: string) => {
        console.log('Player joined:', playerId)
        const players = get().players
        const newPlayer: Player = {
          position: new Vector3().copy(position),
          color
        }
        players.set(playerId, newPlayer)
        set({ players: new Map(players) })

        // Initialize WebRTC connection
        if (get().audioStream) {
          const pc = createPeerConnection(
            socket,
            playerId,
            get().audioStream,
            (remoteStream) => {
              const player = get().players.get(playerId)
              if (player) {
                player.audioStream = remoteStream
                set({ players: new Map(get().players) })
              }
            }
          )
          newPlayer.peerConnection = pc

          // Create and send offer
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit('voice-offer', playerId, offer)
        }
      })

      socket.on('voice-offer', async (fromId: string, description: RTCSessionDescription) => {
        const players = get().players
        const player = players.get(fromId)
        if (player && get().audioStream) {
          const pc = createPeerConnection(
            socket,
            fromId,
            get().audioStream,
            (remoteStream) => {
              player.audioStream = remoteStream
              set({ players: new Map(players) })
            }
          )
          player.peerConnection = pc

          await pc.setRemoteDescription(description)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('voice-answer', fromId, answer)
        }
      })

      socket.on('voice-answer', async (fromId: string, description: RTCSessionDescription) => {
        const player = get().players.get(fromId)
        if (player?.peerConnection) {
          await player.peerConnection.setRemoteDescription(description)
        }
      })

      socket.on('voice-candidate', async (fromId: string, candidate: RTCIceCandidate) => {
        const player = get().players.get(fromId)
        if (player?.peerConnection) {
          await player.peerConnection.addIceCandidate(candidate)
        }
      })

      socket.on('playerLeft', (playerId: string) => {
        const players = get().players
        const player = players.get(playerId)
        if (player?.peerConnection) {
          player.peerConnection.close()
        }
        players.delete(playerId)
        set({ players: new Map(players) })
      })

      socket.on('playerMoved', (playerId: string, position: Vector3) => {
        const players = get().players
        const player = players.get(playerId)
        if (player) {
          player.position.copy(position)
          // Update audio volume based on distance
          if (player.audioStream) {
            const distance = new Vector3(position.x, position.y, position.z)
              .distanceTo(new Vector3(get().position.x, get().position.y, get().position.z))
            const volume = Math.max(0, 1 - distance / 10) // 10 units is max hearing distance
            const source = audioContext.createMediaStreamSource(player.audioStream)
            const gainNode = audioContext.createGain()
            gainNode.gain.value = volume
            source.connect(gainNode)
            gainNode.connect(audioContext.destination)
          }
        }
        set({ players: new Map(players) })
      })

      // Emit initial position and color
      socket.emit('initialize', { position: get().position, color: myColor })
      
      set({ audioContext, audioStream: stream, socket })
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  },
})) 