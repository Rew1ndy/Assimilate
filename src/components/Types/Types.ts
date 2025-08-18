export type ObjectProps = {
    object: {
        rotation: {
            axis: 'x' | 'y' | 'z';
            speed: number;
            direction: number;
            isRotating: boolean;
        };
        scale: [number, number, number]; 
        position: [number, number, number]; 
    },
    camera: {
        fov: number,
        near?: number,
        aspect?: number,
        far?: number,
        zoom?: number,
        focus?: number,
        filmOffset?: number,
        position: [number, number, number],
        rotation?: [number, number, number],
        up?: [number, number, number],
    }
};

export const defaultObjectProps: ObjectProps = {
  object: {
    rotation: {
      axis: 'x',
      speed: 0,
      direction: 0,
      isRotating: false,
    },
    scale: [0, 0, 0],
    position: [0, 0, 0],
  },
  camera: {
    fov: 0,
    position: [0, 0, 0],
    near: 0,
    aspect: 0,
    far: 0,
    zoom: 0,
    focus: 0,
    filmOffset: 0,
    rotation: [0, 0, 0],
    up: [0, 0, 0],
  }
}

export const TextureSlot = [
    "map",  
    "normalMap",
    "roughnessMap",
    "metalnessMap",
    "aoMap",
    "displacementMap",
    "envMap",
    "alphaMap",
    "hdri"
]

export const TextureProps = {
  "slot": TextureSlot,
  "select" : {
    "wrapS": [
      "RepeatWrapping",
      "ClampToEdgeWrapping",
      "MirroredRepeatWrapping"
    ],
    "wrapT": [
      "RepeatWrapping",
      "ClampToEdgeWrapping",
      "MirroredRepeatWrapping"
    ],
    "encoding": [
      "LinearEncoding",
      "sRGBEncoding",
      "GammaEncoding",
      "RGBEEncoding",
      "RGBMEncoding",
      "RGBDEncoding",
      "LogLuvEncoding"
    ],
    "magFilter": [
      "NearestFilter",
      "LinearFilter"
    ],
    "minFilter": [
      "NearestFilter",
      "LinearFilter",
      "NearestMipMapNearestFilter",
      "NearestMipMapLinearFilter",
      "LinearMipMapNearestFilter",
      "LinearMipMapLinearFilter"
    ],
    "mapping": [
      "UVMapping",
      "CubeReflectionMapping",
      "CubeRefractionMapping",
      "EquirectangularReflectionMapping",
      "EquirectangularRefractionMapping",
      "SphericalReflectionMapping"
    ],
    "format": [
      "RGBAFormat",
      "RGBFormat",
      "AlphaFormat",
      "LuminanceFormat",
      "LuminanceAlphaFormat",
      "DepthFormat",
      "DepthStencilFormat"
    ],
    "type": [
      "UnsignedByteType",
      "ByteType",
      "ShortType",
      "UnsignedShortType",
      "IntType",
      "UnsignedIntType",
      "FloatType",
      "HalfFloatType"
    ]
  },
  "values" : {
    "repeat": [1, 1], // Vector2, number x2 (suggested range: 0.1–10)
    "offset": [0, 0], // Vector2, number x2 (range: -1 to 1)
    "center": [0, 0], // Vector2, number x2 (default: 0)
  },
  "slider" : {
    "rotation": 0, // (radians: 0 to 2π, degrees: 0° to 360°) /// Slider
    "anisotropy": 1, // (integer: 1 to 16)
  },
  "switch" : {
    "flipY": false, /// Switch
  }
}

export const DefaultTextureProps = {
  "wrapS": "RepeatWrapping",
  "wrapT": "RepeatWrapping",
  "encoding": "sRGBEncoding",
  "magFilter": "NearestFilter",
  "minFilter": "NearestFilter",
  "mapping": "UVMapping",
  "format": "RGBAFormat",
  "type": "UnsignedByteType",
  "repeat": [1, 1],
  "offset": [0, 0], 
  "center": [0, 0],
  "anisotropy": 1, 
  "rotation": 0,
  "flipY": false,
}


// export const TextureProps.old = {
//   "wrapS": [
//     "RepeatWrapping",
//     "ClampToEdgeWrapping",
//     "MirroredRepeatWrapping"
//   ],
//   "wrapT": [
//     "RepeatWrapping",
//     "ClampToEdgeWrapping",
//     "MirroredRepeatWrapping"
//   ],
//   "repeat": [1, 1], // Vector2, number x2 (suggested range: 0.1–10)
//   "offset": [0, 0], // Vector2, number x2 (range: -1 to 1)
//   "center": [0, 0], // Vector2, number x2 (default: 0)
//   "rotation": 0, // (radians: 0 to 2π, degrees: 0° to 360°) /// Slider
//   "flipY": false, /// Checkbox
//   "encoding": [
//     "LinearEncoding",
//     "sRGBEncoding",
//     "GammaEncoding",
//     "RGBEEncoding",
//     "RGBMEncoding",
//     "RGBDEncoding",
//     "LogLuvEncoding"
//   ],
//   "anisotropy": 1, // (integer: 1 to 16)
//   "magFilter": [
//     "NearestFilter",
//     "LinearFilter"
//   ],
//   "minFilter": [
//     "NearestFilter",
//     "LinearFilter",
//     "NearestMipMapNearestFilter",
//     "NearestMipMapLinearFilter",
//     "LinearMipMapNearestFilter",
//     "LinearMipMapLinearFilter"
//   ],
//   "mapping": [
//     "UVMapping",
//     "CubeReflectionMapping",
//     "CubeRefractionMapping",
//     "EquirectangularReflectionMapping",
//     "EquirectangularRefractionMapping",
//     "SphericalReflectionMapping"
//   ],
//   "format": [
//     "RGBAFormat",
//     "RGBFormat",
//     "AlphaFormat",
//     "LuminanceFormat",
//     "LuminanceAlphaFormat",
//     "DepthFormat",
//     "DepthStencilFormat"
//   ],
//   "type": [
//     "UnsignedByteType",
//     "ByteType",
//     "ShortType",
//     "UnsignedShortType",
//     "IntType",
//     "UnsignedIntType",
//     "FloatType",
//     "HalfFloatType"
//   ]
// }
