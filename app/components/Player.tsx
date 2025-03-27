import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Vector3 } from 'three'
import { useGameStore } from '../stores/gameStore'

export function Player() {
  const meshRef = useRef<Mesh>(null)
  const { position, updatePosition } = useGameStore()
  const velocity = useRef(new Vector3())
  const speed = 5

  // Generate a random color once when the component mounts
  const playerColor = useMemo(() => {
    const hue = Math.random() * 360
    return `hsl(${hue}, 70%, 60%)`
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w':
          velocity.current.z = -speed
          break
        case 's':
          velocity.current.z = speed
          break
        case 'a':
          velocity.current.x = -speed
          break
        case 'd':
          velocity.current.x = speed
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w':
        case 's':
          velocity.current.z = 0
          break
        case 'a':
        case 'd':
          velocity.current.x = 0
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const newPosition = {
      x: position.x + velocity.current.x * delta,
      y: position.y,
      z: position.z + velocity.current.z * delta
    }

    updatePosition(newPosition)
    meshRef.current.position.set(newPosition.x, newPosition.y, newPosition.z)
  })

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={playerColor} />
    </mesh>
  )
} 