import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Player } from './Player'
import { Ground } from './Ground'
import { VoiceRadius } from './VoiceRadius'
import { OtherPlayers } from './OtherPlayers'
import { OtherPlayersVoiceRadius } from './OtherPlayersVoiceRadius'
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

export function Game() {
  const { initializeAudio } = useGameStore()

  useEffect(() => {
    initializeAudio()
  }, [initializeAudio])

  return (
    <div style={{ width: '800px', height: '800px' }}>
      <Canvas
        shadows
        camera={{ 
          position: [20, 20, 20],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        className="h-full"
      >
        <color attach="background" args={['#211f1f']} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <OrbitControls 
          maxDistance={50}
          minDistance={5}
          maxPolarAngle={Math.PI / 2.1}
        />
        <Ground />
        <OtherPlayersVoiceRadius />
        <VoiceRadius />
        <OtherPlayers />
        <Player />
      </Canvas>
    </div>
  )
} 