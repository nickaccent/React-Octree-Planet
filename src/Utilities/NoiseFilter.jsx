import * as THREE from 'three';
import { RNG } from './RNG';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export const getNoiseFilters = () => {
  const simplexParams = {
    seed: 1,
    rng: null,
    simplex: null,
  };
  const rng = new RNG(simplexParams.seed);
  simplexParams.simplex = new SimplexNoise(rng);

  const firstFilter = new NoiseFilter(rng, simplexParams.simplex);
  firstFilter.enabled = true;

  const secondFilter = new NoiseFilter(rng, simplexParams.simplex);
  secondFilter.useFirstLayerMask = true;
  secondFilter.enabled = true;

  const thirdFilter = new NoiseFilter(rng, simplexParams.simplex);
  thirdFilter.useFirstLayerMask = true;
  thirdFilter.type = 'Ridged';
  thirdFilter.enabled = true;
  return [firstFilter, secondFilter, thirdFilter];
};

export class NoiseFilter {
  constructor(rng, simplex) {
    this.enabled = false;
    this.type = 'Simple';
    this.strength = 0.112;
    this.baseRoughness = 0.9;
    this.roughness = 2.34;
    this.center = new THREE.Vector3();
    this.noiseLayers = 4;
    this.persistence = 0.54;
    this.minValue = 1.06;
    this.rng = rng;
    this.simplex = simplex;
    this.useFirstLayerMask = false;
  }

  Evaluate(pointOnUnitSphere, planetSize) {
    if (this.type == 'Simple') {
      let noiseValue = 0;
      let frequency = this.baseRoughness;
      let amplitude = 1;
      for (let i = 0; i < this.noiseLayers; i++) {
        let v = this.simplex.noise3d(
          pointOnUnitSphere.x * frequency + this.center.x,
          pointOnUnitSphere.y * frequency + this.center.y,
          pointOnUnitSphere.z * frequency + this.center.z,
        );
        noiseValue += (v + 1) * 0.5 * amplitude;

        frequency *= this.roughness;
        amplitude *= this.persistence;
      }

      noiseValue = Math.max(0, noiseValue - this.minValue);
      return noiseValue * this.strength;
    } else if (this.type == 'Ridged') {
      let noiseValue = 0;
      let frequency = this.baseRoughness;
      let amplitude = 1;
      let weight = 1;
      for (let i = 0; i < this.noiseLayers; i++) {
        let v = this.simplex.noise3d(
          pointOnUnitSphere.x * frequency + this.center.x,
          pointOnUnitSphere.y * frequency + this.center.y,
          pointOnUnitSphere.z * frequency + this.center.z,
        );
        v = 1.0 - Math.abs(v);
        v *= v;
        v *= weight;
        weight = v;

        noiseValue += v * amplitude;
        frequency *= this.roughness;
        amplitude *= this.persistence;
      }

      noiseValue = Math.max(0, noiseValue - this.minValue);
      return noiseValue * this.strength;
    }
  }
}
