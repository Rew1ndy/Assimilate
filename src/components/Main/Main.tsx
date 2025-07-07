import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber"
import { styled, ThemeProvider } from '@mui/material/styles';
import { OrbitControls } from '@react-three/drei'
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Model from "../Model/Model";
import "./main.css";
import { Editor } from "@monaco-editor/react";
import SendIcon from '@mui/icons-material/Send';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

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

import { createTheme } from '@mui/material/styles';
import { purple } from '@mui/material/colors';
import { customTheme } from "../../Themes/Theme";

const theme = createTheme({
  palette: {
    primary: {
      main: purple[500],
    },
    secondary: {
      main: '#f44336',
    },
  },
});

export type ObjectProps = {
  rotation: {
    axis: 'x' | 'y' | 'z';
    speed: number;
    direction: number;
  };
  scale: [number, number, number];     // строго трёхмерный вектор
  position: [number, number, number];  // то же самое
};


export default function Main() {
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string>("");
    const [editorText, setEditorText] = useState<String | undefined>();
    // const [direction, setDirection] = useState<number>(1);
    // const [rotationSpeed, setRotationSpeed] = useState<number>(30);
    const [objectProps, setObjectProps] = useState<ObjectProps>({
        rotation: { axis: 'z', speed: 0.005, direction: 1 },
        scale: [1, 1, 1],
        position: [0, 0, 0],
    })

    const handleFileUpload = (obj: { target: HTMLInputElement; }) => {
        const file = obj.target.files?.[0] || null;
        setFileUpload(file);
        // console.log(fileUpload)
    }

    const updateDirection = (dir: number) => {
    setObjectProps(prev => ({
        ...prev,
        rotation: {
        ...prev.rotation,
        direction: dir,
        },
    }))
    }

    const updateSpeed = (speed: number) => {
    setObjectProps(prev => ({
        ...prev,
        rotation: {
        ...prev.rotation,
        speed,
        },
    }))
    }

    useEffect(() => {
        console.log(fileUpload);
        if (fileUpload) {
            setFileURL(URL.createObjectURL(fileUpload));
        }

        return () => {
            
        };
    }, [fileUpload])

    useEffect(() => {
        
        return () => {
            
        };
    }, []);

    return (
        <ThemeProvider theme={customTheme}>
            <div className="main">
                <Canvas camera={{ position: [0, -3, 1], rotateY: -30 }} className="MainCanvas">
                    <ambientLight />
                    <pointLight position={[5, 5, 5]} />
                    {fileURL && <Model url={fileURL} objectProps={objectProps} />}
                    <OrbitControls />
                </Canvas>

                {/* <input type="file" accept=".stl,.glb" onChange={handleFileUpload} multiple={false} /> */}
                <Button
                        component="label"
                        role={undefined}
                        variant="contained"
                        color="secondary"
                        tabIndex={-1}
                        startIcon={<CloudUploadIcon />}
                    >
                    Upload files
                    <VisuallyHiddenInput
                        type="file"
                        accept=".stl,.glb"
                        // onChange={(event) => console.log(event.target.files)}
                        onChange={handleFileUpload} 
                        multiple={false}
                    />
                </Button>

                <div className="editor">
                    <Editor 
                        // height="100%" 
                        defaultLanguage="javascript" 
                        defaultValue="// some comment" 
                        theme="vs-dark"
                        onChange={e => setEditorText(e)}
                    />
                    <div className="editor-buttons" style={{ display: 'flex', gap: 12 }}>
                        <Button color="primary" variant="outlined" endIcon={<PlayCircleOutlineIcon />}>
                        </Button>
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronLeftIcon />} 
                            onClick={() => updateDirection(-1)}
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            endIcon={<ChevronRightIcon />} 
                            onClick={() => updateDirection(1)}
                        />
                        <Button variant="outlined" color="info" endIcon={<InfoIcon />}>
                        </Button>
                    </div>
                    <Slider
                        aria-label="Rotation speed"
                        defaultValue={objectProps.rotation.speed}
                        value={objectProps.rotation.speed}
                        onChange={(e, value) => {
                            if (typeof value === 'number') updateSpeed(value)
                        }}
                        step={0.001}
                        marks
                        min={0.001}
                        max={0.01}
                        valueLabelDisplay="auto"
                    />
                </div>
            </div>
        </ThemeProvider>

    )
}