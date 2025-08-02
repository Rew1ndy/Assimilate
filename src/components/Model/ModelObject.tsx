// ModelObject.tsx
import { useLoader, useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { TextureProps } from '../Main/Main';
import { TextureSlot } from '../Types/Types';

// Типы
type ObjectProps = {
  object: {
    rotation: {
      isRotating: boolean;
      axis: 'x' | 'y' | 'z';
      speed: number;
      direction: number;
    };
  };
}

export type ShaderError = {
  type: 'vertex' | 'fragment' | 'link' | 'validate' | 'webgl' | 'success';
  message: string;
  raw?: string;
  valid: boolean;
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

  // Compile vertex
  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, patchedVertex);
  gl.compileShader(vert);
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vert) || 'Unknown vertex shader error';
    cleanup(gl, program, vert, null);
    return { valid: false, type: 'vertex', log } as const;
  }

  // Compile fragment
  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, patchedFragment);
  gl.compileShader(frag);
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(frag) || 'Unknown fragment shader error';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'fragment', log } as const;
  }

  // Links
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Linking failed';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'link', log } as const;
  }

  // Validation
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
      // Передаем сообщение об ошибке
      const err: ShaderError = {
        type: validation.type || 'webgl',
        message: parseGlslError(validation.log),
        raw: validation.log,
        valid: false
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
    } else {
      // Передаем сообщение об успешной компиляции
      const err: ShaderError = {
          type: 'success',
          message: 'Shader compiled successful',
          raw: validation.log,
          valid: true
      };
      onError(err)
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
export function ModelObject({
  url,
  objectProps,
  vertexProps,
  fragmentProps,
  shadeError,
  textures
}: {
  url: string;
  objectProps: ObjectProps;
  vertexProps: string;
  fragmentProps: string;
  shadeError: (error: ShaderError) => void;
  textures: Record<string, TextureProps>
}) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);
  const [shaderError, setShaderError] = useState<string | null>(null);
  // const textureUniforms: Record<string, { value: THREE.Texture }> = {};
  const [loadedTextures, setLoadedTextures] = useState<Record<string, THREE.Texture>>({});

  useEffect(() => {
    if (geometry) {
      generateUVs(geometry);
    }
  }, [geometry]);


  useEffect(() => {
    const loadAllTextures = async () => {
      const entries = await Promise.all(
        Object.entries(textures).map(async ([name, tex]) => {
          const texture = await createTexture(tex);
          return [name, texture] as const;
        })
      );

      setLoadedTextures(Object.fromEntries(entries));
    };

    loadAllTextures();
  }, [textures]);


  const textureUniforms = Object.entries(loadedTextures).reduce((acc, [name, tex]) => {
    acc[`u_${textures[name].slot}`] = { value: tex };
    return acc;
  }, {} as Record<string, { value: THREE.Texture }>);

  const uniforms = {
    uTime: { value: 0 },
    ...textureUniforms
  };


  const handleError = useCallback((err: ShaderError) => {
    // console.warn('[Shader Error]', err);
    // setShaderError(`${err.type.toUpperCase()}: ${err.message}`);
    // console.error("My Shader Error")
    shadeError(err)
  }, []);

  // const uniforms = {
  //   uTime: { value: 0 },
  //   ...textureUniforms
  // };

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

async function createTexture(textureProps: TextureProps): Promise<THREE.Texture> {
  const url = URL.createObjectURL(textureProps.file);
  const texture = await loadTextureAsync(url);

  const props = textureProps.props;

  texture.wrapS = THREE[props.wrapS];
  texture.wrapT = THREE[props.wrapT];
  texture.encoding = THREE[props.encoding];
  texture.magFilter = THREE[props.magFilter];
  texture.minFilter = THREE[props.minFilter];
  texture.mapping = THREE[props.mapping];
  texture.format = THREE[props.format];
  texture.type = THREE[props.type];

  texture.repeat.set(...props.repeat);
  texture.offset.set(...props.offset);
  texture.center.set(...props.center);
  texture.rotation = props.rotation;
  texture.anisotropy = props.anisotropy;
  texture.flipY = props.flipY;

  texture.needsUpdate = true;
  return texture;
}


function loadTextureAsync(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => resolve(texture),
      undefined,
      (err) => reject(err)
    );
  });
}

function generateUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();

  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const uvAttr = new Float32Array(geometry.attributes.position.count * 2);

  for (let i = 0; i < geometry.attributes.position.count; i++) {
    const x = geometry.attributes.position.getX(i);
    const y = geometry.attributes.position.getY(i);
    const z = geometry.attributes.position.getZ(i);

    // const u = (x - bbox.min.x) / size.x;
    // const v = (y - bbox.min.y) / size.y;
    const u = (z - bbox.min.z) / size.z;
    const v = (x - bbox.min.x) / size.x;


    uvAttr[i * 2] = u;
    uvAttr[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttr, 2));
}
