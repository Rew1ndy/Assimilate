import { Canvas } from "@react-three/fiber"
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Model from "./ModelObject"
import type { ObjectProps } from "../Types/Types"
import { useEffect } from "react"

type CameraProps = ObjectProps['camera'];


export default function ModelCanvas({url = "", obj, vertex, fragment}: {url: string, obj: ObjectProps, vertex: string, fragment: string}) {
    // console.log(obj.camera)
    // console.log(EventHandlers)

    return(
        <Canvas className="canvasWindow">
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            {url && <Model url={url} objectProps={obj} vertexProps={vertex} fragmentProps={fragment} />}
            <OrbitControls />
            <CameraSync props={obj.camera} />
        </Canvas>
    )
}

function CameraSync({ props }: { props: Record<string, any> }) {
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

// function CameraSync({ props }: { props: CameraProps }) {
//   const { camera } = useThree()

//   useEffect(() => {
//     camera.position.set(...props.position)
//     camera.fov = props.fov;
//     camera.updateProjectionMatrix();
//   }, [props]) 

//   return null // этот компонент ничего не рендерит, только синхронизирует
// }