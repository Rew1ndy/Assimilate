import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from './Shaders'

import type { ObjectProps } from '../Types/Types';

export default function ModelObject({ url, objectProps }: { url: string, objectProps: ObjectProps }) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  if (objectProps?.object.rotation.isRotating) {
      useFrame(({ clock }) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      }
      meshRef.current.rotation[objectProps.object.rotation.axis] += objectProps.object.rotation.speed * objectProps.object.rotation.direction;
    })
  }

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
