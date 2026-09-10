import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsType>(null);
  const { truckPosition } = useTruck();

  // Reusable Vector3 objects (mencegah memory allocation & GC stutter pada 60/120 FPS)
  const prevTruckPos = useRef(new THREE.Vector3(...truckPosition));
  const targetPoint = useRef(new THREE.Vector3());
  const deltaMove = useRef(new THREE.Vector3());

  useFrame(() => {
    const [tx, ty, tz] = truckPosition;
    targetPoint.current.set(tx, ty + 1.6, tz);

    if (controlsRef.current) {
      // Hitung delta gerakan truk tanpa alokasi memori baru
      deltaMove.current.copy(targetPoint.current).sub(prevTruckPos.current);

      // Geser target orbit dan kamera secara simultan agar sudut pandang konsisten
      controlsRef.current.target.copy(targetPoint.current);
      camera.position.add(deltaMove.current);
      controlsRef.current.update();

      prevTruckPos.current.copy(targetPoint.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[truckPosition[0], truckPosition[1] + 1.6, truckPosition[2]]}
      maxPolarAngle={Math.PI / 2 - 0.03} // Mencegah kamera tembus ke bawah aspal
      minPolarAngle={0.1}
      minDistance={3.5}
      maxDistance={40}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
    />
  );
}
