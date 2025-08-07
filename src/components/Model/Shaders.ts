import * as THREE from 'three'

export const defaultVertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

export const defaultFragmentShader = `uniform float uTime;
varying vec2 vUv;
void main() {
  vec3 color = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0,2,4));
  gl_FragColor = vec4(color, 1.0);
}`

export function vertexShader(autoCfg: string, userCfg: string): string {
  return(
    `// Autogenerate, do not delete!
    ${autoCfg}

    // User cfg
    ${userCfg ? userCfg : 
      `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`
    }
    `
  )
} 

export function fragmentShader(autoCfg: string | null, userCfg: string): string { 
  // Всегда добавляем uvTransformFunctions, чтобы transformUV была доступна
  const baseAutoCfg = `
    ${uvTransformFunctions}
    ${autoCfg || ''}
  `;
  return(
    `// Autogenerate, do not delete!
    ${baseAutoCfg.trim()}

    // User cfg
    ${userCfg}
    `
  )
}

// Универсальная функция трансформации UV
export const uvTransformFunctions = `
vec2 transformUV(vec2 uv, vec2 repeat, vec2 offset, vec2 center, float rotation) {
    uv *= repeat;
    uv += offset;
    if (rotation != 0.0) {
        float s = sin(rotation);
        float c = cos(rotation);
        mat2 rotMatrix = mat2(c, -s, s, c);
        uv = rotMatrix * (uv - center) + center;
    }
    return uv;
}
`;

// Пример использования в fragment shader
export const exampleFragmentShader = `
${uvTransformFunctions}

uniform sampler2D u_diffuse;
uniform vec2 u_diffuse_repeat;
uniform vec2 u_diffuse_offset;
uniform vec2 u_diffuse_center;
uniform float u_diffuse_rotation;

varying vec2 vUv;

void main() {
  vec2 transformedUV = transformUV(vUv, u_diffuse_repeat, u_diffuse_offset, u_diffuse_center, u_diffuse_rotation);
  gl_FragColor = texture2D(u_diffuse, transformedUV);
}
`;