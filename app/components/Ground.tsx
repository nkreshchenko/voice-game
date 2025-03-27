import { useEffect } from 'react'
import { GridHelper } from 'three'
import { useThree } from '@react-three/fiber'

export function Ground() {
  const { scene } = useThree()
  
  useEffect(() => {
    const grid = new GridHelper(200, 200, '#666666', '#444444')
    grid.position.y = -0.5
    scene.add(grid)
    return () => {
      scene.remove(grid)
    }
  }, [scene])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial 
        color="#333333"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  )
} 