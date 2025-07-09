import { Canvas } from "@react-three/fiber"
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Model from "./ModelObject"
import type { ObjectProps } from "../Types/Types"
import { useEffect } from "react"

type CameraProps = ObjectProps['camera'];


export default function ModelCanvas({url = "", obj}: {url: string, obj: ObjectProps}) {
    console.log(obj.camera)

    return(
        <Canvas className="canvasWindow">
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            {url && <Model url={url} objectProps={obj} />}
            <OrbitControls />
            <CameraSync props={obj.camera} />
        </Canvas>
    )
}

function CameraSync({ props }: { props: CameraProps }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(...props.position)
    camera.fov = props.fov;
    camera.updateProjectionMatrix();
  }, [props]) 

  return null // этот компонент ничего не рендерит, только синхронизирует
}