import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsType>(null);
  const { truckPhysicsRef } = useTruck();

  // Reusable Vector3 objects (Zero-allocation memory pool)
  const prevTargetPos = useRef(new THREE.Vector3(0, 1.6, 0));
  const currentTargetPos = useRef(new THREE.Vector3(0, 1.6, 0));
  const deltaMove = useRef(new THREE.Vector3(0, 0, 0));
  const lastResetId = useRef(0);
  const isInitialized = useRef(false);

  // Inisialisasi posisi awal target
  useEffect(() => {
    const p = truckPhysicsRef.current.position;
    prevTargetPos.current.set(p.x, p.y + 1.6, p.z);
    currentTargetPos.current.set(p.x, p.y + 1.6, p.z);
    isInitialized.current = true;
  }, [truckPhysicsRef]);

  // useFrame dengan Priority 1: SELALU dieksekusi SETELAH Truck mengupdate fisika di Priority 0
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Deteksi tombol Reset ditekan
    if (truckPhysicsRef.current.resetId !== lastResetId.current) {
      lastResetId.current = truckPhysicsRef.current.resetId;
      const p = truckPhysicsRef.current.position;
      currentTargetPos.current.set(p.x, p.y + 1.6, p.z);
      prevTargetPos.current.copy(currentTargetPos.current);

      controls.target.copy(currentTargetPos.current);
      camera.position.set(p.x + 8, p.y + 4.5, p.z + 11);
      controls.update();
      return;
    }

    // 1. Ambil koordinat posisi truk terkini (60/120 FPS tanpa lag)
    const p = truckPhysicsRef.current.position;
    currentTargetPos.current.set(p.x, p.y + 1.6, p.z);

    if (!isInitialized.current) {
      prevTargetPos.current.copy(currentTargetPos.current);
      controls.target.copy(currentTargetPos.current);
      isInitialized.current = true;
      return;
    }

    // 2. Hitung delta gerakan frame ini
    deltaMove.current.subVectors(currentTargetPos.current, prevTargetPos.current);

    // 3. Jika truk bergerak, geser target orbit dan posisi kamera secara simultan
    if (deltaMove.current.lengthSq() > 0.0000001) {
      controls.target.add(deltaMove.current);
      camera.position.add(deltaMove.current);
      prevTargetPos.current.copy(currentTargetPos.current);
    }

    // 4. Update OrbitControls untuk menangani interaksi putar/zoom user
    controls.update();
  }, 1);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 1.6, 0]}
      maxPolarAngle={Math.PI / 2 - 0.03} // Mencegah kamera tembus ke bawah aspal
      minPolarAngle={0.1}
      minDistance={3.5}
      maxDistance={45}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
    />
  );
}
