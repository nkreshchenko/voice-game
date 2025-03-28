import { useRef } from 'react'
import { Mesh } from 'three'
import { useGameStore } from '../stores/gameStore'

export function VoiceRadius() {
  const maxRef = useRef<Mesh>(null)
  const medRef = useRef<Mesh>(null)
  const minRef = useRef<Mesh>(null)
  const { position } = useGameStore()

  return (
    <group position={[position.x, 0.01, position.z]}>
      {/* Maximum voice range - barely audible */}
      <mesh ref={maxRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[10, 64]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.1} />
      </mesh>
      
      {/* Medium voice range - clear but not full volume */}
      <mesh ref={medRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshBasicMaterial color="#ff8844" transparent opacity={0.15} />
      </mesh>
      
      {/* Close range - full volume */}
      <mesh ref={minRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 64]} />
        <meshBasicMaterial color="#ffcc44" transparent opacity={0.2} />
      </mesh>
    </group>
  )
} 