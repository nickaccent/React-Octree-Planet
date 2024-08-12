import React, { useContext, useEffect, useRef, useState, startTransition } from 'react';

import * as THREE from 'three';
import { Chunk } from '../Utilities/Chunk';
import { PlayerContext } from '../Contexts/Player';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils';
import { useFrame } from '@react-three/fiber';
import { playerStartPosition } from './Experience';
import { GameContext } from '../Contexts/Game';

const TerrainFace = ({
  localUp,
  radius,
  minMax,
  material,
  detailLevelDistances,
  distanceToPlayer,
  cullingMinAngle,
  loadingsState,
  setLoadingsState,
  loadingsId,
}) => {
  const [loaded, setLoaded] = useState(false);
  const tasksCompleted = useRef(0);
  const taskResults = useRef([]);
  const totalTasks = useRef(0);
  const { playerPosition } = useContext(PlayerContext);
  const { taskQueue } = useContext(GameContext);
  const [parentChunk, setParentChunk] = useState(null);
  const terrainFaceRef = useRef();
  const geometryRef = useRef(new THREE.BufferGeometry());
  const axisARef = useRef(new THREE.Vector3());
  const axisBRef = useRef(new THREE.Vector3());
  const visibleChildrenCount = useRef(0);
  const [minMaxMin, setMinMaxMin] = useState(0);
  const [minMaxMax, setMinMaxMax] = useState(0);
  const [updateFace, setUpdateFace] = useState(false);
  const [vertices, setVertices] = useState([]);
  const [triangles, setTriangles] = useState([]);

  const handleTaskCompletion = (result) => {
    tasksCompleted.current += 1;
    taskResults.current.push(result);
    if (tasksCompleted.current === totalTasks.current) {
      processAllResults();
    }
  };

  const processAllResults = () => {
    let geometries = [];
    for (const result of taskResults.current) {
      if (result.error) {
        console.error('Task error:', result.error);
        continue;
      }
      const { vertices, triangles } = result;

      let geometry = new THREE.BufferGeometry();
      const verticesArray = new Float32Array(vertices);
      geometry.setIndex(triangles);
      geometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));
      geometry.computeVertexNormals();
      geometry.normalizeNormals();
      geometry.computeBoundingBox();
      geometries.push(geometry);
    }

    if (geometries.length > 0) {
      geometryRef.current.dispose();
      terrainFaceRef.current.clear();
      geometryRef.current = BufferGeometryUtils.mergeGeometries(geometries);
      geometryRef.current.computeVertexNormals();
      geometryRef.current.normalizeNormals();
      geometryRef.current.computeBoundingBox();
      material.wireframe = false;
      setMinMaxMin(minMax.GetValues().x);
      setMinMaxMax(minMax.GetValues().y);
    }
    taskResults.current = [];
    totalTasks.current = 0;
    tasksCompleted.current = 0;

    setLoaded(true);
    const tLoadings = [...loadingsState];
    tLoadings.find((item) => item.id == loadingsId).loaded = true;
    setLoadingsState(tLoadings);
  };

  useEffect(() => {
    if (loaded == false) {
      axisARef.current = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
      axisBRef.current = localUp.clone();
      axisBRef.current = axisBRef.current.cross(axisARef.current);
      const planet = {
        player: { position: playerStartPosition },
        size: radius,
        detailLevelDistances: detailLevelDistances,
        distanceToPlayer: distanceToPlayer,
        cullingMinAngle: cullingMinAngle,
      };
      const newParentChunk = new Chunk(
        planet,
        [],
        null,
        localUp.normalize().multiplyScalar(radius),
        radius,
        0,
        localUp,
        axisARef.current,
        axisBRef.current,
        terrainFaceRef.current,
      );
      newParentChunk.GenerateChildren();
      let visibleChildren = newParentChunk.GetVisibleChildren(100);
      visibleChildrenCount.current = visibleChildren.length;
      totalTasks.current = visibleChildrenCount.current;
      let geometries = [];
      for (const child of visibleChildren) {
        startTransition(() =>
          taskQueue.enqueueTask(
            {
              detailLevel: child.detailLevel,
              position: child.position,
              axisA: child.axisA,
              axisB: child.axisB,
              radius: radius,
              size: child.radius,
            },
            handleTaskCompletion,
          ),
        );
      }
      setParentChunk(newParentChunk);
      setUpdateFace(false);
    }
  }, []);

  useEffect(() => {
    if (updateFace == true) {
      let visibleChildren = parentChunk.GetVisibleChildren();
      if (visibleChildren.length != visibleChildrenCount.current) {
        visibleChildrenCount.current = visibleChildren.length;
        totalTasks.current = visibleChildren.length;
        for (const child of visibleChildren) {
          if (child.vertices.length == 0) {
            startTransition(() =>
              taskQueue.enqueueTask(
                {
                  detailLevel: child.detailLevel,
                  position: child.position,
                  axisA: child.axisA,
                  axisB: child.axisB,
                  radius: child.radius,
                  size: radius,
                },
                handleTaskCompletion,
              ),
            );
          } else {
            taskResults.current.push({ vertices: child.vertices, triangles: child.triangles });
          }
        }
      } else {
        if (minMaxMin != 0) {
          minMax.AddValue(minMaxMin);
        }
        if (minMaxMax != 0) {
          minMax.AddValue(minMaxMax);
        }
      }
      setUpdateFace(false);
    }
  }, [updateFace]);

  useFrame((state) => {
    if (parentChunk != null) {
      parentChunk.UpdateChunk(playerPosition);
      let visibleChildren = parentChunk.GetVisibleChildren();
      if (visibleChildren.length > visibleChildrenCount.current) {
        setUpdateFace(true);
      }
    }
  });

  return (
    <>
      <mesh ref={terrainFaceRef} geometry={geometryRef.current} material={material} />
    </>
  );
};

export default TerrainFace;
