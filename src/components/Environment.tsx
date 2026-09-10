import React, { useMemo } from 'react';
import { Sky } from '@react-three/drei';

export function Environment() {
  // Buat marka jalan putus-putus kuning di tengah jalan (rentang panjang)
  const dashedLines = useMemo(() => {
    const stripes: number[] = [];
    for (let z = -600; z <= 600; z += 7.5) {
      stripes.push(z);
    }
    return stripes;
  }, []);

  // Tiang pembatas / reflektor tepi jalan untuk sensasi kecepatan
  const roadPosts = useMemo(() => {
    const posts: number[] = [];
    for (let z = -550; z <= 550; z += 25) {
      posts.push(z);
    }
    return posts;
  }, []);

  return (
    <>
      {/* Kabut atmosferik halus untuk kedalaman pemandangan tanpa garis artifact */}
      <fog attach="fog" args={['#b8cde8', 40, 260]} />

      {/* Langit cerah realistis */}
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

      {/* Pencahayaan multi-sumber */}
      <ambientLight intensity={0.7} color="#f0f6ff" />
      <hemisphereLight
        args={['#dbe9ff', '#3d4d38', 0.6]}
        position={[0, 60, 0]}
      />
      <directionalLight
        position={[45, 65, 35]}
        intensity={1.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={180}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      {/* 1. JALAN RAYA ASPAL (HIGHWAY ROAD BERSIH TANPA GRID) */}
      <group position={[0, 0, 0]}>
        {/* Permukaan Utama Aspal Jalan Raya (Panjang 1200 meter) */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[11, 1200]} />
          <meshStandardMaterial
            color="#23262c"
            roughness={0.82}
            metalness={0.08}
          />
        </mesh>

        {/* Bahu Jalan / Trotoar Kiri */}
        <mesh position={[-5.8, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.6, 1200, 0.16]} />
          <meshStandardMaterial color="#7a7e86" roughness={0.9} />
        </mesh>

        {/* Bahu Jalan / Trotoar Kanan */}
        <mesh position={[5.8, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.6, 1200, 0.16]} />
          <meshStandardMaterial color="#7a7e86" roughness={0.9} />
        </mesh>

        {/* Garis Marka Putih Solid Tepi Kiri Jalan */}
        <mesh position={[-4.8, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 1200]} />
          <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
        </mesh>

        {/* Garis Marka Putih Solid Tepi Kanan Jalan */}
        <mesh position={[4.8, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 1200]} />
          <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
        </mesh>

        {/* Garis Marka Kuning Putus-putus di Tengah Jalan (Divider) */}
        {dashedLines.map((zPos, idx) => (
          <mesh key={idx} position={[0, 0.007, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.24, 3.8]} />
            <meshBasicMaterial color="#f8ba26" />
          </mesh>
        ))}

        {/* Patok Pembatas Jalan Kiri & Kanan (Reflektor putih/oranye) */}
        {roadPosts.map((zPos, idx) => (
          <group key={`post-${idx}`}>
            {/* Tiang kiri */}
            <mesh position={[-6.2, 0.45, zPos]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
            </mesh>
            <mesh position={[-6.2, 0.7, zPos]}>
              <cylinderGeometry args={[0.065, 0.065, 0.18, 8]} />
              <meshBasicMaterial color="#ff5500" />
            </mesh>

            {/* Tiang kanan */}
            <mesh position={[6.2, 0.45, zPos]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
            </mesh>
            <mesh position={[6.2, 0.7, zPos]}>
              <cylinderGeometry args={[0.065, 0.065, 0.18, 8]} />
              <meshBasicMaterial color="#ff5500" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 2. TANAH / AREA RUMPUT SEKITAR JALAN (BERSIH TANPA GRID BUG) */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial
          color="#384f37"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
    </>
  );
}
