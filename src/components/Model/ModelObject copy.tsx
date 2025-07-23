import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from './Shaders'
import type { ObjectProps } from '../Types/Types';

interface ShaderState {
  vertex: string;
  fragment: string;
  isValid: boolean;
  error?: string;
}

const validateNumericValues = (text: string): { isValid: boolean, error?: string } => {
  const matches = text.match(/-?\d*\.?\d+(e[+\-]?\d+)?/gi)
  if (!matches) return { isValid: true }

  for (const val of matches) {
    const num = Number(val)
    if (!isFinite(num)) {
      return { isValid: false, error: `${val} is not a valid float` }
    }
  }

  return { isValid: true }
}


const validateGLSL = (shaderCode: string, type: 'vertex' | 'fragment'): { isValid: boolean; error?: string } => {
  if (!/void\s+main\s*\(\s*\)/.test(shaderCode)) return { isValid: false, error: `${type} missing main()` }
  // validateNumericValues(shaderCode)
  if (type === 'vertex' && !shaderCode.includes('gl_Position')) return { isValid: false, error: `vertex missing gl_Position` }
  if (type === 'fragment' && !shaderCode.match(/gl_FragColor|gl_FragData/)) return { isValid: false, error: `fragment missing output` }
  return { isValid: true }
}

const SafeShaderMaterial = ({
  materialRef,
  vertex,
  fragment,
  uniforms,
  onError
}: {
  materialRef: React.RefObject<THREE.ShaderMaterial>
  vertex: string
  fragment: string
  uniforms: any
  onError: (error: string) => void
}) => {
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null)
  const lastValidShader = useRef<{ vertex: string, fragment: string }>({ vertex, fragment })

  useEffect(() => {
    const vertexErr = validateGLSL(vertex, 'vertex')
    const fragmentErr = validateGLSL(fragment, 'fragment')
    console.log(vertexErr, fragmentErr)

    if (!vertexErr.isValid || !fragmentErr.isValid) {
      const errMsg = vertexErr || fragmentErr || 'Unknown shader error'
      onError(errMsg)

      // откат к предыдущей валидной
      const fallback = new THREE.ShaderMaterial({
        vertexShader: lastValidShader.current.vertex,
        fragmentShader: lastValidShader.current.fragment,
        uniforms,
      })
      console.log("Not valid: Backup...")
      setMaterial(fallback)
      return
    }

    // обновляем валидный материал
    lastValidShader.current = { vertex, fragment }

    const newMaterial = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
    })
    setMaterial(newMaterial)
  }, [vertex, fragment])

  useEffect(() => {
    if (material && materialRef.current) {
      materialRef.current = material
      material.onError = (error) => {
        console.error('Ошибка шейдера:', error);
        // Здесь можно добавить логику обработки ошибки
        // Например, показать уведомление или заменить материал
        alert('Произошла ошибка в шейдере! Проверьте GLSL-код.');
      };
    }
  }, [material])

  return material ? <primitive object={material} ref={materialRef} attach="material" key={vertex + fragment} /> : null
}


export default function ModelObject({ 
  url, 
  objectProps, 
  vertexProps, 
  fragmentProps 
}: { 
  url: string, 
  objectProps: ObjectProps, 
  vertexProps: string, 
  fragmentProps: string 
}) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const [shaderState, setShaderState] = useState<ShaderState>({
    vertex: vertexProps,
    fragment: fragmentProps,
    isValid: true
  });

  // Обработчик ошибок шейдера
  const handleShaderError = useCallback((error: string) => {
    console.warn('🔴 Shader Error:', error);
    setShaderState(prev => ({
      ...prev,
      isValid: false,
      error
    }));
    
    // Можно добавить уведомление пользователю
    // toast.error(`Shader Error: ${error}`);
  }, []);

  // Валидация входящих шейдеров
  useEffect(() => {
    const vertexValidation = validateGLSL(vertexProps, 'vertex');
    const fragmentValidation = validateGLSL(fragmentProps, 'fragment');

    if (!vertexValidation.isValid) {
      handleShaderError(vertexValidation.error || 'Invalid vertex shader');
      return;
    }

    if (!fragmentValidation.isValid) {
      handleShaderError(fragmentValidation.error || 'Invalid fragment shader');
      return;
    }

    console.log(vertexProps)

    // Обновляем состояние только если шейдеры валидны
    setShaderState({
      vertex: vertexProps,
      fragment: fragmentProps,
      isValid: true
    });
  }, [vertexProps, fragmentProps, handleShaderError]);

  // Анимация
  useFrame(({ clock }) => {
    const mesh = meshRef.current
    const mat = materialRef.current

    // console.log(mesh, mat)
    // console.log(materialRef)

    if (!mesh || !objectProps?.object.rotation.isRotating) return

    const { axis, speed, direction } = objectProps.object.rotation
    mesh.rotation[axis] += speed * direction

    if (mat?.uniforms?.uTime) {
      mat.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  const uniforms = {
    uTime: { value: 0 },
    // Добавьте другие uniforms по необходимости
  };

  return (
    <mesh geometry={geometry} ref={meshRef}>
      <SafeShaderMaterial
        vertex={vertexProps}
        fragment={fragmentProps}
        uniforms={uniforms}
        materialRef={materialRef}
        onError={(error) => {
          console.warn('⛔ GLSL Error:', error)
          // Можно отобразить UI-сообщение или сохранить лог
        }}
      />
      {/* <shaderMaterial
        key={vertexProps+fragmentProps}
        ref={materialRef}
        vertexShader={vertexProps}
        fragmentShader={fragmentProps}
        uniforms={{ uTime: { value: 0 } }}
      /> */}
    </mesh>
  );
}