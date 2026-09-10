import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

/**
 * Helper khusus untuk model hasil export Blockbench ke GLTF/GLB:
 * Menemukan Bone Master Induk (objek Group yang menaungi mesh anak).
 */
function findMasterBone(root: THREE.Object3D, name: string): THREE.Object3D | null {
  const matches: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (obj.name === name) {
      matches.push(obj);
    }
  });

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Prioritaskan objek yang BUKAN Mesh dan memiliki anak (Group Bone Induk)
  const nonMeshParents = matches.filter(
    (m) => (!('isMesh' in m) || !(m as any).isMesh) && m.children.length > 0
  );
  if (nonMeshParents.length > 0) {
    nonMeshParents.sort((a, b) => b.children.length - a.children.length);
    return nonMeshParents[0];
  }

  matches.sort((a, b) => b.children.length - a.children.length);
  return matches[0];
}

export function Truck() {
  const { scene } = useGLTF('/truck.glb');
  const groupRef = useRef<THREE.Group>(null);

  const {
    steering,
    setSteering,
    steerInput,
    speed,
    setSpeed,
    throttleInput,
    cruiseSpeed,
    truckPosition,
    setTruckPosition,
    truckHeading,
    setTruckHeading,
    autoDrive,
  } = useTruck();

  // Cache referensi ke bone-bone utama Blockbench
  const bonesRef = useRef<{
    steer?: THREE.Object3D | null;
    bandep1?: THREE.Object3D | null;
    bandep2?: THREE.Object3D | null;
    banb1R?: THREE.Object3D | null;
    banb2R?: THREE.Object3D | null;
    banb2L?: THREE.Object3D | null;
    banb1L?: THREE.Object3D | null;
    gas?: THREE.Object3D | null;
    trailer?: THREE.Object3D | null;
    gear?: THREE.Object3D | null;
    truckRoot?: THREE.Object3D | null;
  }>({});

  // Inisialisasi dan deteksi bone saat scene dimuat
  useEffect(() => {
    if (!scene) return;

    // Aktifkan bayangan untuk semua mesh di dalam model
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const targetNames = [
      'steer',
      'bandep1',
      'bandep2',
      'banb1R',
      'banb2R',
      'banb2L',
      'banb1L',
      'gas',
      'trailer',
      'gear',
      'truck',
    ];

    const resolvedBones: Record<string, THREE.Object3D | null> = {};

    targetNames.forEach((targetName) => {
      let master = findMasterBone(scene, targetName);
      if (!master && targetName === 'trailer') {
        master = findMasterBone(scene, 'locktrailer');
      }
      if (!master && targetName === 'gear') {
        master = findMasterBone(scene, 'gearmain') || findMasterBone(scene, 'gear');
      }
      resolvedBones[targetName] = master;
    });

    bonesRef.current = {
      steer: resolvedBones['steer'],
      bandep1: resolvedBones['bandep1'],
      bandep2: resolvedBones['bandep2'],
      banb1R: resolvedBones['banb1R'],
      banb2R: resolvedBones['banb2R'],
      banb2L: resolvedBones['banb2L'],
      banb1L: resolvedBones['banb1L'],
      gas: resolvedBones['gas'],
      trailer: resolvedBones['trailer'],
      gear: resolvedBones['gear'],
      truckRoot: resolvedBones['truck'],
    };
  }, [scene]);

  // Input keyboard WASD / Arrow Keys untuk desktop
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Simpan nilai fisika dalam ref untuk update 60 FPS tanpa jank
  const posRef = useRef(new THREE.Vector3(truckPosition[0], truckPosition[1], truckPosition[2]));
  const headingRef = useRef(truckHeading);
  const currentSpeedRef = useRef(speed);
  const currentSteerDegRef = useRef(steering);
  const wheelRollAngleRef = useRef(0);
  const totalDistanceRef = useRef(0);
  const frameCounterRef = useRef(0);

  // Sync saat posisi direset dari luar
  useEffect(() => {
    posRef.current.set(truckPosition[0], truckPosition[1], truckPosition[2]);
    headingRef.current = truckHeading;
  }, [truckPosition, truckHeading]);

  // Frame Loop Animasi Prosedural & Fisika Kemudi Peterbilt 389
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const DEG_TO_RAD = Math.PI / 180;
    const keys = keysPressed.current;

    // 1. Tentukan Input Gas / Throttle (-1: Mundur, 0: Lepas Gas, +1: Maju)
    let effThrottle = throttleInput;
    if (keys['w'] || keys['arrowup']) effThrottle = 1;
    if (keys['s'] || keys['arrowdown']) effThrottle = -1;
    const isBraking = keys[' '] || keys['space'];

    // 2. Tentukan Input Kemudi (-1: Kiri, 0: Lepas/Lurus, +1: Kanan)
    let effSteerDir = steerInput;
    if (keys['a'] || keys['arrowleft']) effSteerDir = -1;
    if (keys['d'] || keys['arrowright']) effSteerDir = 1;

    // 3. Modus Auto-Drive Simulator
    if (autoDrive) {
      effThrottle = 0.8;
      effSteerDir = Math.sin(state.clock.elapsedTime * 0.7) * 0.65;
    }

    // 4. Kalkulasi Kecepatan Fisik
    let v = currentSpeedRef.current;
    const topForwardSpeed = cruiseSpeed > 0 ? cruiseSpeed : 16.0; // ~58 km/jam
    const topReverseSpeed = -5.5; // Mundur

    if (isBraking) {
      if (v > 0) v = Math.max(0, v - 24 * dt);
      else if (v < 0) v = Math.min(0, v + 24 * dt);
    } else if (effThrottle > 0) {
      const accelRate = v < 4 ? 14 : 10;
      v = Math.min(topForwardSpeed, v + accelRate * dt);
    } else if (effThrottle < 0) {
      v = Math.max(topReverseSpeed, v - 9 * dt);
    } else if (cruiseSpeed > 0) {
      if (v < cruiseSpeed) v = Math.min(cruiseSpeed, v + 8 * dt);
      else v = Math.max(cruiseSpeed, v - 6 * dt);
    } else {
      if (v > 0) v = Math.max(0, v - 6 * dt);
      else if (v < 0) v = Math.min(0, v + 6 * dt);
    }
    currentSpeedRef.current = v;

    // 5. Kalkulasi Derajat Kemudi Setir (-30° Kiri s/d +30° Kanan)
    let curSteer = currentSteerDegRef.current;
    if (effSteerDir < 0) {
      curSteer = Math.max(-30, curSteer - 85 * dt);
    } else if (effSteerDir > 0) {
      curSteer = Math.min(30, curSteer + 85 * dt);
    } else {
      if (curSteer > 0) {
        curSteer = Math.max(0, curSteer - 95 * dt);
      } else if (curSteer < 0) {
        curSteer = Math.min(0, curSteer + 95 * dt);
      }
    }
    currentSteerDegRef.current = curSteer;

    // Nilai variable.steering di Blockbench:
    // Belok Kiri (curSteer < 0) -> variable.steering > 0 (+30)
    // Belok Kanan (curSteer > 0) -> variable.steering < 0 (-30)
    const varSteering = -curSteer;

    // 6. Fisika Belok Truk (Yaw Heading) Saat Bergerak
    if (Math.abs(v) > 0.05) {
      const turnRateMultiplier = Math.min(1.0, Math.abs(v) / 4.0);
      const turnSpeed = (varSteering / 30) * 1.35 * turnRateMultiplier * dt;
      const dirSign = v >= 0 ? 1 : -1;
      headingRef.current += turnSpeed * dirSign;
    }

    // 7. Fisika Translasi Posisi Truk di Dunia 3D
    const distanceStep = v * dt;
    totalDistanceRef.current += Math.abs(distanceStep);

    const currentHeading = headingRef.current;
    posRef.current.x -= Math.sin(currentHeading) * distanceStep;
    posRef.current.z -= Math.cos(currentHeading) * distanceStep;

    // Terapkan posisi dan rotasi heading truk ke grup 3D utama
    if (groupRef.current) {
      groupRef.current.position.set(posRef.current.x, 0, posRef.current.z);
      groupRef.current.rotation.y = currentHeading;
    }

    // 8. Rotasi Roda Sesuai Kecepatan & Diameter Ban
    const wheelRadius = 0.48; // meter
    wheelRollAngleRef.current -= distanceStep / wheelRadius;
    const wheelRoll = wheelRollAngleRef.current;

    // Formula Animasi Blockbench Peterbilt 389
    const frontWheelYawDeg = Math.max(-35, Math.min(35, varSteering * 1.2));
    const frontWheelYawRad = frontWheelYawDeg * DEG_TO_RAD;

    const steerYawDeg = Math.max(-540, Math.min(540, varSteering * 2.5));
    const steerYawRad = steerYawDeg * DEG_TO_RAD;

    const trailerYawDeg = Math.max(-40, Math.min(40, varSteering * -0.5));
    const trailerYawRad = trailerYawDeg * DEG_TO_RAD;

    const bones = bonesRef.current;

    // Roda Depan 1 & 2 (order YXZ mencegah gimbal lock)
    if (bones.bandep1) {
      bones.bandep1.rotation.order = 'YXZ';
      bones.bandep1.rotation.set(wheelRoll, frontWheelYawRad, 0, 'YXZ');
    }
    if (bones.bandep2) {
      bones.bandep2.rotation.order = 'YXZ';
      bones.bandep2.rotation.set(wheelRoll, frontWheelYawRad, 0, 'YXZ');
    }

    // Roda Belakang
    if (bones.banb1R) bones.banb1R.rotation.set(wheelRoll, 0, 0);
    if (bones.banb2R) bones.banb2R.rotation.set(wheelRoll, 0, 0);
    if (bones.banb1L) bones.banb1L.rotation.set(wheelRoll, 0, 0);
    if (bones.banb2L) bones.banb2L.rotation.set(wheelRoll, 0, 0);

    // Setir Kemudi Kabin
    if (bones.steer) {
      bones.steer.rotation.set(0, steerYawRad, 0);
    }

    // Trailer
    if (bones.trailer) {
      bones.trailer.rotation.set(0, trailerYawRad, 0);
    }

    // Gear Transmisi
    if (bones.gear) {
      bones.gear.rotation.set(0, 0, totalDistanceRef.current * 200 * DEG_TO_RAD);
    }

    // Pedal Gas
    if (bones.gas) {
      const gasDepressed = effThrottle > 0 ? -0.06 : 0;
      bones.gas.position.set(0, gasDepressed, 0);
    }

    // Suspensi Dinamis & Vibrasi Mesin Diesel
    if (bones.truckRoot) {
      const speedVibe = Math.min(1.5, Math.abs(v) / 5.0);
      const idleShakeY = Math.sin(state.clock.elapsedTime * 28) * (0.002 + speedVibe * 0.003);
      const idleRollZ = Math.sin(state.clock.elapsedTime * 18) * (0.001 + speedVibe * 0.0015);

      const dynamicRoll = (varSteering / 30) * Math.min(1.0, Math.abs(v) / 6.0) * 1.3 * DEG_TO_RAD;
      const dynamicPitch = effThrottle > 0 ? -0.015 : effThrottle < 0 ? 0.012 : 0;

      bones.truckRoot.position.y = 0.125 + idleShakeY;
      bones.truckRoot.rotation.x = dynamicPitch;
      bones.truckRoot.rotation.z = idleRollZ + dynamicRoll;
    }

    // Sinkronisasi Telemetry ke Context
    frameCounterRef.current++;
    if (frameCounterRef.current % 6 === 0) {
      setTruckPosition([posRef.current.x, posRef.current.y, posRef.current.z]);
      setTruckHeading(currentHeading);
      setSpeed(v);
      setSteering(curSteer);
    }
  });

  return (
    <group ref={groupRef} position={[truckPosition[0], 0, truckPosition[2]]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/truck.glb');
