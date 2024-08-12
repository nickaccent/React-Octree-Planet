import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { Suspense, useRef } from 'react';
import Player from './Player';
import Planet from './Planet';
import * as THREE from 'three';
import UI from './UI';

export const playerStartPosition = new THREE.Vector3(0, 0, -3450);

const Experience = () => {
  const cameraRef = useRef(null);

  return (
    <>
      <UI />
      <Suspense fallback={null}>
        <Canvas shadows gl={{ antialias: true }}>
          <OrbitControls />
          <directionalLight
            position={[100, 100, -100]}
            intensity={1}
            penumbra={1}
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            castShadow
            shadow-camera-left={-175}
            shadow-camera-right={175}
            shadow-camera-top={175}
            shadow-camera-bottom={-175}
            shadow-camera-near={0.001}
            shadow-camera-far={500} // Set far enough to cover the height of the scene
            shadow-bias={-0.001}
          />
          <PerspectiveCamera
            makeDefault
            position={[0, 2, 0]}
            fov={75}
            near={0.1}
            far={100000}
            ref={cameraRef}
          />
          <Player position={playerStartPosition} />
          <Planet
            position={new THREE.Vector3(0, 0, 0)}
            playerDefaultPosition={playerStartPosition}
            size={1000}
            id={1}
          />
        </Canvas>
      </Suspense>
    </>
  );
};

export default Experience;
