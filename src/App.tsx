import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
        <p className="text-sm font-semibold tracking-wide">Memuat Model Peterbilt 389...</p>
        <p className="text-xs text-slate-400 mt-1">Mengurai hierarki bone Blockbench GLTF</p>
      </div>
    </Html>
  );
}

export default function App() {
  return (
    <TruckProvider>
      <div className="w-full h-screen overflow-hidden relative bg-slate-950">
        {/* 3D WebGL Canvas */}
        <Canvas
          shadows
          camera={{ position: [8, 4.5, 11], fov: 42 }}
          className="w-full h-full"
        >
          <Suspense fallback={<CanvasLoader />}>
            <Environment />
            <Truck />
            <CameraController />
          </Suspense>
        </Canvas>

        {/* Floating Controls & Live Debug Log Console */}
        <Controls />
      </div>
    </TruckProvider>
  );
}

