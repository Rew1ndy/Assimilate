import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber"
import { styled } from '@mui/material/styles';
import { OrbitControls } from '@react-three/drei'
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Model from "../Model/Model";
import "./main.css";
import { Editor } from "@monaco-editor/react";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

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
        <div className="main">
            <Canvas camera={{ position: [0, -3, 1], rotateY: -30 }} className="MainCanvas">
                <ambientLight />
                <pointLight position={[5, 5, 5]} />
                {fileURL && <Model url={fileURL} />}
                <OrbitControls />
            </Canvas>

            {/* <input type="file" accept=".stl,.glb" onChange={handleFileUpload} multiple={false} /> */}
            <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    startIcon={<CloudUploadIcon />}
                >
                Upload files
                <VisuallyHiddenInput
                    type="file"
                    // onChange={(event) => console.log(event.target.files)}
                    onChange={handleFileUpload} 
                    multiple={false}
                />
            </Button>

            <Editor 
                height="100%" 
                defaultLanguage="javascript" 
                defaultValue="// some comment" 
                theme="vs-dark"
            />;
        </div>
    )
}