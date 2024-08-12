import * as THREE from 'three';
import React, { useImperativeHandle, forwardRef, useState } from 'react';

const MinMax = forwardRef((props, ref) => {
  const [min, setMin] = useState(Number.MAX_VALUE);
  const [max, setMax] = useState(Number.MIN_VALUE);

  useImperativeHandle(ref, () => ({
    AddValue: (v) => {
      if (v > max) {
        setMax(v);
      }
      if (v < min) {
        setMin(v);
      }
    },
    Reset: () => {
      setMin(Number.MAX_VALUE);
      setMax(Number.MIN_VALUE);
    },
    GetValues: () => {
      return new THREE.Vector2(min, max);
    },
  }));

  return null;
});

export default MinMax;
