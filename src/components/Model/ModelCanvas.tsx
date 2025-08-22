import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from '@react-three/drei';
import { ModelObject, type ShaderError } from './ModelObject';
import type { HdriProps, ObjectProps, TextureProps } from '../Types/Types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, MenuItem, Select, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { DownloadForOfflineOutlined, PlayCircleOutline, StopCircleOutlined, Camera } from '@mui/icons-material';
import "./modelCanvas.css";
import * as THREE from 'three';

const resolutions = [
  { key: 'custom', w: 0, h: 0 },
  { key: '360p', w: 640, h: 360 },
  { key: '480p', w: 854, h: 480 },
  { key: '720p', w: 1280, h: 720 },
  { key: '900p', w: 1600, h: 900 },
  { key: '1080p', w: 1920, h: 1080 },
  { key: '1440p', w: 2560, h: 1440 },
  { key: '1800p', w: 3200, h: 1800 },
  { key: '2160p', w: 3840, h: 2160 },
];

type CameraProps = ObjectProps['camera'];

function CameraSync({ props }: { props: CameraProps }) {
  const { camera } = useThree();

  useEffect(() => {
    if (props.position && Array.isArray(props.position)) {
      camera.position.set(...props.position);
    }
    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'position' && typeof value !== 'function' && value !== undefined) {
        try {
          (camera as any)[key] = value;
        } catch (err) {
          console.warn(`Error bad parameter ${key}:`, err);
        }
      }
    });
    camera.updateProjectionMatrix();
  }, [props]);

  return null;
}

function CanvasSizeSync({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const width = canvas.clientWidth || 1920;
      const height = canvas.clientHeight || 1080;
      gl.setSize(width, height, false);
      gl.setPixelRatio(window.devicePixelRatio);
      console.log(`Canvas size updated: ${width}x${height}`);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [gl, canvasRef]);

  return null;
}

export default function ModelCanvas({
  url = "",
  obj,
  vertex,
  fragment,
  textures,
  useImportType,
  hdriUrl,
  hdriProps,
  sceneProps
}: {
  url: string;
  obj: ObjectProps;
  vertex: string;
  fragment: string;
  textures: Record<string, typeof TextureProps>;
  useImportType: (uniforms: any) => void;
  hdriUrl: string | null;
  hdriProps?: HdriProps;
  sceneProps: { sceneColor: string }
}) {
  const [errorInfo, setErrorInfo] = useState<ShaderError | null>(null);
  const lastErrorKeyRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const [recordProps, setRecordProps] = useState({
    resolutionKey: 'custom',
    resolution: { w: 1920, h: 1080 },
    type: 'webm',
    fps: 30, // Add default FPS
  });
  const [isVideoRecording, setIsVideoRecording] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || recordProps.resolutionKey !== 'custom') return;

    const width = canvas.clientWidth || 1920;
    const height = canvas.clientHeight || 1080;
    setRecordProps((prev) => ({
      ...prev,
      resolution: { w: width, h: height },
    }));
    console.log(`Custom resolution updated: ${width}x${height}`);
  }, [canvasRef.current?.clientWidth, canvasRef.current?.clientHeight, recordProps.resolutionKey]);

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
    if (lastErrorKeyRef.current === key) return;
    lastErrorKeyRef.current = key;
    setErrorInfo(err);
    console.error(err);
  }, []);

  function RecorderBridge() {
    const { scene, camera } = useThree();
    const { start, stop, renderFrame } = useHiddenRecorder({
      scene,
      camera,
      resolution: recordProps.resolution,
      fps: recordProps.fps, // Pass FPS
      recorderRef,
    });

    useEffect(() => {
      let id: number;
      const loop = () => {
        renderFrame();
        id = requestAnimationFrame(loop);
      };
      if (isVideoRecording) loop();
      return () => cancelAnimationFrame(id);
    }, [renderFrame, isVideoRecording]);

    useEffect(() => {
      if (isVideoRecording) start();
      else stop();
    }, [isVideoRecording, start, stop]);

    return null;
  }

  return (
    <>
      <Canvas ref={canvasRef} className="canvasWindow">
        <CanvasSizeSync canvasRef={canvasRef} />
        <RecorderBridge />
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        {url && (
          <ModelObject
            url={url}
            objectProps={obj}
            vertexProps={vertex}
            fragmentProps={fragment}
            shadeError={handleError}
            textures={textures}
            useImportType={useImportType}
            hdriUrl={hdriUrl}
            hdriProps={hdriProps}
            sceneProps={sceneProps}
          />
        )}
        <OrbitControls />
        <CameraSync props={obj.camera} />
      </Canvas>
      {errorInfo && (
        <Alert severity={`${errorInfo.valid ? "success" : "error"}`} className="sceneAlert fade-slide-in">
          <AlertTitle>{errorInfo.type.charAt(0).toUpperCase() + errorInfo.type.slice(1)} code error</AlertTitle>
          {errorInfo.message}
        </Alert>
      )}
      <div className="canvas-record">
        <Camera className={`record-status ${isVideoRecording ? 'record-active' : ''}`} />
        <h3>Record</h3>
        {/* <div ref={statusRef} className={`record-status ${isVideoRecording ? 'record-active' : ''}`} /> */}
        <Button
          startIcon={isVideoRecording ? <DownloadForOfflineOutlined /> : <PlayCircleOutline />}
          onClick={() => {
            setIsVideoRecording(!isVideoRecording);
            statusRef.current?.classList.toggle("record-active");
          }}
        >
          {/* {isVideoRecording ? 'Stop & Save' : 'Start Recording'} */}
        </Button>
        <Select
          value={recordProps.resolutionKey}
          className="record-res"
          onChange={(e) => {
            const selectedKey = e.target.value;
            const selectedRes = resolutions.find((r) => r.key === selectedKey);
            if (!selectedRes) return;

            const width = selectedKey === 'custom' ? canvasRef.current?.clientWidth || 1920 : selectedRes.w;
            const height = selectedKey === 'custom' ? canvasRef.current?.clientHeight || 1080 : selectedRes.h;

            setRecordProps((prev) => ({
              ...prev,
              resolutionKey: selectedKey,
              resolution: { w: width, h: height },
            }));
          }}
        >
          {resolutions.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              {option.key === 'custom' ? `c-${canvasRef.current?.clientHeight || 1080}p` : `${option.h}p`}
            </MenuItem>
          ))}
        </Select>
        <TextField
          label="FPS"
          type="number"
          value={recordProps.fps}
          className="record-fps"
          onChange={(e) => {
            const fps = parseInt(e.target.value);
            if (!isNaN(fps) && fps > 0 && fps <= 120) { // Validate FPS
              setRecordProps((prev) => ({
                ...prev,
                fps,
              }));
            }
          }}
          aria-valuemax={ 120 } //={{ min: 1, max: 120 }}
          aria-valuemin={ 1 }
          size="small"
          style={{ width: 100, marginLeft: 10 }}
        />
      </div>
    </>
  );
}

function useHiddenRecorder({
  scene,
  camera,
  resolution = { w: 1920, h: 1080 },
  fps = 30,
  recorderRef,
}: {
  scene: THREE.Scene;
  camera: THREE.Camera;
  resolution: { w: number; h: number };
  fps?: number;
  recorderRef: React.MutableRefObject<MediaRecorder | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const validatedFps = Math.max(1, Math.min(fps || 30, 120)); // Ensure FPS is 1–120
    const canvas = document.createElement('canvas');
    const width = resolution.w || 1920;
    const height = resolution.h || 1080;
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    rendererRef.current = renderer;

    const stream = canvas.captureStream(validatedFps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        console.log('Chunk received, size:', e.data.size);
      }
    };
    recorder.onstop = () => {
      console.log('Recorder stopped, chunks:', chunksRef.current.length);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      console.log('Blob size:', blob.size);
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene-recording-${width}x${height}-${validatedFps}fps.webm`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.warn('No data to save: empty blob');
      }
      chunksRef.current = [];
    };

    return () => {
      canvas.remove();
      renderer.dispose();
      if (recorder.state === 'recording') recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [scene, camera, resolution.w, resolution.h, fps, recorderRef]);

  const start = () => {
    if (recorderRef.current && recorderRef.current.state !== 'recording') {
      recorderRef.current.start();
      console.log(`Recording started at ${resolution.w}x${resolution.h}, ${fps} FPS`);
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
      console.log('Recording stopped');
    }
  };

  const renderFrame = () => {
    if (rendererRef.current && scene && camera) {
      rendererRef.current.render(scene, camera);
    }
  };

  return { start, stop, renderFrame };
}