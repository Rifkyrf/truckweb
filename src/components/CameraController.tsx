import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

/**
 * CameraController:
 * Menyediakan 2 Mode Kamera Presisi Tinggi:
 * 1. 'chase' -> Mode Follow dari Belakang (Third-Person Chase Cam ala simulator/balap)
 *    - Mengikuti bodi truk dari belakang secara dinamis dan super mulus (smooth damping).
 *    - Mengikuti sudut belokan (heading) secara aerodinamis dengan look-ahead ke arah jalan.
 * 2. 'orbit' -> Mode 360 Bebas (Full 360° Orbit)
 *    - Pengguna bebas menggeser layar / mouse untuk memutar kamera 360° mengelilingi truk.
 *    - Zoom in / out bebas dan posisi kamera bergerak mulus bersama truk.
 */
export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsType>(null);
  const { truckPhysicsRef, cameraMode } = useTruck();

  // Reusable vectors untuk menghindari alokasi memori di loop 60 FPS
  const currentCamPos = useRef(new THREE.Vector3(0, 4.0, 12.0));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.8, 0));
  const desiredCamPos = useRef(new THREE.Vector3(0, 4.0, 12.0));
  const desiredLookAt = useRef(new THREE.Vector3(0, 1.8, 0));

  // Untuk mode orbit
  const lastTruckPos = useRef(new THREE.Vector3(0, 0, 0));
  const lastResetId = useRef(0);
  const prevMode = useRef(cameraMode);

  // Inisialisasi awal & penanganan reset
  useEffect(() => {
    const p = truckPhysicsRef.current.position;
    const h = truckPhysicsRef.current.heading;
    lastTruckPos.current.copy(p);

    const initDist = 11.5;
    const initCamX = p.x + Math.sin(h) * initDist;
    const initCamY = p.y + 3.8;
    const initCamZ = p.z + Math.cos(h) * initDist;

    currentCamPos.current.set(initCamX, initCamY, initCamZ);
    desiredCamPos.current.set(initCamX, initCamY, initCamZ);

    const initLookX = p.x - Math.sin(h) * 2.0;
    const initLookY = p.y + 1.8;
    const initLookZ = p.z - Math.cos(h) * 2.0;

    currentLookAt.current.set(initLookX, initLookY, initLookZ);
    desiredLookAt.current.set(initLookX, initLookY, initLookZ);

    camera.position.set(initCamX, initCamY, initCamZ);
    camera.lookAt(initLookX, initLookY, initLookZ);

    if (controlsRef.current) {
      controlsRef.current.target.set(p.x, p.y + 1.6, p.z);
      controlsRef.current.update();
    }
  }, [truckPhysicsRef, camera]);

  // Loop Kamera (Priority 1: Dijalankan segera setelah Truck update fisika)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = truckPhysicsRef.current.position;
    const h = truckPhysicsRef.current.heading;
    const spd = truckPhysicsRef.current.speed;
    const resetTriggered = truckPhysicsRef.current.resetId !== lastResetId.current;
    const modeChanged = prevMode.current !== cameraMode;

    if (resetTriggered || modeChanged) {
      lastResetId.current = truckPhysicsRef.current.resetId;
      prevMode.current = cameraMode;
      lastTruckPos.current.copy(p);

      if (cameraMode === 'chase') {
        const dist = 11.5;
        const camX = p.x + Math.sin(h) * dist;
        const camY = p.y + 3.8;
        const camZ = p.z + Math.cos(h) * dist;

        currentCamPos.current.set(camX, camY, camZ);
        desiredCamPos.current.set(camX, camY, camZ);

        const lookX = p.x - Math.sin(h) * 2.5;
        const lookY = p.y + 1.8;
        const lookZ = p.z - Math.cos(h) * 2.5;

        currentLookAt.current.set(lookX, lookY, lookZ);
        desiredLookAt.current.set(lookX, lookY, lookZ);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(lookX, lookY, lookZ);
      } else {
        // Mode Orbit: posisikan kamera di sudut tiga perempat (isometric-style) yang nyaman
        camera.position.set(p.x + 8.5, p.y + 4.5, p.z + 11.5);
        if (controlsRef.current) {
          controlsRef.current.target.set(p.x, p.y + 1.6, p.z);
          controlsRef.current.update();
        }
      }
      return;
    }

    // =========================================================================
    // MODE 1: CHASE (FOLLOW DARI BELAKANG SECARA HALUS & AERODINAMIS)
    // =========================================================================
    if (cameraMode === 'chase') {
      // Jarak kamera memanjang sedikit saat truk melaju kencang (efek kecepatan dinamis)
      const dynamicDist = 11.2 + Math.min(Math.abs(spd) * 0.08, 2.2);
      const camHeight = 3.7;

      // Posisi ideal tepat di belakang truk (heading)
      desiredCamPos.current.set(
        p.x + Math.sin(h) * dynamicDist,
        p.y + camHeight,
        p.z + Math.cos(h) * dynamicDist
      );

      // Titik fokus kamera ke depan kabin truk (look-ahead)
      desiredLookAt.current.set(
        p.x - Math.sin(h) * 2.5,
        p.y + 1.8,
        p.z - Math.cos(h) * 2.5
      );

      // Interpolasi halus (decay lerp) agar ayunan belokan truk terasa mantap & empuk
      const camLerp = 1 - Math.exp(-6.5 * dt);
      const lookLerp = 1 - Math.exp(-9.0 * dt);

      currentCamPos.current.lerp(desiredCamPos.current, camLerp);
      currentLookAt.current.lerp(desiredLookAt.current, lookLerp);

      camera.position.copy(currentCamPos.current);
      camera.lookAt(currentLookAt.current);
      lastTruckPos.current.copy(p);
    }
    // =========================================================================
    // MODE 2: ORBIT (360° BEBAS DENGAN SENTUHAN / DRAG MOUSE)
    // =========================================================================
    else {
      const controls = controlsRef.current;
      if (!controls) return;

      // Geser kamera dan target orbit bersama pergerakan truk frame ini
      const dx = p.x - lastTruckPos.current.x;
      const dy = p.y - lastTruckPos.current.y;
      const dz = p.z - lastTruckPos.current.z;

      if (dx !== 0 || dy !== 0 || dz !== 0) {
        camera.position.x += dx;
        camera.position.y += dy;
        camera.position.z += dz;

        controls.target.x = p.x;
        controls.target.y = p.y + 1.6;
        controls.target.z = p.z;

        lastTruckPos.current.copy(p);
      }

      controls.update();
    }
  }, 1);

  // Hanya pasang OrbitControls jika berada di mode 'orbit' agar sentuhan di mode 'chase' tidak memicu benturan event
  if (cameraMode !== 'orbit') {
    return null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 1.6, 0]}
      maxPolarAngle={Math.PI / 2 - 0.05} // Mencegah kamera tembus ke bawah aspal
      minPolarAngle={0.12}
      minDistance={3.5}
      maxDistance={40}
      enableDamping={true}
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
    />
  );
}
