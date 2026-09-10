import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsType>(null);
  const { truckPosition, truckHeading, cameraPreset } = useTruck();

  // Smoothing position refs
  const currentTargetRef = useRef(new THREE.Vector3(0, 1.8, 0));
  const currentCamPosRef = useRef(new THREE.Vector3(8, 4.5, 11));

  useFrame((_, delta) => {
    const [tx, ty, tz] = truckPosition;
    const truckTarget = new THREE.Vector3(tx, ty + 1.6, tz);

    if (cameraPreset === 'orbit') {
      // Orbit mode: controls target follows the truck smoothly
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        // Geser target kontroler mengikuti truk
        const targetOffset = truckTarget.clone().sub(controlsRef.current.target);
        controlsRef.current.target.lerp(truckTarget, 0.15);
        // Kamera juga bergeser bersama truk agar jarak tetap
        camera.position.add(targetOffset.multiplyScalar(0.95));
        controlsRef.current.update();
      }
    } else if (cameraPreset === 'side') {
      // Third-person Chase Cam (di belakang truk mengikuti heading)
      if (controlsRef.current) controlsRef.current.enabled = false;

      // Di belakang truk: arah +Z lokal truk diputar berdasarkan truckHeading
      const forwardX = -Math.sin(truckHeading);
      const forwardZ = -Math.cos(truckHeading);

      // Posisi di belakang truk (berlawanan dari forward)
      const chasePos = new THREE.Vector3(
        tx - forwardX * 10,
        ty + 3.8,
        tz - forwardZ * 10
      );

      camera.position.lerp(chasePos, 0.12);
      camera.lookAt(tx + forwardX * 6, ty + 1.8, tz + forwardZ * 6);
    } else if (cameraPreset === 'front') {
      // Cinematic Front View (melihat truk dari depan)
      if (controlsRef.current) controlsRef.current.enabled = false;

      const forwardX = -Math.sin(truckHeading);
      const forwardZ = -Math.cos(truckHeading);

      const frontPos = new THREE.Vector3(
        tx + forwardX * 11,
        ty + 2.4,
        tz + forwardZ * 11
      );

      camera.position.lerp(frontPos, 0.12);
      camera.lookAt(tx, ty + 1.8, tz);
    } else if (cameraPreset === 'cockpit') {
      // Driver Interior View (di dalam kabin sopir)
      if (controlsRef.current) controlsRef.current.enabled = false;

      const forwardX = -Math.sin(truckHeading);
      const forwardZ = -Math.cos(truckHeading);
      const rightX = Math.cos(truckHeading);
      const rightZ = -Math.sin(truckHeading);

      // Posisi duduk sopir Peterbilt di kabin kiri
      const cockpitPos = new THREE.Vector3(
        tx - rightX * 0.45,
        ty + 2.3,
        tz - rightZ * 0.45
      );

      camera.position.lerp(cockpitPos, 0.2);
      // Melihat ke arah depan jalan
      camera.lookAt(
        tx + forwardX * 20 - rightX * 0.45,
        ty + 2.0,
        tz + forwardZ * 20 - rightZ * 0.45
      );
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 1.8, 0]}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={2.5}
      maxDistance={45}
      enableDamping
      dampingFactor={0.06}
    />
  );
}
