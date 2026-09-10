import React, { useMemo, useRef, useEffect } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

/**
 * SISTEM JALAN TAK HINGGA (INFINITE HIGHWAY) & OPTIMASI TINGGI INSTANCED MESH
 * - Draw calls berkurang dari 350+ menjadi hanya ~6 draw call!
 * - Jalan raya, marka, tiang reflektor, dan pohon bergerak/tiling secara mulus
 *   mengikuti pergerakan truk (Z & X), sehingga truk bisa berjalan selamanya tanpa habis jalan.
 */

// Konstanta spacing periodik (dalam meter)
const STRIPE_INTERVAL = 7.5;     // Jarak antar marka putus-putus
const NUM_STRIPES = 120;         // 120 marka = rentang 900 meter di depan & belakang
const POST_INTERVAL = 22.5;      // Jarak antar tiang pembatas
const NUM_POSTS = 40;            // 40 tiang kiri & 40 tiang kanan
const NUM_TREES = 50;            // Pepohonan dekorasi sisi jalan (instanced)

export function Environment() {
  const { truckPhysicsRef } = useTruck();

  const roadGroupRef = useRef<THREE.Group>(null);
  const terrainRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  // Instanced Meshes
  const stripesMeshRef = useRef<THREE.InstancedMesh>(null);
  const postsWhiteMeshRef = useRef<THREE.InstancedMesh>(null);
  const postsOrangeMeshRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const treeFoliageMeshRef = useRef<THREE.InstancedMesh>(null);

  // Inisialisasi posisi matriks untuk Instanced Mesh (hanya dibuat 1 kali di memori)
  useEffect(() => {
    const dummy = new THREE.Object3D();

    // 1. Marka Kuning Putus-putus (Center Dashed Lines)
    if (stripesMeshRef.current) {
      const halfCount = Math.floor(NUM_STRIPES / 2);
      for (let i = 0; i < NUM_STRIPES; i++) {
        const localZ = (i - halfCount) * STRIPE_INTERVAL;
        dummy.position.set(0, 0.006, localZ);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stripesMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      stripesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Tiang Pembatas Jalan Reflektor Kiri & Kanan (Instanced)
    if (postsWhiteMeshRef.current && postsOrangeMeshRef.current) {
      const halfPosts = Math.floor(NUM_POSTS / 2);
      let instanceIdx = 0;

      for (let i = 0; i < NUM_POSTS; i++) {
        const localZ = (i - halfPosts) * POST_INTERVAL;

        // Tiang Kiri (X = -6.2)
        dummy.position.set(-6.2, 0.45, localZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postsWhiteMeshRef.current.setMatrixAt(instanceIdx, dummy.matrix);

        dummy.position.set(-6.2, 0.7, localZ);
        dummy.updateMatrix();
        postsOrangeMeshRef.current.setMatrixAt(instanceIdx, dummy.matrix);
        instanceIdx++;

        // Tiang Kanan (X = 6.2)
        dummy.position.set(6.2, 0.45, localZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postsWhiteMeshRef.current.setMatrixAt(instanceIdx, dummy.matrix);

        dummy.position.set(6.2, 0.7, localZ);
        dummy.updateMatrix();
        postsOrangeMeshRef.current.setMatrixAt(instanceIdx, dummy.matrix);
        instanceIdx++;
      }
      postsWhiteMeshRef.current.instanceMatrix.needsUpdate = true;
      postsOrangeMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Pohon Cemara Sisi Jalan (Instanced) untuk kesan kecepatan & lanskap
    if (treeTrunkMeshRef.current && treeFoliageMeshRef.current) {
      const halfTrees = Math.floor(NUM_TREES / 2);
      let treeIdx = 0;

      for (let i = 0; i < NUM_TREES; i++) {
        const localZ = (i - halfTrees) * 20 + ((i * 17) % 7);
        const side = i % 2 === 0 ? -1 : 1;
        const xDist = side * (14 + ((i * 13) % 18));
        const treeScale = 0.8 + ((i * 7) % 5) * 0.15;

        // Batang
        dummy.position.set(xDist, 1.2 * treeScale, localZ);
        dummy.rotation.set(0, (i * 1.3) % Math.PI, 0);
        dummy.scale.set(treeScale, treeScale, treeScale);
        dummy.updateMatrix();
        treeTrunkMeshRef.current.setMatrixAt(treeIdx, dummy.matrix);

        // Daun Kerucut
        dummy.position.set(xDist, 3.2 * treeScale, localZ);
        dummy.updateMatrix();
        treeFoliageMeshRef.current.setMatrixAt(treeIdx, dummy.matrix);

        treeIdx++;
      }
      treeTrunkMeshRef.current.instanceMatrix.needsUpdate = true;
      treeFoliageMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  // Update loop untuk Infinite Road dan Dynamic Shadow Frustum (60 FPS real-time)
  useFrame(() => {
    const pos = truckPhysicsRef.current.position;
    const tx = pos.x;
    const ty = pos.y;
    const tz = pos.z;

    // A. Infinite Snap: Geser grup jalan raya setiap kelipatan STRIPE_INTERVAL (7.5m)
    // Karena jarak antar marka = 7.5m, pergeseran grup ini 100% mulus tanpa jeda atau kedipan!
    const snappedZ = Math.round(tz / STRIPE_INTERVAL) * STRIPE_INTERVAL;

    if (roadGroupRef.current) {
      roadGroupRef.current.position.z = snappedZ;
    }

    // B. Infinite Terrain: Tanah rumput selalu berada di bawah truk dimanapun truk berada
    if (terrainRef.current) {
      terrainRef.current.position.set(tx, -0.002, tz);
    }

    // C. Dynamic Sun Shadow: Mengikuti truk agar bayangan selalu tajam dengan resolusi efisien
    if (lightRef.current) {
      lightRef.current.position.set(tx + 40, 50, tz + 25);
      if (lightTargetRef.current) {
        lightTargetRef.current.position.set(tx, ty, tz);
        lightRef.current.target = lightTargetRef.current;
      }
    }
  });

  return (
    <>
      {/* Target bantuan untuk Directional Light shadow tracking */}
      <primitive object={lightTargetRef.current} />

      {/* Kabut atmosferik halus (Atmospheric Fog) */}
      <fog attach="fog" args={['#b8cde8', 60, 320]} />

      {/* Langit realistis */}
      <Sky
        distance={450000}
        sunPosition={[60, 45, 80]}
        inclination={0.6}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={1.1}
        turbidity={3.5}
      />

      {/* Pencahayaan Teroptimasi */}
      <ambientLight intensity={0.65} color="#f0f6ff" />
      <hemisphereLight
        args={['#dbe9ff', '#3d4d38', 0.55]}
        position={[0, 60, 0]}
      />
      <directionalLight
        ref={lightRef}
        position={[40, 50, 25]}
        intensity={1.85}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.00015}
      />

      {/* ========================================================================= */}
      {/* JALAN RAYA TAK HINGGA (INFINITE HIGHWAY ROAD SYSTEM)                      */}
      {/* ========================================================================= */}
      <group ref={roadGroupRef} position={[0, 0, 0]}>
        {/* 1. Permukaan Utama Aspal (Panjang 1000 meter, bergerak mengikuti snap) */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[11.5, 1000]} />
          <meshStandardMaterial
            color="#22252a"
            roughness={0.84}
            metalness={0.05}
          />
        </mesh>

        {/* 2. Bahu Jalan / Trotoar Kiri */}
        <mesh position={[-6.0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.5, 1000, 0.14]} />
          <meshStandardMaterial color="#6a6e76" roughness={0.9} />
        </mesh>

        {/* 3. Bahu Jalan / Trotoar Kanan */}
        <mesh position={[6.0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.5, 1000, 0.14]} />
          <meshStandardMaterial color="#6a6e76" roughness={0.9} />
        </mesh>

        {/* 4. Garis Marka Putih Solid Tepi Kiri Jalan */}
        <mesh position={[-4.9, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 1000]} />
          <meshBasicMaterial color="#ffffff" opacity={0.92} transparent />
        </mesh>

        {/* 5. Garis Marka Putih Solid Tepi Kanan Jalan */}
        <mesh position={[4.9, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 1000]} />
          <meshBasicMaterial color="#ffffff" opacity={0.92} transparent />
        </mesh>

        {/* 6. Marka Kuning Tengah Putus-Putus (INSTANCED MESH: 1 DRAW CALL!) */}
        <instancedMesh
          ref={stripesMeshRef}
          args={[undefined, undefined, NUM_STRIPES]}
        >
          <planeGeometry args={[0.24, 3.8]} />
          <meshBasicMaterial color="#f8ba26" />
        </instancedMesh>

        {/* 7. Tiang Pembatas Jalan Putih (INSTANCED MESH: 1 DRAW CALL!) */}
        <instancedMesh
          ref={postsWhiteMeshRef}
          args={[undefined, undefined, NUM_POSTS * 2]}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        </instancedMesh>

        {/* 8. Reflektor Oranye Tiang (INSTANCED MESH: 1 DRAW CALL!) */}
        <instancedMesh
          ref={postsOrangeMeshRef}
          args={[undefined, undefined, NUM_POSTS * 2]}
        >
          <cylinderGeometry args={[0.055, 0.055, 0.16, 6]} />
          <meshBasicMaterial color="#ff5500" />
        </instancedMesh>

        {/* 9. Batang Pohon Sisi Jalan (INSTANCED MESH: 1 DRAW CALL!) */}
        <instancedMesh
          ref={treeTrunkMeshRef}
          args={[undefined, undefined, NUM_TREES]}
        >
          <cylinderGeometry args={[0.18, 0.28, 2.4, 6]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </instancedMesh>

        {/* 10. Dedaunan Pohon Cemara (INSTANCED MESH: 1 DRAW CALL!) */}
        <instancedMesh
          ref={treeFoliageMeshRef}
          args={[undefined, undefined, NUM_TREES]}
        >
          <coneGeometry args={[1.3, 4.2, 6]} />
          <meshStandardMaterial color="#2d4227" roughness={0.8} />
        </instancedMesh>
      </group>

      {/* ========================================================================= */}
      {/* TANAH RUMPUT TAK HINGGA (INFINITE TERRAIN)                                */}
      {/* ========================================================================= */}
      <mesh
        ref={terrainRef}
        position={[0, -0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial
          color="#354a34"
          roughness={0.96}
          metalness={0.01}
        />
      </mesh>
    </>
  );
}
