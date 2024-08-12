// terrainFaceWorker.js (Worker script)
import * as THREE from 'three'; // ES module import
import { getNoiseFilters } from '../Utilities/NoiseFilter';

function calculateVerticesAndTriangles(detailLevel, position, axisA, axisB, radius, size) {
  let increment = 0;
  switch (detailLevel) {
    case 0:
      increment = 10;
      break;
    case 1:
      increment = 8;
      break;
    case 2:
      increment = 6;
      break;
    case 3:
      increment = 5;
      break;
    case 4:
      increment = 4;
      break;
    case 5:
      increment = 2;
      break;
    case 6:
      increment = 2;
      break;
    case 7:
      increment = 1;
      break;
  }

  let resolution = 240 / increment;
  let vertices = [];
  let triangles = [];
  let triIndex = 0;
  let i = 0;

  const vector2 = new THREE.Vector2();

  const pointOnUnitCube = new THREE.Vector3();
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      let percent = vector2.set(x, y).divideScalar(resolution - 1);

      pointOnUnitCube
        .copy(position)
        .addScaledVector(axisA, (percent.x - 0.5) * 2 * radius)
        .addScaledVector(axisB, (percent.y - 0.5) * 2 * radius);

      const pointOnUnitSphere = pointOnUnitCube.normalize();
      const pointOnPlanet = calculatePointOnPlanet(pointOnUnitSphere, size);

      vertices.push(pointOnPlanet.x, pointOnPlanet.y, pointOnPlanet.z);

      if (x !== resolution - 1 && y !== resolution - 1) {
        triangles[triIndex] = i;
        triangles[triIndex + 1] = i + resolution + 1;
        triangles[triIndex + 2] = i + resolution;
        triangles[triIndex + 3] = i;
        triangles[triIndex + 4] = i + 1;
        triangles[triIndex + 5] = i + resolution + 1;
        triIndex += 6;
      }
      i++;
    }
  }

  return { vertices, triangles };
}

function calculatePointOnPlanet(pointOnUnitSphere, size) {
  const noiseFilters = getNoiseFilters();

  let firstLayerValue = 0;
  let elevation = 0;
  let noiseFiltersCount = Object.keys(noiseFilters).length;
  if (noiseFiltersCount > 0) {
    for (const [key, noiseFilter] of Object.entries(noiseFilters)) {
      if (key == 0) {
        firstLayerValue = noiseFilter.Evaluate(pointOnUnitSphere.clone(), size);
        if (noiseFilter.enabled) {
          elevation += firstLayerValue;
        }
      } else {
        if (noiseFilter.enabled) {
          let mask = noiseFilter.useFirstLayerMask ? firstLayerValue : 1;
          elevation += noiseFilter.Evaluate(pointOnUnitSphere.clone(), size) * mask;
        }
      }
    }
  }
  let elevationVal = (size / 2) * (2 + elevation);
  return new THREE.Vector3(
    pointOnUnitSphere.x * elevationVal,
    pointOnUnitSphere.y * elevationVal,
    pointOnUnitSphere.z * elevationVal,
  );
}

self.onmessage = function (e) {
  const data = e.data;
  try {
    const result = calculateVerticesAndTriangles(
      data.detailLevel,
      new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      new THREE.Vector3(data.axisA.x, data.axisA.y, data.axisA.z),
      new THREE.Vector3(data.axisB.x, data.axisB.y, data.axisB.z),
      data.radius,
      data.size,
    );
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

self.onerror = function (error) {
  console.error('Worker encountered an error:', error.message);
  self.postMessage({ error: error.message });
};
