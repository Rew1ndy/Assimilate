import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from './Shaders'

import type { ObjectProps } from '../Types/Types';

export default function ModelObject({ url, objectProps, vertexProps, fragmentProps }: { url: string, objectProps: ObjectProps, vertexProps: string, fragmentProps: string }) {
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

  console.log("Vertex: props: ", vertexProps)
  /// Добавить защиту от краша при неправильном шейдере с возвратом пераметров обратно (мб try catch finaly...)
  /// Убрать лишний код из главного + перенести обработку можно в MCanvas
  return (
    <mesh geometry={geometry} ref={meshRef}>
      {/* <meshStandardMaterial color="orange" /> */}
      <shaderMaterial
        ref={materialRef}
        key={vertexProps + fragmentProps} // принудительно пересоздаёт компонент
        // vertexShader={ vertexProps || vertexShader }
        vertexShader={ vertexProps}
        // fragmentShader={ fragmentProps || fragmentShader }
        fragmentShader={ fragmentProps }
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  )
}
