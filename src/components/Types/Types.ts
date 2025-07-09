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
        position: [number, number, number],
    }
};