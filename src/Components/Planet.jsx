import React, { useContext, useEffect, useRef, useState } from 'react';
import MinMax from './MinMax';
import * as THREE from 'three';

import { PlayerContext } from '../Contexts/Player';
import TerrainFace from './TerrainFace';
import { useFrame } from '@react-three/fiber';
import { GameContext } from '../Contexts/Game';

const startResolution = 9;
const cullingMinAngle = 1.91986218;

const Planet = ({ position, size = 1000, playerDefaultPosition, id }) => {
  const { playerPosition } = useContext(PlayerContext);
  const { setGameState, distanceToPlanets, setDistanceToPlanets } = useContext(GameContext);
  const minMaxRef = useRef();
  const meshFiltersRef = useRef(null);
  const [directions, setDirections] = useState([]);
  const [detailLevelDistances, setDetailLevelDistances] = useState([]);
  const [distanceToPlayer, setDistanceToPlayer] = useState(0);
  const [terrainMeshes, setTerrainMeshess] = useState([]);
  const planetPosition = useRef(new THREE.Vector3());
  const [loadingsState, setLoadingsState] = useState([
    { id: 1, loaded: false },
    { id: 2, loaded: false },
    { id: 3, loaded: false },
    { id: 4, loaded: false },
    { id: 5, loaded: false },
    { id: 6, loaded: false },
  ]);

  let terrainFaceMaterial = new THREE.MeshBasicMaterial({ color: 0xbada55, wireframe: true });

  useEffect(() => {
    const count = loadingsState.filter((item) => item.loaded).length;
    if (count == 5) {
      setGameState('game');
    }
  }, [loadingsState]);

  useEffect(() => {
    planetPosition.current = position;

    const divisions = [1, 2, 4, 8, 24, 72, 216, 648];
    const tempDetailLevelDistances = [];
    let max = size * 2;
    let currentDistance = max;
    tempDetailLevelDistances.push(max);
    tempDetailLevelDistances.push(max / 2);
    tempDetailLevelDistances.push(max / 2 / 2);
    tempDetailLevelDistances.push(max / 2 / 2 / 2);
    tempDetailLevelDistances.push(max / 2 / 2 / 2 / 3);
    tempDetailLevelDistances.push(max / 2 / 2 / 2 / 3 / 3);
    tempDetailLevelDistances.push(max / 2 / 2 / 2 / 3 / 3 / 3);
    tempDetailLevelDistances.push(max / 2 / 2 / 2 / 3 / 3 / 3 / 3);

    setDetailLevelDistances(tempDetailLevelDistances);
    console.log(tempDetailLevelDistances);

    const tempDirections = [];
    tempDirections.push(new THREE.Vector3(0, 1, 0));
    tempDirections.push(new THREE.Vector3(0, -1, 0));
    tempDirections.push(new THREE.Vector3(0, 0, 1));
    tempDirections.push(new THREE.Vector3(0, 0, -1));
    tempDirections.push(new THREE.Vector3(-1, 0, 0));
    tempDirections.push(new THREE.Vector3(1, 0, 0));
    setDirections(tempDirections);

    setDistanceToPlayer(planetPosition.current.distanceTo(playerDefaultPosition));
  }, []);

  return (
    <>
      <MinMax ref={minMaxRef} />
      <group ref={meshFiltersRef}>
        {directions.map((direction, i) => (
          <TerrainFace
            key={i}
            localUp={direction}
            radius={size}
            minMax={minMaxRef.current}
            material={terrainFaceMaterial}
            detailLevelDistances={detailLevelDistances}
            distanceToPlayer={distanceToPlayer}
            cullingMinAngle={cullingMinAngle}
            loadingsState={loadingsState}
            setLoadingsState={setLoadingsState}
            loadingsId={i + 1}
          />
        ))}
      </group>
    </>
  );
};

export default Planet;
