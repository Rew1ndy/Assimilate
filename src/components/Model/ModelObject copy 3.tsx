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
    uniform mat3 normalMatrix;
    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;
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

// Генерация шейдеров на основе mapping
function getShaders(mapping: string) {
  let vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  let fragmentShader = `
    precision mediump float;
    uniform sampler2D u_map;
    uniform vec2 u_repeat;
    uniform vec2 u_offset;
    uniform vec2 u_center;
    uniform float u_rotation;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
  `;

  if (mapping === 'UVMapping') {
    fragmentShader += `
      vec2 uv = vUv;
      uv -= u_center;
      float cosA = cos(u_rotation);
      float sinA = sin(u_rotation);
      uv = vec2(
        uv.x * cosA - uv.y * sinA,
        uv.x * sinA + uv.y * cosA
      );
      uv = uv * u_repeat + u_offset;
      uv += u_center;
      gl_FragColor = texture2D(u_map, uv);
    `;
  } else if (mapping === 'CubeReflectionMapping' || mapping === 'CubeRefractionMapping') {
    fragmentShader += `
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      vec3 texCoord = ${mapping === 'CubeRefractionMapping' ? 'refract(viewDir, vNormal, 0.5)' : 'reflect(viewDir, vNormal)'};
      gl_FragColor = textureCube(u_map, texCoord);
    `;
  } else if (mapping === 'EquirectangularReflectionMapping' || mapping === 'EquirectangularRefractionMapping') {
    fragmentShader += `
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      vec2 uv = vec2(
        atan(viewDir.z, viewDir.x) / 6.28318530718 + 0.5,
        acos(viewDir.y) / 3.14159265359
      );
      uv = uv * u_repeat + u_offset;
      gl_FragColor = texture2D(u_map, uv);
    `;
  } else if (mapping === 'SphericalReflectionMapping') {
    fragmentShader += `
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      vec2 uv = vec2(
        0.5 + 0.5 * viewDir.x / length(viewDir.xz),
        0.5 - 0.5 * viewDir.y
      );
      uv = uv * u_repeat + u_offset;
      gl_FragColor = texture2D(u_map, uv);
    `;
  } else {
    fragmentShader += `
      gl_FragColor = texture2D(u_map, vUv); // Fallback to UVMapping
    `;
  }

  fragmentShader += `
    }
  `;

  return { vertexShader, fragmentShader };
}

// SafeShaderMaterial
const SafeShaderMaterial = ({
  textures,
  onError,
  texturePropsMap,
}: {
  textures: Record<string, THREE.Texture>;
  onError: (error: ShaderError) => void;
  texturePropsMap: Record<string, TextureProps>;
}) => {
  const [material, setMaterial] = useState<THREE.Material | null>(null);
  const materialRef = useRef<THREE.Material | null>(null);

  const mapTexture = Object.entries(texturePropsMap).find(([_, texProps]) => texProps.slot === 'map');
  const mapping = mapTexture ? mapTexture[1].props.mapping || 'UVMapping' : 'UVMapping';
  const { vertexShader, fragmentShader } = useMemo(() => getShaders(mapping), [mapping]);

  const uniforms = useMemo(() => {
    console.log('Textures in uniforms:', textures);
    const p = mapTexture ? mapTexture[1].props : { repeat: [1, 1], offset: [0, 0], center: [0, 0], rotation: 0 };
    return {
      uTime: { value: 0 },
      u_map: { value: textures.u_map || null },
      u_repeat: { value: new THREE.Vector2(p.repeat[0], p.repeat[1]) },
      u_offset: { value: new THREE.Vector2(p.offset[0], p.offset[1]) },
      u_center: { value: new THREE.Vector2(p.center[0], p.center[1]) },
      u_rotation: { value: p.rotation },
    };
  }, [textures, texturePropsMap]);

  useEffect(() => {
    if (!textures.u_map) {
      console.warn('No texture for u_map, using fallback MeshBasicMaterial');
      const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true });
      setMaterial(fallbackMaterial);
      materialRef.current = fallbackMaterial;
      return;
    }

    const validation = validateShaderInWebGL(vertexShader, fragmentShader);
    let newMaterial: THREE.Material;

    if (!validation.valid) {
      console.error('Shader validation failed:', validation);
      onError({
        type: validation.type || 'webgl',
        message: parseGlslError(validation.log),
        raw: validation.log,
        valid: false,
      });
      newMaterial = new THREE.MeshBasicMaterial({
        map: textures.u_map,
        transparent: true,
      });
    } else {
      onError({
        type: 'success',
        message: 'Shader compiled successfully',
        raw: validation.log,
        valid: true,
      });
      console.log('Shader validation success');

      newMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { ...uniforms },
        transparent: true,
        uniformsNeedUpdate: true,
      });
    }

    setMaterial(newMaterial);
    materialRef.current = newMaterial;

    return () => {
      if (materialRef.current && materialRef.current !== newMaterial) {
        materialRef.current.dispose();
      }
    };
  }, [vertexShader, fragmentShader, uniforms, textures, onError]);

  useFrame(({ clock }) => {
    if (materialRef.current && 'uniforms' in materialRef.current && materialRef.current.uniforms.u_map?.value) {
      const mat = materialRef.current as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = clock.getElapsedTime();
      const mapTexture = Object.entries(texturePropsMap).find(([_, texProps]) => texProps.slot === 'map');
      if (mapTexture) {
        const [, texProps] = mapTexture;
        mat.uniforms.u_repeat.value.set(texProps.props.repeat[0], texProps.props.repeat[1]);
        mat.uniforms.u_offset.value.set(
          texProps.props.offset[0] + Math.sin(clock.getElapsedTime()) * 0.1,
          texProps.props.offset[1] + Math.cos(clock.getElapsedTime()) * 0.1
        );
        mat.uniforms.u_center.value.set(texProps.props.center[0], texProps.props.center[1]);
        mat.uniforms.u_rotation.value = texProps.props.rotation;
        mat.uniformsNeedUpdate = true;
        console.log('Texture parameters animated:', {
          offset: mat.uniforms.u_offset.value.toArray(),
          repeat: mat.uniforms.u_repeat.value.toArray(),
          center: mat.uniforms.u_center.value.toArray(),
          rotation: mat.uniforms.u_rotation.value,
          mapping: mapTexture[1].props.mapping || 'UVMapping',
        });
      }
    }
  });

  console.log('Material:', material);

  return material ? <primitive object={material} attach="material" /> : null;
};

// ModelObject
export function ModelObject({
  url,
  objectProps,
  vertexProps: _vertexProps, // Игнорируем, используем getShaders
  fragmentProps: _fragmentProps, // Игнорируем, используем getShaders
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
  const prevTexturesRef = useRef<Record<string, TextureProps>>({});

  const handleError = useCallback((err: ShaderError) => {
    shadeError(err);
    console.log('Shader error:', err);
  }, [shadeError]);

  // Логирование данных объекта
  useEffect(() => {
    if (geometry) {
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      const bbox = geometry.boundingBox!;
      const size = new THREE.Vector3();
      bbox.getSize(size);
      console.log('Object data:', {
        vertexCount: geometry.attributes.position.count,
        boundingBox: {
          min: { x: bbox.min.x, y: bbox.min.y, z: bbox.min.z },
          max: { x: bbox.max.x, y: bbox.max.y, z: bbox.max.z },
        },
        size: { x: size.x, y: size.y, z: size.z },
        hasNormals: !!geometry.attributes.normal,
      });
      console.log('UV attribute exists:', !!geometry.attributes.uv);
    }
  }, [geometry]);

  // Генерация начальных UV
  useEffect(() => {
    if (geometry && !geometry.attributes.uv) {
      generateUVs(geometry);
      console.log('UVs generated for geometry');
    }
  }, [geometry]);

  // Загрузка и обновление текстур
  useEffect(() => {
    const current = { ...texturePropsMap };
    const prev = prevTexturesRef.current;

    const hasTextureChanged = () => {
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
          a.props.anisotropy !== b.props.anisotropy ||
          a.props.mapping !== b.props.mapping
        ) {
          return true;
        }
      }
      return false;
    };

    if (!hasTextureChanged()) return;

    console.log('Texture props changed, reloading textures:', texturePropsMap);

    Object.values(loadedTextures).forEach((tex) => tex.dispose());

    const loadTextures = async () => {
      try {
        const entries = await Promise.all(
          Object.entries(current).map(async ([key, texProps]) => {
            if (!texProps.file) {
              console.error(`No file provided for texture ${key}`);
              return null;
            }
            const texture = await createTextureFromTextureProps(texProps);
            return [`u_${texProps.slot}`, texture] as const;
          })
        );
        const validEntries = entries.filter((entry): entry is [string, THREE.Texture] => entry !== null);
        const newTextures = Object.fromEntries(validEntries);
        setLoadedTextures(newTextures);
        prevTexturesRef.current = { ...current };

        console.log('Texture props from texturePropsMap:', texturePropsMap);
        Object.entries(newTextures).forEach(([key, texture]) => {
          console.log(`Texture ${key} applied:`, {
            repeat: texture.repeat.toArray(),
            offset: texture.offset.toArray(),
            center: texture.center.toArray(),
            rotation: texture.rotation,
            wrapS: texture.wrapS,
            wrapT: texture.wrapT,
            magFilter: texture.magFilter,
            minFilter: texture.minFilter,
            encoding: texture.encoding,
            flipY: texture.flipY,
            anisotropy: texture.anisotropy,
            mapping: texture.mapping,
          });
        });
      } catch (err) {
        console.error('Texture loading failed:', err);
      }
    };

    loadTextures();

    return () => {
      Object.values(loadedTextures).forEach((tex) => tex.dispose());
    };
  }, [texturePropsMap]);

  // Синхронизация параметров текстур
  useEffect(() => {
    Object.entries(texturePropsMap).forEach(([key, texProps]) => {
      const texture = loadedTextures[`u_${texProps.slot}`];
      if (!texture) return;

      const p = texProps.props;
      texture.wrapS = getConstant(p.wrapS);
      texture.wrapT = getConstant(p.wrapT);
      texture.magFilter = getConstant(p.magFilter);
      texture.minFilter = getConstant(p.minFilter);
      texture.encoding = getConstant(p.encoding);
      texture.flipY = p.flipY;
      texture.anisotropy = p.anisotropy;
      texture.mapping = getConstant(p.mapping || 'UVMapping');

      texture.repeat.set(p.repeat[0], p.repeat[1]);
      texture.offset.set(p.offset[0], p.offset[1]);
      texture.center.set(p.center[0], p.center[1]);
      texture.rotation = p.rotation;

      texture.matrixAutoUpdate = true;
      texture.updateMatrix();
      texture.needsUpdate = true;

      console.log(`Texture ${key} updated:`, {
        repeat: texture.repeat.toArray(),
        offset: texture.offset.toArray(),
        center: texture.center.toArray(),
        rotation: texture.rotation,
        mapping: texture.mapping,
      });
    });
  }, [texturePropsMap, loadedTextures]);

  // Анимация объекта
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (mesh && objectProps?.object.rotation.isRotating) {
      const { axis, speed, direction } = objectProps.object.rotation;
      mesh.rotation[axis] += speed * direction;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <SafeShaderMaterial
        textures={loadedTextures}
        texturePropsMap={texturePropsMap}
        onError={handleError}
      />
    </mesh>
  );
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
  return THREE_CONSTANTS[value] ?? THREE.UVMapping;
};

// Загружает текстуру из File
const createTextureFromTextureProps = (textureProps: TextureProps): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    if (!textureProps.file) {
      console.error('No file provided for texture');
      reject(new Error('No file provided for texture'));
      return;
    }

    const isCubeMapping = textureProps.props.mapping === 'CubeReflectionMapping' || textureProps.props.mapping === 'CubeRefractionMapping';
    const files = Array.isArray(textureProps.file) ? textureProps.file : [textureProps.file];

    if (isCubeMapping && files.length !== 6) {
      console.error('Cube mapping requires exactly 6 images, got:', files.length);
      reject(new Error('Cube mapping requires 6 images'));
      return;
    }

    const loadSingleTexture = (file: File) => {
      return new Promise<string>((resolveFile, rejectFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const blobUrl = e.target?.result as string;
          resolveFile(blobUrl);
        };
        reader.onerror = () => rejectFile(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };

    const loadTextures = async () => {
      try {
        const urls = await Promise.all(files.map(loadSingleTexture));
        const loader = isCubeMapping ? new THREE.CubeTextureLoader() : new THREE.TextureLoader();
        
        loader.load(
          isCubeMapping ? urls : urls[0],
          (texture: THREE.Texture | THREE.CubeTexture) => {
            const p = textureProps.props;
            texture.wrapS = getConstant(p.wrapS);
            texture.wrapT = getConstant(p.wrapT);
            texture.magFilter = getConstant(p.magFilter);
            texture.minFilter = getConstant(p.minFilter);
            texture.encoding = getConstant(p.encoding);
            texture.flipY = p.flipY;
            texture.anisotropy = p.anisotropy;
            texture.mapping = getConstant(p.mapping || 'UVMapping');

            texture.repeat.set(p.repeat[0], p.repeat[1]);
            texture.offset.set(p.offset[0], p.offset[1]);
            texture.center.set(p.center[0], p.center[1]);
            texture.rotation = p.rotation;

            texture.matrixAutoUpdate = true;
            texture.updateMatrix();
            texture.needsUpdate = true;

            console.log('Texture loaded successfully:', textureProps.file, {
              mapping: texture.mapping,
              isCubeTexture: texture instanceof THREE.CubeTexture,
            });
            urls.forEach((url) => URL.revokeObjectURL(url));
            resolve(texture);
          },
          undefined,
          (err) => {
            console.error('Texture loading error:', err);
            urls.forEach((url) => URL.revokeObjectURL(url));
            reject(err);
          }
        );
      } catch (err) {
        console.error('Texture loading failed:', err);
        reject(err);
      }
    };

    loadTextures();
  });
};

// Генерация начальных UV
function generateUVs(geometry: THREE.BufferGeometry) {
  if (geometry.attributes.uv) {
    geometry.deleteAttribute('uv');
  }

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  if (size.z === 0 || size.x === 0) {
    console.error('Invalid bounding box size for UV generation:', size);
    return;
  }

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
  console.log('UVs set for geometry, attribute count:', uvAttr.length / 2);
}