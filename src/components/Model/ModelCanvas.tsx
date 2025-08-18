import { Canvas } from "@react-three/fiber"
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import {ModelObject, type ShaderError} from './ModelObject'
import type { ObjectProps } from '../Types/Types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AlertTitle } from '@mui/material'

import "./modelCanvas.css";
import type { TextureProps } from "../Main/Main"
import { extend, Canvas as R3FCanvas } from "@react-three/fiber";

// Добавляем поддержку outputEncoding
extend({});

type CameraProps = ObjectProps['camera'];

function CameraSync({ props }: { props: CameraProps }) {
  const { camera } = useThree()

  useEffect(() => {
    // Обработка position отдельно
    if (props.position && Array.isArray(props.position)) {
      camera.position.set(...props.position)
    }

    // Применение остальных свойств
    Object.entries(props).forEach(([key, value]) => {
      if (
        key !== 'position' &&
        typeof value !== 'function' &&
        value !== undefined
      ) {
        try {
          ;(camera as any)[key] = value
        } catch (err) {
          console.warn(`Error bad parametr ${key}:`, err)
        }
      }
    })

    camera.updateProjectionMatrix()
  }, [props])

  return null
}

export default function ModelCanvas(
  {
    url = "", 
    obj, 
    vertex, 
    fragment, 
    textures,
    useImportType,
    hdriUrl,
  }: {
    url: string, 
    obj: ObjectProps, 
    vertex: string, 
    fragment: string, 
    textures: Record<string, TextureProps>,
    useImportType: (uniforms: any) => void,
    hdriUrl: string
  }) {
  const [errorInfo, setErrorInfo] = useState<ShaderError | null>(null);
  const lastErrorKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (errorInfo) {
      const key = `${errorInfo.type}:${errorInfo.message}`;
      lastErrorKeyRef.current = key;
      let timeToExpire = 10000;

      if (errorInfo.type === 'success') {
        timeToExpire = 3000;
      }

      const timer = setTimeout(() => {
          setErrorInfo(null);
      }, timeToExpire);

      return () => clearTimeout(timer);
    }
  }, [errorInfo]);

  const handleError = useCallback((err: ShaderError) => {
    const key = `${err.type}:${err.message}`;
    if (lastErrorKeyRef.current === key) return; // Уже показывали
    lastErrorKeyRef.current = key;
    setErrorInfo(err);
    console.error(err);
  }, []);

  // Возможно добавить плавное скрытие уведомления
  // Авто скрытие успешной компиляции, и закрытие + долгий таймер на ошибки

  return(
      <>
      <Canvas className="canvasWindow">
          <ambientLight />
          <pointLight position={[5, 5, 5]} />
          {url && <ModelObject 
                    url={url} 
                    objectProps={obj} 
                    vertexProps={vertex} 
                    fragmentProps={fragment} 
                    shadeError={handleError} 
                    textures={textures}
                    useImportType={useImportType}
                    hdriUrl={hdriUrl}
                  />}
          <OrbitControls />
          <CameraSync props={obj.camera} />
      </Canvas>
      {errorInfo && <Alert severity={`${errorInfo.valid ? "success" : "error"}`} className="sceneAlert fade-slide-in">
        <AlertTitle>{errorInfo.type.charAt(0).toUpperCase() + errorInfo.type.slice(1)} code error</AlertTitle>
        {errorInfo.message}
      </Alert>}
      </>
  )
}