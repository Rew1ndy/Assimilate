import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from '@react-three/drei'
import Model from "../Model/Model";

export default function Main() {
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>("");

    const handleFileUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setFileUpload(file);
        // console.log(fileUpload)
    }

    useEffect(() => {
        console.log(fileUpload);
        if (fileUpload) {
            setFileURL(URL.createObjectURL(fileUpload));
        }

        return () => {
            
        };
    }, [fileUpload]);

    return (
        <div className="wrapper">
            <Canvas camera={{ position: [2, 2, 2], rotateX: 90 }}>
                <ambientLight />
                <pointLight position={[5, 5, 5]} />
                {fileURL && <Model url={fileURL} />}
                <OrbitControls />
            </Canvas>

            <input type="file" accept=".stl,.glb" onChange={handleFileUpload} multiple={false} />
        </div>
    )
}