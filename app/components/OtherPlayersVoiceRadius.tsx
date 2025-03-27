import { useGameStore } from '../stores/gameStore'

export function OtherPlayersVoiceRadius() {
  const { players } = useGameStore()

  return (
    <>
      {Array.from(players.entries()).map(([playerId, player]) => (
        <group key={playerId} position={[player.position.x, 0.01, player.position.z]}>
          {/* Maximum voice range */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[10, 64]} />
            <meshBasicMaterial color={player.color} transparent opacity={0.05} />
          </mesh>
          
          {/* Medium voice range */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[6, 64]} />
            <meshBasicMaterial color={player.color} transparent opacity={0.1} />
          </mesh>
          
          {/* Close range */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 64]} />
            <meshBasicMaterial color={player.color} transparent opacity={0.15} />
          </mesh>
        </group>
      ))}
    </>
  )
} 