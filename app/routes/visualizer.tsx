import { OrbitControls, Text } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { Euler, Mesh, AxesHelper as ThreeAxesHelper, Vector3 } from 'three';

import type { Pose3d } from '~/lib/generated/wpimath/wpimath_wasm';
import { type MainModule, initWpimath } from '~/lib/wpilib/wpimath';

// Helper to convert NWU to Three.js
const nwuPoseToThree = (pose: Pose3d) => {
  const rotation = pose.getRotation();
  return {
    position: new Vector3(-pose.getY(), pose.getZ(), pose.getX()), // NWU -> Three.js
    rotation: new Euler(
      rotation.getX(), // roll
      -rotation.getZ(), // yaw (negated for Three.js)
      rotation.getY(), // pitch
    ),
  };
};

// Component to draw labeled axes
function LabeledAxes({ size = 2 }: { size?: number }) {
  return (
    <>
      {/* AxesHelper */}
      <primitive object={new ThreeAxesHelper(size)} />

      {/* X axis label (red, points left in NWU) */}
      <Text
        position={[-size, 0, 0]}
        color="red"
        fontSize={0.3}
        rotation={[0, Math.PI / 2, 0]} // rotate to align with X axis
        anchorX="center"
        anchorY="middle"
      >
        Y+
      </Text>

      {/* Y axis label (green, up) */}
      <Text
        position={[0, size, 0]}
        color="green"
        fontSize={0.3}
        rotation={[0, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        Z+
      </Text>

      {/* Z axis label (blue, forward) */}
      <Text
        position={[0, 0, size]}
        color="blue"
        fontSize={0.3}
        rotation={[0, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        X+
      </Text>
    </>
  );
}

// Main RobotVisualizer
export function RobotVisualizer({ module }: { module: MainModule }) {
  const robotRef = useRef<Mesh>(null);
  // Create pose at (3, 2, 0) with 40 degrees yaw (in radians)
  const yawRadians = (40 * Math.PI) / 180;
  // Correct instantiation for Emscripten-compiled WASM classes: use 'new' keyword, not '.new'
  const pose = new module.Pose3d(
    new module.Translation3d(3, 2, 0),
    new module.Rotation3d(0, 0, yawRadians),
  );
  const { position, rotation } = nwuPoseToThree(pose);

  return (
    <Canvas className="h-full w-full">
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <OrbitControls />

      {/* Axes with labels */}
      <LabeledAxes size={2} />

      {/* Robot mesh */}
      <mesh ref={robotRef} position={position} rotation={rotation}>
        <boxGeometry args={[1, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}

// Full route component
export default async function Visualizer() {
  const module = await initWpimath();

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="px-4 py-4 md:px-8 md:py-6">
        <h1 className="text-4xl font-bold tracking-tight">Space Visualizer</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Visualize and analyze spatial relationships
        </p>
      </div>

      {/* 3D visualizer */}
      <div className="flex-1 px-4 pb-4 md:px-8 md:pb-6">
        <div className="h-full w-full rounded-lg border bg-black">
          <RobotVisualizer module={module} />
        </div>
      </div>
    </div>
  );
}
