import React, { useRef, useMemo } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

/**
 * HIGHWAY ENVIRONMENT (SISTEM JALAN TOL TAK HINGGA 3-CHUNK)
 * - Bebas Pop / Bebas Teleport / Zero Jitter.
 * - Chunk hanya dipindahkan saat berada 200+ meter di belakang truk.
 */

const CHUNK_SIZE = 180; // Panjang setiap chunk dalam meter
const NUM_CHUNKS = 3;   // 3 chunk = 540 meter jalan berkelanjutan

interface ChunkProps {
  chunkRef: React.RefObject<THREE.Group>;
}

// Komponen 1 Chunk Jalan Raya Mandiri
function RoadChunk({ chunkRef }: ChunkProps) {
  // Posisi marka putus-putus tengah (setiap 7.5m)
  const stripeZPositions = useMemo(() => {
    const list: number[] = [];
    const count = Math.floor(CHUNK_SIZE / 7.5);
    const startZ = -(CHUNK_SIZE / 2) + 3.75;
    for (let i = 0; i < count; i++) {
      list.push(startZ + i * 7.5);
    }
    return list;
  }, []);

  // Posisi tiang pembatas jalan (setiap 20m)
  const postZPositions = useMemo(() => {
    const list: number[] = [];
    const count = Math.floor(CHUNK_SIZE / 20);
    const startZ = -(CHUNK_SIZE / 2) + 10;
    for (let i = 0; i < count; i++) {
      list.push(startZ + i * 20);
    }
    return list;
  }, []);

  // Posisi pohon cemara di pinggir jalan
  const treePositions = useMemo(() => {
    return [
      { x: -14, z: -70, s: 1.1 },
      { x: 15, z: -55, s: 0.9 },
      { x: -18, z: -30, s: 1.3 },
      { x: 16, z: -10, s: 1.0 },
      { x: -15, z: 15, s: 0.85 },
      { x: 17, z: 35, s: 1.2 },
      { x: -19, z: 55, s: 1.05 },
      { x: 14, z: 75, s: 0.95 },
    ];
  }, []);

  return (
    <group ref={chunkRef}>
      {/* 1. Aspal Utama */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, CHUNK_SIZE]} />
        <meshStandardMaterial color="#1c2024" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* 2. Bahu Jalan / Beton Pembatas Samping (Curbs) */}
      <mesh position={[-5.85, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.5, 0.06, CHUNK_SIZE]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[5.85, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.5, 0.06, CHUNK_SIZE]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* 3. Garis Tepi Putih Menerus */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.25, 0.005, 0]}>
        <planeGeometry args={[0.2, CHUNK_SIZE]} />
        <meshBasicMaterial color="#f1f5f9" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.25, 0.005, 0]}>
        <planeGeometry args={[0.2, CHUNK_SIZE]} />
        <meshBasicMaterial color="#f1f5f9" />
      </mesh>

      {/* 4. Marka Tengah Putus-putus Kuning (Dashed Yellow) */}
      {stripeZPositions.map((z, idx) => (
        <mesh key={`stripe-${idx}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, z]}>
          <planeGeometry args={[0.22, 3.8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      ))}

      {/* 5. Tiang Pembatas Reflektor (Guide Posts) */}
      {postZPositions.map((z, idx) => (
        <group key={`posts-${idx}`}>
          {/* Tiang Kiri */}
          <group position={[-6.2, 0, z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.16, 6]} />
              <meshBasicMaterial color="#ea580c" />
            </mesh>
          </group>

          {/* Tiang Kanan */}
          <group position={[6.2, 0, z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.16, 6]} />
              <meshBasicMaterial color="#ea580c" />
            </mesh>
          </group>
        </group>
      ))}

      {/* 6. Pepohonan Cemara Rendah Poligon (Low Poly Pines) */}
      {treePositions.map((t, idx) => (
        <group key={`tree-${idx}`} position={[t.x, 0, t.z]} scale={[t.s, t.s, t.s]}>
          {/* Batang Pohon */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 2.0, 5]} />
            <meshStandardMaterial color="#3e2723" roughness={0.9} />
          </mesh>
          {/* Tajuk Daun Kerucut */}
          <mesh position={[0, 2.6, 0]} castShadow>
            <coneGeometry args={[1.6, 2.6, 6]} />
            <meshStandardMaterial color="#1e392a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.0, 0]} castShadow>
            <coneGeometry args={[1.2, 2.2, 6]} />
            <meshStandardMaterial color="#264634" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function HighwayEnvironment() {
  const { truckPhysicsRef } = useTruck();

  const chunk0Ref = useRef<THREE.Group>(null);
  const chunk1Ref = useRef<THREE.Group>(null);
  const chunk2Ref = useRef<THREE.Group>(null);

  const terrainRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const lastCenterIdx = useRef<number | null>(null);

  // Streaming Chunks Logic (Seamless Infinite Highway)
  useFrame(() => {
    const pos = truckPhysicsRef.current.position;
    const tx = pos.x;
    const tz = pos.z;

    const centerIdx = Math.round(tz / CHUNK_SIZE);

    if (centerIdx !== lastCenterIdx.current) {
      lastCenterIdx.current = centerIdx;

      const chunkRefs = [chunk0Ref.current, chunk1Ref.current, chunk2Ref.current];

      for (let offset = -1; offset <= 1; offset++) {
        const targetChunkIdx = centerIdx + offset;
        const slot = ((targetChunkIdx % NUM_CHUNKS) + NUM_CHUNKS) % NUM_CHUNKS;
        const targetGroup = chunkRefs[slot];
        if (targetGroup) {
          targetGroup.position.z = targetChunkIdx * CHUNK_SIZE;
        }
      }
    }

    if (terrainRef.current) {
      terrainRef.current.position.set(tx, -0.01, tz);
    }

    if (lightRef.current) {
      lightRef.current.position.set(tx + 30, 40, tz + 20);
      if (lightTargetRef.current) {
        lightTargetRef.current.position.set(tx, 0, tz);
        lightRef.current.target = lightTargetRef.current;
      }
    }
  });

  return (
    <>
      <primitive object={lightTargetRef.current} />

      <fog attach="fog" args={['#b8cde8', 60, 240]} />

      <Sky
        distance={450000}
        sunPosition={[50, 40, 70]}
        inclination={0.6}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={1.0}
        turbidity={3.0}
      />

      <ambientLight intensity={0.7} color="#f1f5f9" />
      <hemisphereLight args={['#e0f2fe', '#1e293b', 0.5]} position={[0, 50, 0]} />

      <directionalLight
        ref={lightRef}
        position={[30, 40, 20]}
        intensity={1.75}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />

      <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#2d4a29" roughness={0.96} metalness={0.02} />
      </mesh>

      <RoadChunk chunkRef={chunk0Ref} />
      <RoadChunk chunkRef={chunk1Ref} />
      <RoadChunk chunkRef={chunk2Ref} />
    </>
  );
}
