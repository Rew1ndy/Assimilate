import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';



export default function Model({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url)

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
