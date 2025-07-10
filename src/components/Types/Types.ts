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