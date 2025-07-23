// ModelObject.tsx
import { useLoader, useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// Типы
interface ObjectProps {
  object: {
    rotation: {
      isRotating: boolean;
      axis: 'x' | 'y' | 'z';
      speed: number;
      direction: number;
    };
  };
}

interface ShaderError {
  type: 'vertex' | 'fragment' | 'link' | 'validate' | 'webgl';
  message: string;
  raw?: string;
}

// Валидация шейдеров через WebGL
function validateShaderInWebGL(vertex: string, fragment: string) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return { valid: false, type: 'webgl', log: 'WebGL not available' } as const;

  const program = gl.createProgram();
  if (!program) return { valid: false, type: 'webgl', log: 'Failed to create program' } as const;

  // === Подменяем шейдеры, добавляя объявления ===

  const patchedVertex = `
    precision mediump float;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    attribute vec3 position;
    attribute vec2 uv;
    ${vertex}
  `;

  const patchedFragment = `
    precision mediump float;
    ${fragment}
  `;

  // Компиляция vertex
  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, patchedVertex);
  gl.compileShader(vert);
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vert) || 'Unknown vertex shader error';
    cleanup(gl, program, vert, null);
    return { valid: false, type: 'vertex', log } as const;
  }

  // Компиляция fragment
  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, patchedFragment);
  gl.compileShader(frag);
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(frag) || 'Unknown fragment shader error';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'fragment', log } as const;
  }

  // Линковка
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Linking failed';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'link', log } as const;
  }

  // Валидация
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Validation failed';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'validate', log } as const;
  }

  cleanup(gl, program, vert, frag);
  return { valid: true } as const;
}

function cleanup(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  vert: WebGLShader | null,
  frag: WebGLShader | null
) {
  if (vert) gl.deleteShader(vert);
  if (frag) gl.deleteShader(frag);
  gl.deleteProgram(program);
}

function parseGlslError(log: string): string {
  const lineMatch = log.match(/ERROR:\s*(\d+):(\d+)/);
  const message = log.split(':').slice(3).join(':').trim();
  if (lineMatch) {
    const line = parseInt(lineMatch[1], 10);
    return `Line ${line}: ${message}`;
  }
  return message || 'Shader error';
}

// SafeShaderMaterial (inline)
const SafeShaderMaterial = ({
  vertex,
  fragment,
  uniforms,
  onError,
}: {
  vertex: string;
  fragment: string;
  uniforms: Record<string, any>;
  onError: (error: ShaderError) => void;
}) => {
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);
  const lastValidRef = useRef({ vertex, fragment });

  useEffect(() => {
    const validation = validateShaderInWebGL(vertex, fragment);

    if (!validation.valid) {
      const err: ShaderError = {
        type: validation.type || 'webgl',
        message: parseGlslError(validation.log),
        raw: validation.log,
      };
      onError(err);

      // Откат на последний валидный
      const fallback = new THREE.ShaderMaterial({
        vertexShader: lastValidRef.current.vertex,
        fragmentShader: lastValidRef.current.fragment,
        uniforms: { ...uniforms },
      });
      setMaterial(fallback);
      return;
    }

    // Сохраняем как валидный
    lastValidRef.current = { vertex, fragment };

    const newMaterial = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { ...uniforms },
    });

    setMaterial(newMaterial);

    // Очистка старого материала
    return () => {
      if (material && material !== newMaterial) {
        material.dispose();
      }
    };
  }, [vertex, fragment, uniforms, onError]);

  return material ? <primitive object={material} attach="material" /> : null;
};

// Основной компонент
export default function ModelObject({
  url,
  objectProps,
  vertexProps,
  fragmentProps,
}: {
  url: string;
  objectProps: ObjectProps;
  vertexProps: string;
  fragmentProps: string;
}) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);
  const [shaderError, setShaderError] = useState<string | null>(null);

  const handleError = useCallback((err: ShaderError) => {
    console.warn('[Shader Error]', err);
    setShaderError(`${err.type.toUpperCase()}: ${err.message}`);
    console.error("My Shader Error")
  }, []);

  const uniforms = {
    uTime: { value: 0 },
  };

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (mesh && objectProps?.object.rotation.isRotating) {
      const { axis, speed, direction } = objectProps.object.rotation;
      mesh.rotation[axis] += speed * direction;
    }

    // Обновляем uTime
    if (mesh?.material && 'uniforms' in mesh.material) {
      const mat = mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value = clock.getElapsedTime();
      }
    }
  });

  return (
    <>
      {/* Отображение ошибки */}
      {shaderError}

      {/* Модель */}
      <mesh ref={meshRef} geometry={geometry}>
        <SafeShaderMaterial
          vertex={vertexProps}
          fragment={fragmentProps}
          uniforms={uniforms}
          onError={handleError}
        />
      </mesh>
    </>
  );
}