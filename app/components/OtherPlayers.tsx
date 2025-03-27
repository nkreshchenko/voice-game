import { useGameStore } from '../stores/gameStore'

export function OtherPlayers() {
  const { players } = useGameStore()

  return (
    <>
      {Array.from(players.entries()).map(([playerId, player]) => (
        <mesh
          key={playerId}
          position={[player.position.x, player.position.y, player.position.z]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={player.color} />
        </mesh>
      ))}
    </>
  )
} 