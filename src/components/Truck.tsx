import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck, BoneStatus } from '../context/TruckContext';

/**
 * Helper khusus untuk model hasil export Blockbench ke GLTF/GLB:
 * Blockbench sering menamai banyak mesh anak dengan nama yang sama persis
 * seperti bone induknya. Fungsi ini secara cerdas menemukan Bone Master Induk
 * (yaitu objek Group yang memiliki anak mesh, bukan sekadar potongan mesh kubus tunggal).
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
    // Pilih yang memiliki jumlah anak paling banyak (bone container utama)
    nonMeshParents.sort((a, b) => b.children.length - a.children.length);
    return nonMeshParents[0];
  }

  // Fallback: pilih node dengan anak terbanyak
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
    door1Progress,
    door2Progress,
    wiperActive,
    autoDrive,
    addLog,
    registerBones,
  } = useTruck();

  // Cache referensi ke bone-bone utama Blockbench
  const bonesRef = useRef<{
    door1?: THREE.Object3D | null;
    door2?: THREE.Object3D | null;
    steer?: THREE.Object3D | null;
    bandep1?: THREE.Object3D | null;
    bandep2?: THREE.Object3D | null;
    banb1R?: THREE.Object3D | null;
    banb2R?: THREE.Object3D | null;
    banb2L?: THREE.Object3D | null;
    banb1L?: THREE.Object3D | null;
    wiperr?: THREE.Object3D | null;
    wiperl?: THREE.Object3D | null;
    gas?: THREE.Object3D | null;
    trailer?: THREE.Object3D | null;
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
      'door1',
      'door2',
      'steer',
      'bandep1',
      'bandep2',
      'banb1R',
      'banb2R',
      'banb2L',
      'banb1L',
      'wiperr',
      'wiperl',
      'gas',
      'trailer',
      'truck',
    ];

    const discoveredBones: Record<string, BoneStatus> = {};
    const resolvedBones: Record<string, THREE.Object3D | null> = {};

    targetNames.forEach((targetName) => {
      const master = findMasterBone(scene, targetName);
      resolvedBones[targetName] = master;
      discoveredBones[targetName] = {
        name: targetName,
        found: !!master,
        childrenCount: master ? master.children.length : 0,
        type: master ? master.type : 'Not Found',
      };
    });

    bonesRef.current = {
      door1: resolvedBones['door1'],
      door2: resolvedBones['door2'],
      steer: resolvedBones['steer'],
      bandep1: resolvedBones['bandep1'],
      bandep2: resolvedBones['bandep2'],
      banb1R: resolvedBones['banb1R'],
      banb2R: resolvedBones['banb2R'],
      banb2L: resolvedBones['banb2L'],
      banb1L: resolvedBones['banb1L'],
      wiperr: resolvedBones['wiperr'],
      wiperl: resolvedBones['wiperl'],
      gas: resolvedBones['gas'],
      trailer: resolvedBones['trailer'],
      truckRoot: resolvedBones['truck'],
    };

    registerBones(discoveredBones);
  }, [scene, registerBones]);

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
    const dt = Math.min(delta, 0.1); // Guard dari lonjakan delta frame
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

    // 3. Modus Auto-Drive
    if (autoDrive) {
      effThrottle = 0.8;
      // Berbelok dinamis halus di jalan raya
      effSteerDir = Math.sin(state.clock.elapsedTime * 0.7) * 0.65;
    }

    // 4. Kalkulasi Kecepatan Fisik (Super Responsif)
    let v = currentSpeedRef.current;
    const topForwardSpeed = cruiseSpeed > 0 ? cruiseSpeed : 16.0; // ~58 km/jam
    const topReverseSpeed = -5.5; // Mundur

    if (isBraking) {
      // Pengereman cepat
      if (v > 0) v = Math.max(0, v - 24 * dt);
      else if (v < 0) v = Math.min(0, v + 24 * dt);
    } else if (effThrottle > 0) {
      // Maju dengan akselerasi cepat & instan
      const accelRate = v < 4 ? 14 : 10;
      v = Math.min(topForwardSpeed, v + accelRate * dt);
    } else if (effThrottle < 0) {
      // Mundur
      v = Math.max(topReverseSpeed, v - 9 * dt);
    } else if (cruiseSpeed > 0) {
      // Cruise konstan
      if (v < cruiseSpeed) v = Math.min(cruiseSpeed, v + 8 * dt);
      else v = Math.max(cruiseSpeed, v - 6 * dt);
    } else {
      // Friksi gelinding alami (rolling drag)
      if (v > 0) v = Math.max(0, v - 6 * dt);
      else if (v < 0) v = Math.min(0, v + 6 * dt);
    }
    currentSpeedRef.current = v;

    // 5. Kalkulasi Derajat Kemudi Setir (-30° Kiri s/d +30° Kanan)
    let curSteer = currentSteerDegRef.current;
    if (effSteerDir < 0) {
      // Belok KIRI (nilai negatif: mendekati -30°)
      curSteer = Math.max(-30, curSteer - 85 * dt);
    } else if (effSteerDir > 0) {
      // Belok KANAN (nilai positif: mendekati +30°)
      curSteer = Math.min(30, curSteer + 85 * dt);
    } else {
      // Otomatis lurus kembali saat kemudi dilepas (self-centering)
      if (curSteer > 0.5) curSteer = Math.max(0, curSteer - 65 * dt);
      else if (curSteer < -0.5) curSteer = Math.min(0, curSteer + 65 * dt);
      else curSteer = 0;
    }
    currentSteerDegRef.current = curSteer;

    // 6. Fisika Belok Truk (Yaw Heading) Saat Bergerak
    // Di Three.js: Truk menghadap ke sumbu -Z.
    // Belok Kanan (+curSteer) harus memutar heading searah jarum jam (mengurangi radian heading).
    // Belok Kiri (-curSteer) harus memutar heading berlawanan jarum jam (menambah radian heading).
    if (Math.abs(v) > 0.05) {
      const turnRateMultiplier = Math.min(1.0, Math.abs(v) / 4.0);
      const turnSpeed = (curSteer / 30) * 1.35 * turnRateMultiplier * dt;
      // Jika maju: curSteer > 0 (kanan) -> heading berkurang (belok kanan).
      // Jika mundur: arah belok berkebalikan otomatis karena tanda kecepatan v
      const dirSign = v >= 0 ? 1 : -1;
      headingRef.current -= turnSpeed * dirSign;
    }

    // 7. Fisika Translasi Posisi Truk di Dunia 3D
    const currentHeading = headingRef.current;
    const forwardX = -Math.sin(currentHeading);
    const forwardZ = -Math.cos(currentHeading);
    const distanceStep = v * dt;

    posRef.current.x += forwardX * distanceStep;
    posRef.current.z += forwardZ * distanceStep;
    totalDistanceRef.current += Math.abs(distanceStep);

    // Update Transformasi Root Objek Truk
    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      groupRef.current.rotation.y = currentHeading;
    }

    // 8. Rotasi Roda Sesuai Kecepatan & Diameter Ban
    // Ban berputar maju: saat maju, sudut X berkurang (rotasi rolling ke depan)
    const wheelRadius = 0.48; // meter
    wheelRollAngleRef.current -= distanceStep / wheelRadius;
    const wheelRoll = wheelRollAngleRef.current;

    // Sudut Belok Roda Depan:
    // Belok Kiri (curSteer < 0): Roda harus mengarah ke kiri (-X) -> Rotasi Y positif
    // Belok Kanan (curSteer > 0): Roda harus mengarah ke kanan (+X) -> Rotasi Y negatif
    // Rumus: - (curSteer * 1.15) * DEG_TO_RAD
    const frontWheelSteerAngle = -curSteer * 1.15 * DEG_TO_RAD;

    // Setir Kemudi Kabin:
    // Belok Kiri: Setir berputar ke kiri (- curSteer * 2.5) -> Positif rotasi Y
    // Belok Kanan: Setir berputar ke kanan -> Negatif rotasi Y
    const cabinSteerWheelAngle = -curSteer * 2.5 * DEG_TO_RAD;

    const bones = bonesRef.current;

    // =========================================================================
    // APLIKASIKAN KE HIERARKI BONE BLOCKBENCH MODEL PETERBILT 389
    // =========================================================================

    // Roda Depan 1 (Kanan) & Roda Depan 2 (Kiri)
    if (bones.bandep1) {
      bones.bandep1.rotation.set(wheelRoll, frontWheelSteerAngle, 0);
    }
    if (bones.bandep2) {
      bones.bandep2.rotation.set(wheelRoll, frontWheelSteerAngle, 0);
    }

    // Roda Belakang (Ban Belakang 1R, 2R, 1L, 2L)
    if (bones.banb1R) bones.banb1R.rotation.set(wheelRoll, 0, 0);
    if (bones.banb2R) bones.banb2R.rotation.set(wheelRoll, 0, 0);
    if (bones.banb1L) bones.banb1L.rotation.set(wheelRoll, 0, 0);
    if (bones.banb2L) bones.banb2L.rotation.set(wheelRoll, 0, 0);

    // Setir Kemudi di Dalam Kabin
    if (bones.steer) {
      bones.steer.rotation.set(0, cabinSteerWheelAngle, 0);
    }

    // Trailer (jika ada pada model, sudut trailer merespons kemudi)
    if (bones.trailer) {
      const trailerAngle = curSteer * 0.45 * DEG_TO_RAD;
      bones.trailer.rotation.set(0, trailerAngle, 0);
    }

    // Pedal Gas (Turun saat menginjak gas maju)
    if (bones.gas) {
      const gasDepressed = effThrottle > 0 ? -0.06 : 0;
      bones.gas.position.set(0, gasDepressed, 0);
    }

    // Animasi Pintu Peterbilt 389
    if (bones.door1) {
      // Pintu 1 (Kanan): Terbuka keluar sampai -45 derajat
      const door1Angle = -45 * door1Progress * DEG_TO_RAD;
      bones.door1.rotation.set(0, door1Angle, 0);
    }
    if (bones.door2) {
      // Pintu 2 (Kiri): Terbuka keluar sampai +45 derajat
      const door2Angle = 45 * door2Progress * DEG_TO_RAD;
      bones.door2.rotation.set(0, door2Angle, 0);
    }

    // Wiper Kaca Depan
    if (bones.wiperr || bones.wiperl) {
      const wiperAngle = wiperActive ? Math.sin(state.clock.elapsedTime * 8) * 30 * DEG_TO_RAD : 0;
      if (bones.wiperr) bones.wiperr.rotation.set(0, 0, wiperAngle);
      if (bones.wiperl) bones.wiperl.rotation.set(0, 0, wiperAngle);
    }

    // Getaran Suspensi Mesin Diesel Truk
    if (bones.truckRoot) {
      const speedVibe = Math.min(1.5, Math.abs(v) / 5.0);
      const idleShakeY = Math.sin(state.clock.elapsedTime * 28) * (0.002 + speedVibe * 0.003);
      const idleRollZ = Math.sin(state.clock.elapsedTime * 18) * (0.001 + speedVibe * 0.0015);
      bones.truckRoot.position.y = 0.125 + idleShakeY;
      bones.truckRoot.rotation.z = idleRollZ;
    }

    // 9. Sinkronisasi Telemetry ke UI Context (Setiap 6 Frame agar UI tetap ringan)
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
