import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SquareMeshInFrontOfPlayer = ({ playerPosition, playerDirection }) => {
  const squareMeshRef = useRef();

  useEffect(() => {
    if (squareMeshRef.current && playerPosition && playerDirection) {
      const offsetPosition = new THREE.Vector3()
        .copy(playerDirection)
        .multiplyScalar(10) // Move 10 units in front of the player
        .add(playerPosition);

      squareMeshRef.current.position.copy(offsetPosition);
    }
  }, [playerPosition, playerDirection]);

  return (
    <mesh ref={squareMeshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={new THREE.Color(0xff0000)} />
    </mesh>
  );
};

export default SquareMeshInFrontOfPlayer;
