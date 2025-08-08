import { useLoader, useFrame } from '@react-three/fiber';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { TextureProps } from '../Main/Main';
import { Vector2 } from 'three';
import { uvTransformFunctions } from './Shaders';

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
  const gl: any = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return { valid: false, type: 'webgl', log: 'WebGL not available' } as const;

  const program = gl.createProgram();
  if (!program) return { valid: false, type: 'webgl', log: 'Failed to create program' } as const;

  // Подменяем шейдеры, добавляя объявления
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
  textures,
  vertex,
  fragment,
  uniforms,
  onError,
}: {
  textures: any;
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
        valid: false
      };
      onError(err);

      const fallback = new THREE.ShaderMaterial({
        vertexShader: lastValidRef.current.vertex,
        fragmentShader: lastValidRef.current.fragment,
        uniforms: { ...uniforms },
      });
      setMaterial(fallback);
      return;
    } else {
      const err: ShaderError = {
        type: 'success',
        message: 'Shader compiled successful',
        raw: validation.log,
        valid: true
      };
      onError(err)
    }

    lastValidRef.current = { vertex, fragment };

    const newMaterial = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        ...uniforms,
      }
    });

    setMaterial(newMaterial);

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
  textures,
  useImportType
}: {
  url: string;
  objectProps: ObjectProps;
  vertexProps: string;
  fragmentProps: string;
  shadeError: (error: ShaderError) => void;
  textures: Record<string, TextureProps>,
  useImportType: (uniforms: any) => void
}) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);
  const [loadedTextures, setLoadedTextures] = useState<Record<string, THREE.Texture>>({});

  useEffect(() => {
    if (geometry) {
      generateUVs(geometry);
    }
  }, [geometry]);

  console.log("ModelObj.tsx Fragment: ", fragmentProps)

  useEffect(() => {
    if(textures) {
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
    }
  }, [textures]);

  const textureUniforms = Object.entries(loadedTextures).reduce((acc, [name, tex]) => {
    acc[`u_${textures[name].slot}`] = { value: tex };
    return acc;
  }, {} as Record<string, { value: THREE.Texture }>);

  const uniforms = {
    uTime: { value: 0 },
    ...textureUniforms,
  };

  Object.entries(textures).forEach(([name, tex]) => {
    const slot = tex.slot;
    const props = tex.props;

    uniforms[`u_${slot}_repeat`] = { value: new THREE.Vector2(...props.repeat) };
    uniforms[`u_${slot}_offset`] = { value: new THREE.Vector2(...props.offset) };
    uniforms[`u_${slot}_center`] = { value: new THREE.Vector2(...props.center) };
    uniforms[`u_${slot}_rotation`] = { value: props.rotation };
  });

  useImportType(uniforms);

  const handleError = useCallback((err: ShaderError) => {
    shadeError(err);
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (mesh && objectProps?.object.rotation.isRotating) {
      const { axis, speed, direction } = objectProps.object.rotation;
      mesh.rotation[axis] += speed * direction;
    }

    if (mesh?.material && 'uniforms' in mesh.material) {
      const mat = mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value = clock.getElapsedTime();
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geometry}>
        <SafeShaderMaterial
          textures={textures}
          vertex={vertexProps}
          fragment={fragmentProps} // Используем fragmentProps напрямую
          uniforms={uniforms}
          onError={handleError}
        />
      </mesh>
    </>
  );
}

async function createTexture(textureProps: TextureProps): Promise<THREE.Texture> {
  const url = URL.createObjectURL(textureProps.file);
  const texture: any = await loadTextureAsync(url);
  URL.revokeObjectURL(url);

  const props = textureProps.props;

  texture.wrapS = THREE[props.wrapS as keyof typeof THREE];
  texture.wrapT = THREE[props.wrapT as keyof typeof THREE];
  texture.encoding = THREE[props.encoding as keyof typeof THREE];
  texture.magFilter = THREE[props.magFilter as keyof typeof THREE];
  texture.minFilter = THREE[props.minFilter as keyof typeof THREE];
  texture.mapping = THREE[props.mapping as keyof typeof THREE];
  texture.format = THREE[props.format as keyof typeof THREE];
  texture.type = THREE[props.type as keyof typeof THREE];

  texture.repeat.set(...props.repeat);
  texture.offset.set(...props.offset);
  texture.center.set(...props.center);
  texture.rotation = props.rotation;
  texture.anisotropy = props.anisotropy;
  texture.flipY = props.flipY;

  texture.needsUpdate = true;
  texture.matrixAutoUpdate = true;
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
    const z = geometry.attributes.position.getZ(i);

    const u = (z - bbox.min.z) / size.z;
    const v = (x - bbox.min.x) / size.x;

    uvAttr[i * 2] = u;
    uvAttr[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttr, 2));
}
