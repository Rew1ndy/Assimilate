import { useLoader, useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import type { TextureProps } from '../Main/Main';

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
};

export type ShaderError = {
  type: 'vertex' | 'fragment' | 'link' | 'validate' | 'webgl' | 'success';
  message: string;
  raw?: string;
  valid: boolean;
};

// Валидация шейдеров
function validateShaderInWebGL(vertex: string, fragment: string) {
  const canvas = document.createElement('canvas');
  const gl: any = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return { valid: false, type: 'webgl', log: 'WebGL not available' } as const;
  const program = gl.createProgram();
  if (!program) return { valid: false, type: 'webgl', log: 'Failed to create program' } as const;

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

  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, patchedVertex);
  gl.compileShader(vert);
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vert) || 'Unknown vertex shader error';
    cleanup(gl, program, vert, null);
    return { valid: false, type: 'vertex', log } as const;
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, patchedFragment);
  gl.compileShader(frag);
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(frag) || 'Unknown fragment shader error';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'fragment', log } as const;
  }

  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Linking failed';
    cleanup(gl, program, vert, frag);
    return { valid: false, type: 'link', log } as const;
  }

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

// === SafeShaderMaterial ===
const SafeShaderMaterial = ({
  vertex,
  fragment,
  textures,
  onError,
}: {
  vertex: string;
  fragment: string;
  textures: Record<string, THREE.Texture>;
  onError: (error: ShaderError) => void;
}) => {
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);
  const lastValidRef = useRef({ vertex, fragment });
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const uniforms = useMemo(() => {
    const unifs: Record<string, any> = {
      uTime: { value: 0 },
    };
    Object.entries(textures).forEach(([uniformName, texture]) => {
      unifs[uniformName] = { value: texture };
    });
    return unifs;
  }, [textures]);

  useEffect(() => {
    const validation = validateShaderInWebGL(vertex, fragment);

    let newMaterial: THREE.ShaderMaterial;

    if (!validation.valid) {
      const err: ShaderError = {
        type: validation.type || 'webgl',
        message: parseGlslError(validation.log),
        raw: validation.log,
        valid: false,
      };
      onError(err);

      newMaterial = new THREE.ShaderMaterial({
        vertexShader: lastValidRef.current.vertex,
        fragmentShader: lastValidRef.current.fragment,
        uniforms: { ...uniforms },
      });
    } else {
      const err: ShaderError = {
        type: 'success',
        message: 'Shader compiled successfully',
        raw: validation.log,
        valid: true,
      };
      onError(err);

      lastValidRef.current = { vertex, fragment };

      newMaterial = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { ...uniforms },
      });
    }

    setMaterial(newMaterial);
    const oldMaterial = materialRef.current;
    materialRef.current = newMaterial;

    return () => {
      if (oldMaterial && oldMaterial !== newMaterial) {
        oldMaterial.dispose();
      }
    };
  }, [vertex, fragment, uniforms, onError]);

  return material ? <primitive object={material} attach="material" /> : null;
};

// === ModelObject ===
export function ModelObject({ // Пофиксить баг с тайлингом. Сейчас все таботает не на юв, а на изменении геометрии - так и оставить.
  url,
  objectProps,
  vertexProps,
  fragmentProps,
  shadeError,
  textures: texturePropsMap,
}: {
  url: string;
  objectProps: ObjectProps;
  vertexProps: string;
  fragmentProps: string;
  shadeError: (error: ShaderError) => void;
  textures: Record<string, TextureProps>;
}) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);
  const [loadedTextures, setLoadedTextures] = useState<Record<string, THREE.Texture>>({});
  const prevTexturePropsRef = useRef<Record<string, TextureProps>>({});

  const handleError = useCallback((err: ShaderError) => {
    shadeError(err);
  }, [shadeError]);

  // Генерация UV
  useEffect(() => {
    if (geometry && !geometry.attributes.uv) {
      generateUVs(geometry);
    }
  }, [geometry]);

  useEffect(() => {
  Object.entries(texturePropsMap).forEach(([key, texProps]) => {
    if (geometry) {
      applyTextureTransform(geometry, texProps.props);
    }
  });
}, [texturePropsMap, geometry]);

  // Загрузка и обновление текстур
  useEffect(() => {
    const current = { ...texturePropsMap };
    const prev = prevTexturePropsRef.current;

    // Определяем, изменились ли текстуры (включая props)
    const hasChanged = () => {
      if (Object.keys(current).length !== Object.keys(prev).length) return true;
      for (const key in current) {
        if (!(key in prev)) return true;
        const a = current[key];
        const b = prev[key];
        if (
          a.slot !== b.slot ||
          a.props.wrapS !== b.props.wrapS ||
          a.props.wrapT !== b.props.wrapT ||
          a.props.flipY !== b.props.flipY ||
          a.props.repeat[0] !== b.props.repeat[0] ||
          a.props.repeat[1] !== b.props.repeat[1] ||
          a.props.offset[0] !== b.props.offset[0] ||
          a.props.offset[1] !== b.props.offset[1] ||
          a.props.center[0] !== b.props.center[0] ||
          a.props.center[1] !== b.props.center[1] ||
          a.props.rotation !== b.props.rotation ||
          a.props.anisotropy !== b.props.anisotropy
        ) {
          return true;
        }
      }
      return false;
    };

    if (!hasChanged()) return;

    // Очистка старых текстур
    Object.values(loadedTextures).forEach((tex) => tex.dispose());

    const loadTextures = async () => {
      try {
        const entries = await Promise.all(
          Object.entries(current).map(async ([key, texProps]) => {
            const texture = await createTextureFromTextureProps(texProps);
            return [`u_${texProps.slot}`, texture] as const;
          })
        );
        const newTextures = Object.fromEntries(entries);
        setLoadedTextures(newTextures);
        prevTexturePropsRef.current = { ...current };
      } catch (err) {
        console.error('Texture loading failed', err);
      }
    };

    loadTextures();

    // Очистка при размонтировании
    return () => {
      Object.values(loadedTextures).forEach((tex) => tex.dispose());
    };
  }, [texturePropsMap]);

  // Анимация и uTime
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
    <mesh ref={meshRef} geometry={geometry}>
      <SafeShaderMaterial
        vertex={vertexProps}
        fragment={fragmentProps}
        textures={loadedTextures}
        onError={handleError}
      />
    </mesh>
  );
}

// После загрузки текстуры и геометрии
function applyTextureTransform(geometry: THREE.BufferGeometry, props: any) {
  const uv = geometry.attributes.uv;
  const repeat = props.repeat;
  const offset = props.offset;
  const rotation = props.rotation;
  const center = props.center;

  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i);
    let v = uv.getY(i);

    // Центрируем
    u -= center[0];
    v -= center[1];

    // Поворот (вокруг центра)
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const u2 = u * cos - v * sin;
    const v2 = u * sin + v * cos;
    u = u2;
    v = v2;

    // Масштаб и смещение
    u = u * repeat[0] + offset[0];
    v = v * repeat[1] + offset[1];

    console.log(u, v, i);

    uv.setXY(i, u, v);
  }

  uv.needsUpdate = true;
}

// Конвертирует строку в THREE-константу
const getConstant = (value: string): number => {
  const THREE_CONSTANTS: Record<string, number> = {
    RepeatWrapping: THREE.RepeatWrapping,
    ClampToEdgeWrapping: THREE.ClampToEdgeWrapping,
    MirroredRepeatWrapping: THREE.MirroredRepeatWrapping,
    NearestFilter: THREE.NearestFilter,
    LinearFilter: THREE.LinearFilter,
    NearestMipMapNearestFilter: THREE.NearestMipMapNearestFilter,
    NearestMipMapLinearFilter: THREE.NearestMipMapLinearFilter,
    LinearMipMapNearestFilter: THREE.LinearMipMapNearestFilter,
    LinearMipMapLinearFilter: THREE.LinearMipMapLinearFilter,
    LinearEncoding: THREE.LinearEncoding,
    sRGBEncoding: THREE.sRGBEncoding,
    GammaEncoding: THREE.GammaEncoding,
    RGBEEncoding: THREE.RGBEEncoding,
    RGBMEncoding: THREE.RGBMEncoding,
    RGBDEncoding: THREE.RGBD7Encoding,
    LogLuvEncoding: THREE.LogLuvEncoding,
    UVMapping: THREE.UVMapping,
    CubeReflectionMapping: THREE.CubeReflectionMapping,
    CubeRefractionMapping: THREE.CubeRefractionMapping,
    EquirectangularReflectionMapping: THREE.EquirectangularReflectionMapping,
    EquirectangularRefractionMapping: THREE.EquirectangularRefractionMapping,
    SphericalReflectionMapping: THREE.SphericalReflectionMapping,
    RGBAFormat: THREE.RGBAFormat,
    RGBFormat: THREE.RGBFormat,
    AlphaFormat: THREE.AlphaFormat,
    LuminanceFormat: THREE.LuminanceFormat,
    LuminanceAlphaFormat: THREE.LuminanceAlphaFormat,
    DepthFormat: THREE.DepthFormat,
    DepthStencilFormat: THREE.DepthStencilFormat,
    UnsignedByteType: THREE.UnsignedByteType,
    ByteType: THREE.ByteType,
    ShortType: THREE.ShortType,
    UnsignedShortType: THREE.UnsignedShortType,
    IntType: THREE.IntType,
    UnsignedIntType: THREE.UnsignedIntType,
    FloatType: THREE.FloatType,
    HalfFloatType: THREE.HalfFloatType,
  };
  return THREE_CONSTANTS[value] ?? THREE.RepeatWrapping;
};

// Загружает текстуру из File с применением props
const createTextureFromTextureProps = (
  textureProps: TextureProps
): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const blobUrl = e.target?.result as string;
      const loader = new THREE.TextureLoader();
      loader.load(
        blobUrl,
        (texture: THREE.Texture) => {
          const p = textureProps.props;

          // Применяем параметры
          texture.wrapS = getConstant(p.wrapS);
          texture.wrapT = getConstant(p.wrapT);
          texture.magFilter = getConstant(p.magFilter);
          texture.minFilter = getConstant(p.minFilter);
          texture.encoding = getConstant(p.encoding);
          texture.flipY = p.flipY;
          texture.anisotropy = p.anisotropy;

          // UV transform
          texture.repeat.set(p.repeat[0], p.repeat[1]);
          texture.offset.set(p.offset[0], p.offset[1]);
          texture.center.set(p.center[0], p.center[1]);
          texture.rotation = p.rotation;

          // 🔥 Обязательно:
          texture.matrixAutoUpdate = true;
          texture.updateMatrix(); // ← пересчитать матрицу
          texture.needsUpdate = true;

          URL.revokeObjectURL(blobUrl);
          resolve(texture);
        },
        undefined,
        (err) => {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        }
      );
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(textureProps.file);
  });
};
// Генерация UV
function generateUVs(geometry: THREE.BufferGeometry) {
  if (geometry.attributes.uv) {
    geometry.deleteAttribute('uv');
  }

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
  geometry.attributes.uv.needsUpdate = true;
}