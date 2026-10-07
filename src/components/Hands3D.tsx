import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function HumanHand() {
  const { scene } = useGLTF("/models/human-hand.glb");

  return (
    <primitive
      object={scene}
      scale={2}
      position={[-1.8, -0.4, 0]}
      rotation={[0, 0, Math.PI / 5]}
    />
  );
}

function RobotHand() {
  const { scene } = useGLTF("/models/robot-hand.glb");

  return (
    <primitive
      object={scene}
      scale={2}
      position={[1.8, 0.4, 0]}
      rotation={[0, 0, -Math.PI / 5]}
    />
  );
}

export default function Hands3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 45,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />

          <directionalLight
            position={[4, 5, 6]}
            intensity={3}
          />

          <pointLight
            position={[-4, 1, 3]}
            intensity={2}
            color="#7c3aed"
          />

          <pointLight
            position={[4, -1, 3]}
            intensity={2}
            color="#38bdf8"
          />

          <HumanHand />
          <RobotHand />

          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/human-hand.glb");
useGLTF.preload("/models/robot-hand.glb");