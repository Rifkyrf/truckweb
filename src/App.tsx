import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Truck } from './components/Truck';
import { Environment } from './components/Environment';
import { CameraController } from './components/CameraController';
import { Controls } from './components/Controls';
import { TruckProvider } from './context/TruckContext';
import { Loader2 } from 'lucide-react';

function CanvasLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl text-white">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide">Memuat Truk Peterbilt 389...</p>
        <p className="text-xs text-slate-400 mt-1">Menyiapkan simulator jalan tak hingga...</p>
      </div>
    </Html>
  );
}

export default function App() {
  return (
    <TruckProvider>
      <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950">
        {/* 3D WebGL Canvas dengan Optimasi Tinggi untuk Mobile & Desktop */}
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }}
          dpr={[1, 1.5]}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            stencil: false,
            depth: true,
          }}
          camera={{ position: [7.5, 4.2, 10.5], fov: 42, near: 0.5, far: 380 }}
          className="w-full h-full"
        >
          <Suspense fallback={<CanvasLoader />}>
            <Environment />
            <Truck />
            <CameraController />
          </Suspense>
        </Canvas>

        {/* Clean Responsive Driving Controls */}
        <Controls />
      </div>
    </TruckProvider>
  );
}
