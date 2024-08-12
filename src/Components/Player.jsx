import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlayerContext } from '../Contexts/Player';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _bodyPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(0, 0, -1);
const cameraTargetOffset = new THREE.Vector3(0, 0, 10);

const _cameraPosition = new THREE.Vector3();
const _cameraTarget = new THREE.Vector3();

const Player = ({ position }) => {
  const { playerPosition, setPlayerPosition, controlCamera, setControlCamera } =
    useContext(PlayerContext);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const meshPosition = useRef(new THREE.Vector3());
  const [smoothedCameraPosition] = useState(new THREE.Vector3(0, 100, -300));
  const [smoothedCameraTarget] = useState(new THREE.Vector3());

  const pointerSpeed = 0.5;
  const minPolarAngle = 0;
  const maxPolarAngle = Math.PI;

  const getGamepadControls = () => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Assuming the first gamepad is used

    if (!gamepad) return {};

    return {
      forward: gamepad.buttons[1].pressed ? 1 : gamepad.buttons[7].pressed ? 1 : 0, // Example: Button B (Xbox) as accelerate
      back: gamepad.buttons[0].pressed ? 1 : gamepad.buttons[4].pressed ? 1 : 0, // Example: Button A (Xbox) as reverse
      brake: gamepad.buttons[2].pressed ? 1 : gamepad.buttons[6].pressed ? 1 : 0, // Example: Button X (Xbox) as brake
      left: gamepad.axes[0] < -0.2 ? gamepad.axes[0] : 0,
      right: gamepad.axes[0] > 0.2 ? gamepad.axes[0] : 0,
      up: gamepad.axes[1] < -0.2 ? gamepad.axes[1] : 0,
      down: gamepad.axes[1] > 0.2 ? gamepad.axes[1] : 0,
      reset: gamepad.buttons[8].pressed ? 1 : 0,
      escape: gamepad.buttons[9].pressed ? 1 : 0,
      run: gamepad.buttons[5].pressed ? 1 : 0,
      cameraChange: gamepad.buttons[13].pressed ? 1 : 0,
    };
  };

  const [, getKeyboardControls] = useKeyboardControls();

  const { camera, scene } = useThree();
  const meshRef = useRef();

  const GetForwardVector = () => {
    camera.getWorldDirection(directionRef.current);
    directionRef.current.y = 0;
    directionRef.current.normalize();
    return directionRef.current;
  };

  const GetSideVector = () => {
    camera.getWorldDirection(directionRef.current);
    directionRef.current.y = 0;
    directionRef.current.normalize();
    directionRef.current.cross(camera.up);
    return directionRef.current;
  };

  const UpdatePlayerMove = (deltaTime) => {
    const keyboardControls = getKeyboardControls();
    if (keyboardControls.cameraChange == 1) {
      setControlCamera(!controlCamera);
    }
    const gamepadControls = getGamepadControls();
    let speedDelta = deltaTime * 1000;

    // Adjust Euler angles based on gamepad or keyboard input
    let rotationDelta = 0.02 * pointerSpeed;
    if (gamepadControls.left || keyboardControls.left) {
      _euler.y += rotationDelta;
    }
    if (gamepadControls.right || keyboardControls.right) {
      _euler.y -= rotationDelta;
    }
    if (gamepadControls.up || keyboardControls.up) {
      _euler.x -= rotationDelta;
    }
    if (gamepadControls.down || keyboardControls.down) {
      _euler.x += rotationDelta;
    }

    // Clamp angles
    _euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));

    // Apply new rotation to camera
    meshRef.current.quaternion.setFromEuler(_euler);

    // Calculate the forward and side directions after applying the rotation
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(meshRef.current.quaternion);
    const sideVector = new THREE.Vector3(1, 0, 0).applyQuaternion(meshRef.current.quaternion);

    // Apply movement in the direction the player is facing
    if (gamepadControls.forward || keyboardControls.forward) {
      velocityRef.current.add(forwardVector.multiplyScalar(-speedDelta));
    }
    if (gamepadControls.back || keyboardControls.back) {
      velocityRef.current.add(forwardVector.multiplyScalar(speedDelta));
    }
    if (gamepadControls.left || keyboardControls.left) {
      velocityRef.current.add(sideVector.multiplyScalar(-speedDelta));
    }
    if (gamepadControls.right || keyboardControls.right) {
      velocityRef.current.add(sideVector.multiplyScalar(speedDelta));
    }
  };

  const UpdateCamera = (t, state) => {
    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(cameraOffset); // Ensure cameraOffset is correct
    const bodyWorldMatrix = meshRef.current.matrixWorld;
    cameraPosition.applyMatrix4(bodyWorldMatrix); // Correctly applying matrix

    cameraPosition.y = Math.max(cameraPosition.y, (meshRef.current.position.y ?? 0) + 1);

    smoothedCameraPosition.lerp(cameraPosition, t);
    state.camera.position.copy(smoothedCameraPosition);

    const bodyForward = new THREE.Vector3();
    meshRef.current.getWorldDirection(bodyForward);
    bodyForward.normalize();

    const bodyPosition = meshRef.current.getWorldPosition(_bodyPosition);
    const cameraTarget = _cameraTarget;
    state.camera.up.set(0, 1, 0);
    cameraTarget.copy(bodyPosition);
    cameraTarget.add(cameraTargetOffset); // Ensure cameraTargetOffset is correctly set
    smoothedCameraTarget.lerp(cameraTarget, t);
    state.camera.lookAt(smoothedCameraTarget);
  };

  useFrame((state, delta) => {
    const deltaTime = Math.min(0.05, delta);
    const t = 1.0 - Math.pow(0.01, delta);

    UpdatePlayerMove(deltaTime);

    // Apply damping
    let damping = Math.exp(-4 * deltaTime) - 1;
    velocityRef.current.addScaledVector(velocityRef.current, damping);

    if (Math.abs(velocityRef.current.x) < 0.2) velocityRef.current.x = 0;
    if (Math.abs(velocityRef.current.y) < 0.2) velocityRef.current.y = 0;
    if (Math.abs(velocityRef.current.z) < 0.2) velocityRef.current.z = 0;

    const deltaPosition = velocityRef.current.clone().multiplyScalar(deltaTime);
    meshPosition.current.add(deltaPosition);
    meshRef.current.position.copy(meshPosition.current);
    setPlayerPosition(meshPosition.current);
    if (controlCamera) {
      UpdateCamera(t, state);
    }
  });

  useEffect(() => {
    if (position instanceof THREE.Vector3 && meshPosition.current) {
      meshPosition.current.copy(position);
      setPlayerPosition(meshPosition.position);
    }
  }, [position]);

  return (
    <>
      <mesh position={meshPosition.current} ref={meshRef}>
        <boxGeometry args={[1, 1]} />
        <meshBasicMaterial color={new THREE.Color(0xffffff)} />
      </mesh>
    </>
  );
};

export default Player;
