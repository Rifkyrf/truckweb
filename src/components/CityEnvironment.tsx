import React, { useMemo, useRef } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTruck } from '../context/TruckContext';

/**
 * CITY ENVIRONMENT (MODE JELAJAH KOTA):
 * - Dirancang khusus untuk eksplorasi truk Peterbilt 389 dengan belokan persimpangan 90°,
 *   jalan protokol berlapis aspal lebar, trotoar kota, dan gedung-gedung bertingkat modern.
 * - Performa sangat ringan (geometri efisien, shared materials, zero stutter).
 */

interface BuildingData {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  windowColor: string;
  hasAntenna?: boolean;
  hasHelipad?: boolean;
  signText?: string;
}

export function CityEnvironment() {
  const { truckPhysicsRef } = useTruck();
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  // Ikuti posisi truk untuk bayangan matahari directional
  useFrame(() => {
    const pos = truckPhysicsRef.current.position;
    if (lightRef.current) {
      lightRef.current.position.set(pos.x + 35, 60, pos.z + 25);
      if (lightTargetRef.current) {
        lightTargetRef.current.position.set(pos.x, 0, pos.z);
        lightRef.current.target = lightTargetRef.current;
      }
    }
  });

  // Data Blok Gedung Pencakar Langit di berbagai sektor kota
  const buildings = useMemo<BuildingData[]>(() => {
    const list: BuildingData[] = [];
    const colors = ['#1e293b', '#0f172a', '#334155', '#1e2024', '#262930', '#1c2d42'];
    const winColors = ['#93c5fd', '#bae6fd', '#fef08a', '#e2e8f0'];

    // Grid blok perkotaan (Blok Kiri & Blok Kanan dari Jalan Utama, serta Jalan Melintang)
    const blockXOffsets = [-120, -55, 55, 120];
    const blockZOffsets = [-160, -90, -20, 50, 120, 190];

    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    blockXOffsets.forEach((bx) => {
      blockZOffsets.forEach((bz) => {
        // Setiap blok berisi 1-2 gedung bertingkat
        const height = 28 + pseudoRandom() * 65;
        const width = 32 + pseudoRandom() * 16;
        const depth = 35 + pseudoRandom() * 18;
        const color = colors[Math.floor(pseudoRandom() * colors.length)];
        const winColor = winColors[Math.floor(pseudoRandom() * winColors.length)];

        list.push({
          x: bx,
          z: bz,
          w: width,
          d: depth,
          h: height,
          color,
          windowColor: winColor,
          hasAntenna: pseudoRandom() > 0.6,
          hasHelipad: pseudoRandom() > 0.75,
        });
      });
    });

    return list;
  }, []);

  // Posisi Lampu Jalan Kota
  const streetLamps = useMemo(() => {
    const list: { x: number; z: number; rotY: number }[] = [];
    // Lampu di sepanjang Jalan Utama (X = -8.5 dan X = 8.5)
    for (let z = -220; z <= 220; z += 30) {
      list.push({ x: -8.8, z, rotY: Math.PI / 2 });
      list.push({ x: 8.8, z, rotY: -Math.PI / 2 });
    }
    // Lampu di sepanjang Jalan Melintang (Z = -90, Z = 50)
    for (let x = -150; x <= 150; x += 30) {
      if (Math.abs(x) > 12) {
        list.push({ x, z: -98.8, rotY: 0 });
        list.push({ x, z: -81.2, rotY: Math.PI });
        list.push({ x, z: 41.2, rotY: 0 });
        list.push({ x, z: 58.8, rotY: Math.PI });
      }
    }
    return list;
  }, []);

  // Posisi Pohon Peneduh Kota di Trotoar
  const cityTrees = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    for (let z = -205; z <= 205; z += 30) {
      // Selang-seling dengan lampu jalan
      list.push({ x: -9.5, z: z + 15 });
      list.push({ x: 9.5, z: z + 15 });
    }
    return list;
  }, []);

  // Marka Putus-Putus Kuning Jalan Utama
  const mainRoadStripes = useMemo(() => {
    const list: number[] = [];
    for (let z = -250; z <= 250; z += 9) {
      // Kosongkan di area persimpangan (Z = -90 dan Z = 50)
      if (Math.abs(z - (-90)) > 14 && Math.abs(z - 50) > 14) {
        list.push(z);
      }
    }
    return list;
  }, []);

  // Persimpangan 4-Arah (Intersections): Z = -90 dan Z = 50
  const intersections = [-90, 50];

  return (
    <group>
      {/* Objek Target untuk Lampu Bayangan */}
      <primitive object={lightTargetRef.current} />

      {/* Langit Kota Metropolis Modern */}
      <Sky
        distance={450000}
        sunPosition={[60, 50, 40]}
        inclination={0.55}
        azimuth={0.3}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
        rayleigh={1.1}
        turbidity={4.0}
      />

      {/* Kabut Kota Halus (Urban Atmospheric Haze) */}
      <fog attach="fog" args={['#94a3b8', 75, 340]} />

      {/* Pencahayaan Lingkungan Kota */}
      <ambientLight intensity={0.75} color="#f8fafc" />
      <hemisphereLight args={['#e0f2fe', '#334155', 0.6]} position={[0, 50, 0]} />

      <directionalLight
        ref={lightRef}
        position={[35, 60, 25]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0003}
      />

      {/* 1. DASAR TANAH KOTA (Pondasi Aspal & Trotoar Luas) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* 2. JALAN UTAMA KOTA (Central Avenue - Sumbu Z) */}
      {/* Aspal Utama Lebar 16m (2 Jalur Maju + 2 Jalur Mundur) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[16.5, 520]} />
        <meshStandardMaterial color="#171b20" roughness={0.88} metalness={0.1} />
      </mesh>

      {/* Marka Tengah Kuning Ganda (Double Yellow Solid) */}
      {mainRoadStripes.map((z, i) => (
        <group key={`double-yellow-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.15, 0.01, z]}>
            <planeGeometry args={[0.15, 5.0]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.01, z]}>
            <planeGeometry args={[0.15, 5.0]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          {/* Garis Pembatas Putih Lajur Kiri & Kanan */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.0, 0.01, z]}>
            <planeGeometry args={[0.14, 4.0]} />
            <meshBasicMaterial color="#f1f5f9" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.0, 0.01, z]}>
            <planeGeometry args={[0.14, 4.0]} />
            <meshBasicMaterial color="#f1f5f9" />
          </mesh>
        </group>
      ))}

      {/* Garis Tepi Putih Menerus Sepanjang Jalan Utama */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.8, 0.008, 0]}>
        <planeGeometry args={[0.2, 520]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.8, 0.008, 0]}>
        <planeGeometry args={[0.2, 520]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>

      {/* 3. JALAN-JALAN MELINTANG KOTA (Cross Streets - Sumbu X di Persimpangan) */}
      {intersections.map((crossZ, idx) => (
        <group key={`cross-street-${idx}`}>
          {/* Aspal Jalan Melintang (Lebar 14m, Panjang 350m) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, crossZ]} receiveShadow>
            <planeGeometry args={[360, 15]} />
            <meshStandardMaterial color="#171b20" roughness={0.88} />
          </mesh>

          {/* Marka Zebra Cross (Penyeberangan Pejalan Kaki) di 4 Cabang Persimpangan */}
          {/* Zebra Sisi Utara & Selatan (Melintasi Jalan Utama) */}
          {[-10, 10].map((offsetZ, zIdx) => (
            <group key={`zebra-ns-${zIdx}`} position={[0, 0.012, crossZ + offsetZ]}>
              {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((zx, stripIdx) => (
                <mesh key={`z-strip-${stripIdx}`} rotation={[-Math.PI / 2, 0, 0]} position={[zx, 0, 0]}>
                  <planeGeometry args={[0.8, 2.5]} />
                  <meshBasicMaterial color="#f8fafc" />
                </mesh>
              ))}
            </group>
          ))}

          {/* Zebra Sisi Barat & Timur (Melintasi Jalan Melintang) */}
          {[-10, 10].map((offsetX, xIdx) => (
            <group key={`zebra-ew-${xIdx}`} position={[offsetX, 0.012, crossZ]}>
              {[-5, -3.5, -2, -0.5, 1, 2.5, 4, 5.5].map((zz, stripIdx) => (
                <mesh key={`z-strip-ew-${stripIdx}`} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, zz]}>
                  <planeGeometry args={[0.8, 2.5]} />
                  <meshBasicMaterial color="#f8fafc" />
                </mesh>
              ))}
            </group>
          ))}

          {/* Tiang Lampu Lalu Lintas di Sudut Persimpangan (Traffic Lights) */}
          {[
            { tx: -9.2, tz: crossZ - 8.5, ry: 0 },
            { tx: 9.2, tz: crossZ + 8.5, ry: Math.PI },
          ].map((tf, tIdx) => (
            <group key={`traffic-pole-${tIdx}`} position={[tf.tx, 0, tf.tz]} rotation={[0, tf.ry, 0]}>
              {/* Tiang Vertikal */}
              <mesh position={[0, 2.8, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.12, 5.6, 8]} />
                <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Lengan Horizontal melintang ke jalan */}
              <mesh position={[2.0, 5.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 4.2, 6]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
              {/* Rumah Lampu Lalu Lintas */}
              <mesh position={[3.2, 5.0, 0]} castShadow>
                <boxGeometry args={[0.4, 0.9, 0.35]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Lampu Hijau Menyala */}
              <mesh position={[3.2, 4.75, 0.18]}>
                <circleGeometry args={[0.1, 12]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
              {/* Lampu Kuning */}
              <mesh position={[3.2, 5.0, 0.18]}>
                <circleGeometry args={[0.09, 12]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              {/* Lampu Merah */}
              <mesh position={[3.2, 5.25, 0.18]}>
                <circleGeometry args={[0.09, 12]} />
                <meshStandardMaterial color="#881337" />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 4. TROTOAR KOTA ELEVANSI (Paved Sidewalks & Curbs) */}
      {/* Trotoar Sepanjang Jalan Utama (Kiri & Kanan) */}
      <mesh position={[-11.2, 0.08, 0]} receiveShadow>
        <boxGeometry args={[6.0, 0.16, 520]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>
      <mesh position={[11.2, 0.08, 0]} receiveShadow>
        <boxGeometry args={[6.0, 0.16, 520]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>

      {/* Trotoar Melintang Sepanjang Jalan Persimpangan */}
      {intersections.map((crossZ, idx) => (
        <group key={`sidewalk-cross-${idx}`}>
          <mesh position={[-90, 0.08, crossZ - 9.8]} receiveShadow>
            <boxGeometry args={[150, 0.16, 4.5]} />
            <meshStandardMaterial color="#64748b" roughness={0.92} />
          </mesh>
          <mesh position={[90, 0.08, crossZ - 9.8]} receiveShadow>
            <boxGeometry args={[150, 0.16, 4.5]} />
            <meshStandardMaterial color="#64748b" roughness={0.92} />
          </mesh>
          <mesh position={[-90, 0.08, crossZ + 9.8]} receiveShadow>
            <boxGeometry args={[150, 0.16, 4.5]} />
            <meshStandardMaterial color="#64748b" roughness={0.92} />
          </mesh>
          <mesh position={[90, 0.08, crossZ + 9.8]} receiveShadow>
            <boxGeometry args={[150, 0.16, 4.5]} />
            <meshStandardMaterial color="#64748b" roughness={0.92} />
          </mesh>
        </group>
      ))}

      {/* 5. TIANG LAMPU PENERANGAN JALAN KOTA (City Street Lamps) */}
      {streetLamps.map((lamp, idx) => (
        <group key={`lamp-${idx}`} position={[lamp.x, 0, lamp.z]} rotation={[0, lamp.rotY, 0]}>
          {/* Tiang */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 5.0, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Lengan Atas Melengkung */}
          <mesh position={[0.5, 5.0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Kap Lampu & Bohlam LED */}
          <mesh position={[1.0, 5.4, 0]}>
            <boxGeometry args={[0.45, 0.12, 0.25]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[1.0, 5.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.38, 0.2]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* 6. POHON PENEDUH TROTOAR KOTA (City Street Trees) */}
      {cityTrees.map((tree, idx) => (
        <group key={`city-tree-${idx}`} position={[tree.x, 0.16, tree.z]}>
          {/* Pot Tanaman Trotoar */}
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <cylinderGeometry args={[0.8, 0.9, 0.3, 10]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          {/* Batang Pohon */}
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 2.8, 6]} />
            <meshStandardMaterial color="#3f2e24" roughness={0.9} />
          </mesh>
          {/* Mahkota Daun Bulat Segar */}
          <mesh position={[0, 3.4, 0]} castShadow>
            <sphereGeometry args={[1.5, 7, 6]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.3, 0]} castShadow>
            <sphereGeometry args={[1.1, 7, 6]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 7. GEDUNG-GEDUNG PENCAKAR LANGIT KOTA (Modern Skyscrapers) */}
      {buildings.map((b, idx) => (
        <group key={`building-${idx}`} position={[b.x, 0, b.z]}>
          {/* Bodi Utama Gedung */}
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.65} metalness={0.25} />
          </mesh>

          {/* Jendela / Pola Fasad Kaca Depan */}
          <mesh position={[0, b.h / 2, b.d / 2 + 0.1]}>
            <planeGeometry args={[b.w * 0.88, b.h * 0.85]} />
            <meshStandardMaterial
              color={b.windowColor}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Jendela Sisi Kanan/Kiri */}
          <mesh position={[b.w / 2 + 0.1, b.h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[b.d * 0.88, b.h * 0.85]} />
            <meshStandardMaterial
              color={b.windowColor}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Struktur Atap Gedung (Rooftop Machinery / AC units) */}
          <mesh position={[0, b.h + 1.2, 0]} castShadow>
            <boxGeometry args={[b.w * 0.45, 2.4, b.d * 0.45]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>

          {/* Tiang Antena Pencakar Langit */}
          {b.hasAntenna && (
            <group position={[0, b.h + 2.4, 0]}>
              <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[0.08, 0.25, 9.0, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
              {/* Lampu Peringatan Pesawat Merah di Ujung Antena */}
              <mesh position={[0, 9.1, 0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          )}

          {/* Helipad di Atap */}
          {b.hasHelipad && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, b.h + 0.05, 0]}>
              <circleGeometry args={[b.w * 0.28, 16]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* 8. PAPAN REKLAME & BILLBOARD KOTA (City Billboards) */}
      <group position={[-16, 8, -40]} rotation={[0, Math.PI / 6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[8.0, 4.0, 0.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[7.6, 3.6]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Tiang Penopang Billboard */}
        <mesh position={[0, -5.0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 6.0, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      <group position={[16, 8, 100]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[8.0, 4.0, 0.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[7.6, 3.6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, -5.0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 6.0, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
    </group>
  );
}
