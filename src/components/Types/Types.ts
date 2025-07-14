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
