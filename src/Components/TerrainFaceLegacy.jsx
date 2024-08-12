import React, { useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Chunk } from '../Utilities/Chunk';
import { PlayerContext } from '../Contexts/Player';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils';
import { useFrame } from '@react-three/fiber';
import { playerStartPosition } from './Experience';
import { GameContext } from '../Contexts/Game';

const TerrainFaceLegacy = ({
  resolution,
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
  const [faceMaterial, setFaceMaterial] = useState(null);
  const [faceResolution, setFaceResolution] = useState(null);
  const [faceLocalUp, setFaceLocalUp] = useState(null);
  const [faceRadius, setFaceFaceRadius] = useState(0);
  const axisARef = useRef(new THREE.Vector3());
  const axisBRef = useRef(new THREE.Vector3());

  const [geometryCount, setGeometryCount] = useState(0);
  const visibleChildrenCount = useRef(0);

  const [minMaxMin, setMinMaxMin] = useState(0);
  const [minMaxMax, setMinMaxMax] = useState(0);

  const handleTaskCompletion = (result) => {
    tasksCompleted.current += 1;
    taskResults.current.push(result);
    console.log(
      'Task completed. Tasks completed:',
      tasksCompleted.current,
      'Total tasks:',
      totalTasks.current,
    );

    if (tasksCompleted.current === totalTasks.current) {
      processAllResults();
    }
  };

  const handleTaskFrameCompletion = (result) => {
    tasksCompleted.current += 1;
    taskResults.current.push(result);
    console.log(
      'Task completed. Tasks completed:',
      tasksCompleted.current,
      'Total tasks:',
      totalTasks.current,
    );

    if (tasksCompleted.current === totalTasks.current) {
      processAllFrameResults();
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
      geometryRef.current = BufferGeometryUtils.mergeGeometries(geometries);
      geometryRef.current.computeVertexNormals();
      geometryRef.current.normalizeNormals();
      geometryRef.current.computeBoundingBox();
      material.wireframe = false;
      setGeometryCount(geometries.length);
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
    console.log(tLoadings);
  };

  const processAllFrameResults = () => {
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
      setGeometryCount(geometries.length);
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
    console.log(tLoadings);
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
        null,
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
      console.log(distanceToPlayer);
      let visibleChildren = newParentChunk.GetVisibleChildren(100);
      visibleChildrenCount.current = visibleChildren.length;
      totalTasks.current = visibleChildrenCount.current;
      let geometries = [];
      for (const child of visibleChildren) {
        taskQueue.enqueueTask(
          {
            detailLevel: child.detailLevel,
            position: child.position,
            axisA: child.axisA,
            axisB: child.axisB,
            radius: child.radius,
            size: child.radius,
          },
          handleTaskCompletion,
        );
      }
      setParentChunk(newParentChunk);
    }
  }, []);

  useFrame((state) => {
    if (parentChunk != null) {
      parentChunk.UpdateChunk(playerPosition);
      //   let geometries = [];
      let visibleChildren = parentChunk.GetVisibleChildren();
      //   if (visibleChildren.length != visibleChildrenCount.current) {
      //     visibleChildrenCount.current = visibleChildren.length;
      //     totalTasks.current = visibleChildren.length;
      //     for (const child of visibleChildren) {
      //       if (child.vertices.length == 0) {
      //         taskQueue.enqueueTask(
      //           {
      //             detailLevel: child.detailLevel,
      //             position: child.position,
      //             axisA: child.axisA,
      //             axisB: child.axisB,
      //             radius: child.radius,
      //             size: child.radius,
      //           },
      //           handleTaskFrameCompletion,
      //         );
      //       } else {
      //         taskResults.current.push({ vertices: child.vertices, triangles: child.triangles });
      //       }
      //       // let geometry = new THREE.BufferGeometry();
      //       // const verticesArray = new Float32Array(verticesAndTriangles.vertices);
      //       // geometry.setIndex(verticesAndTriangles.triangles);
      //       // geometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));
      //       // geometry.computeVertexNormals();
      //       // geometry.normalizeNormals();
      //       // geometry.computeBoundingBox();
      //       // geometries.push(geometry);
      //     }
      //     // console.log(`geometries.length: ${geometries.length}, geometryCount: ${geometryCount}`);
      //     // if (geometries.length > 0 && geometries.length != geometryCount) {
      //     //   console.log('clear');
      //     //   geometryRef.current.dispose();
      //     //   terrainFaceRef.current.clear();
      //     //   geometryRef.current = BufferGeometryUtils.mergeGeometries(geometries);
      //     //   if (vertices.length != geometryRef.current.attributes.position.array.length) {
      //     //     setVertices(geometryRef.current.attributes.position.array);
      //     //     setTriangles(geometryRef.current.index.array);
      //     //     geometryRef.current.computeVertexNormals();
      //     //     geometryRef.current.normalizeNormals();
      //     //     geometryRef.current.computeBoundingBox();
      //     //     material.wireframe = true;
      //     //     setGeometryCount(geometries.length);
      //     //   }
      //     // }
      //   } else {
      //     if (minMaxMin != 0) {
      //       minMax.AddValue(minMaxMin);
      //     }
      //     if (minMaxMax != 0) {
      //       minMax.AddValue(minMaxMax);
      //     }
      //   }
    }
  });

  return (
    <>
      <mesh ref={terrainFaceRef} geometry={geometryRef.current} material={material} />
    </>
  );
};

export default TerrainFaceLegacy;
