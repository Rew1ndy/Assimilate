import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from './Shaders'
import { ObjectProps } from '../Main/Main'



// export default function Model({ url, direction, speed }: { url: string, direction: number, speed: number }) {
export default function Model({ url, objectProps }: { url: string, objectProps: ObjectProps }) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
    // meshRef.current.rotation.z += (speed / 5000) * Number(direction);
    meshRef.current.rotation[objectProps.rotation.axis] += objectProps.rotation.speed * objectProps.rotation.direction;
  })

  return (
    <mesh geometry={geometry} ref={meshRef}>
      {/* <meshStandardMaterial color="orange" /> */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  )
}
