import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Sliders,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Truck as TruckIcon,
  Compass,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Wind,
  Layers,
  ChevronDown,
  ChevronUp,
  Gauge,
  Camera,
  FastForward,
  MapPin,
} from 'lucide-react';
import { useTruck } from '../context/TruckContext';

export function Controls() {
  const {
    steering,
    setSteering,
    setSteerInput,
    speed,
    throttleInput,
    setThrottleInput,
    distance,
    cruiseSpeed,
    setCruiseSpeed,
    truckPosition,
    resetPosition,
    door1Open,
    door2Open,
    door1Progress,
    door2Progress,
    toggleDoor1,
    toggleDoor2,
    setBothDoors,
    wiperActive,
    toggleWiper,
    autoDrive,
    toggleAutoDrive,
    cameraPreset,
    setCameraPreset,
    logs,
    clearLogs,
    addLog,
    boneStatuses,
  } = useTruck();

  const [showLogPanel, setShowLogPanel] = useState(true);
  const [showBoneDetails, setShowBoneDetails] = useState(false);

  const bonesList = Object.values(boneStatuses);
  const foundBonesCount = bonesList.filter((b) => b.found).length;

  // Global pointerup listener untuk memastikan tombol Gas & Setir tidak macet
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setThrottleInput(0);
      setSteerInput(0);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [setThrottleInput, setSteerInput]);

  const speedKmh = Math.abs(speed * 3.6);
  const isMoving = Math.abs(speed) > 0.1;
  const isReverse = speed < -0.1;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none font-sans">
      {/* 1. TOP HEADER & CAMERA PRESETS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full">
        {/* Brand & Model Info */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <TruckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                Peterbilt 389
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                Sistem Normal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Simulator Jalan Raya 3D & Rig Blockbench</p>
          </div>
        </div>

        {/* Camera Presets Selector */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1 shadow-lg flex items-center gap-1 text-xs">
          <span className="text-slate-400 px-2 flex items-center gap-1 font-medium hidden md:flex">
            <Camera className="w-3.5 h-3.5 text-blue-400" /> Kamera:
          </span>
          <button
            onClick={() => setCameraPreset('orbit')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              cameraPreset === 'orbit'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Orbit 360°
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              cameraPreset === 'side'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Chase (Belakang)
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              cameraPreset === 'front'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Depan
          </button>
          <button
            onClick={() => setCameraPreset('cockpit')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              cameraPreset === 'cockpit'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Kabin Sopir
          </button>
        </div>

        {/* Tombol Tindakan & Debug */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Tombol Reset Posisi */}
          <button
            onClick={resetPosition}
            className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-xs px-2.5 py-2 rounded-xl shadow flex items-center gap-1.5 text-slate-200 transition"
            title="Kembalikan truk ke titik awal jalan raya"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset Posisi</span>
          </button>

          {/* Bone Inspector Badge */}
          <button
            onClick={() => setShowBoneDetails(!showBoneDetails)}
            className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-slate-500 text-xs px-2.5 py-2 rounded-xl shadow flex items-center gap-1.5 text-slate-200 transition"
            title="Klik untuk rincian deteksi Bone Model Blockbench"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{foundBonesCount}/{bonesList.length || 13} Bone</span>
            {showBoneDetails ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>

          {/* Auto Drive Demo Button */}
          <button
            onClick={toggleAutoDrive}
            className={`text-xs px-3 py-2 rounded-xl font-medium shadow flex items-center gap-1.5 transition ${
              autoDrive
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                : 'bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white hover:bg-slate-800'
            }`}
          >
            {autoDrive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Auto-Demo {autoDrive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Log Button */}
          <button
            onClick={() => setShowLogPanel(!showLogPanel)}
            className={`text-xs px-2.5 py-2 rounded-xl font-medium shadow flex items-center gap-1 transition ${
              showLogPanel
                ? 'bg-blue-600/90 text-white'
                : 'bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Log</span>
          </button>
        </div>
      </div>

      {/* 2. MODAL DAFTAR BONE MASTER MODEL */}
      {showBoneDetails && (
        <div className="pointer-events-auto mt-2 max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl text-xs text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              Bone Model Peterbilt 389 GLTF:
            </span>
            <button onClick={() => setShowBoneDetails(false)} className="text-slate-400 hover:text-white px-1">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {bonesList.map((bone) => (
              <div
                key={bone.name}
                className={`p-1.5 rounded border flex items-center justify-between ${
                  bone.found
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : 'bg-red-950/40 border-red-900/60 text-red-300'
                }`}
              >
                <span className="font-mono font-bold">{bone.name}</span>
                <span className="text-[10px] text-emerald-400">
                  {bone.found ? `OK (${bone.childrenCount} mesh)` : 'Hilang'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CENTER / FLOATING LIVE DEBUG LOG PANEL */}
      {showLogPanel && (
        <div className="pointer-events-auto my-auto self-end max-w-sm sm:max-w-md w-full bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[32vh]">
          <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Live Debug & Telemetry Log
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearLogs}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setShowLogPanel(false)}
                className="text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Telemetry Bar Ringkas */}
          <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-900/50 border-b border-slate-800/80 text-center text-[10px]">
            <div className="bg-slate-800/60 p-1 rounded">
              <span className="text-slate-400 block">Kemudi</span>
              <span className={`font-mono font-bold ${steering < -2 ? 'text-cyan-400' : steering > 2 ? 'text-amber-400' : 'text-slate-300'}`}>
                {steering < -2 ? `${Math.abs(steering).toFixed(0)}° KIRI` : steering > 2 ? `${steering.toFixed(0)}° KANAN` : '0° LURUS'}
              </span>
            </div>
            <div className="bg-slate-800/60 p-1 rounded">
              <span className="text-slate-400 block">Kecepatan</span>
              <span className="font-mono font-bold text-emerald-400">{speedKmh.toFixed(1)} km/h</span>
            </div>
            <div className="bg-slate-800/60 p-1 rounded">
              <span className="text-slate-400 block">Posisi (Z)</span>
              <span className="font-mono font-bold text-blue-400">{truckPosition[2].toFixed(1)}m</span>
            </div>
            <div className="bg-slate-800/60 p-1 rounded">
              <span className="text-slate-400 block">Pintu</span>
              <span className="font-mono font-bold text-purple-400">
                {door1Open || door2Open ? 'TERBUKA' : 'RAPAT'}
              </span>
            </div>
          </div>

          {/* Log Message Items */}
          <div className="p-2 overflow-y-auto space-y-1 flex-1 font-mono text-[11px] leading-tight">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic p-2 text-center">Belum ada log...</p>
            ) : (
              logs.map((item) => {
                let badgeClass = 'text-blue-400 bg-blue-950/60 border-blue-800/50';
                if (item.type === 'success') badgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';
                if (item.type === 'action') badgeClass = 'text-amber-300 bg-amber-950/60 border-amber-800/50';
                if (item.type === 'warn') badgeClass = 'text-red-400 bg-red-950/60 border-red-800/50';

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-1.5 p-1 rounded bg-slate-900/60 border border-slate-800/50"
                  >
                    <span className="text-[10px] text-slate-500 shrink-0">{item.time}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded border uppercase font-bold shrink-0 ${badgeClass}`}>
                      {item.type}
                    </span>
                    <span className="text-slate-300 break-words flex-1">{item.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. BOTTOM INTERACTIVE CONTROLS CONSOLE */}
      <div className="pointer-events-auto w-full max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center">
          
          {/* KOLOM 1: KEMUDI & SETIR (ARAH KIRI & KANAN SUDAH BENAR) */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Kemudi Setir
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                steering < -2 ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                steering > 2 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-slate-800 text-slate-300'
              }`}>
                {steering < -2 ? `KIRI ${Math.abs(steering).toFixed(0)}°` :
                 steering > 2 ? `KANAN ${steering.toFixed(0)}°` :
                 '0° LURUS'}
              </span>
            </div>

            {/* Tombol Setir Cepat & Tahan */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                onPointerDown={() => {
                  setSteerInput(-1);
                  setSteering(-28);
                  addLog('Kemudi diputar ke KIRI (-28°)', 'action');
                }}
                onPointerUp={() => setSteerInput(0)}
                className={`py-2 px-1 text-xs rounded-lg font-semibold border flex items-center justify-center gap-1 transition ${
                  steering < -8
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
                title="Tahan untuk belok KIRI (A / ←)"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kiri (A)
              </button>

              <button
                onClick={() => {
                  setSteerInput(0);
                  setSteering(0);
                  addLog('Setir diluruskan kembali (0°)', 'action');
                }}
                className={`py-2 px-1 text-xs rounded-lg font-medium border flex items-center justify-center gap-1 transition ${
                  Math.abs(steering) <= 2
                    ? 'bg-blue-600 border-blue-500 text-white font-bold'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Lurus
              </button>

              <button
                onPointerDown={() => {
                  setSteerInput(1);
                  setSteering(28);
                  addLog('Kemudi diputar ke KANAN (+28°)', 'action');
                }}
                onPointerUp={() => setSteerInput(0)}
                className={`py-2 px-1 text-xs rounded-lg font-semibold border flex items-center justify-center gap-1 transition ${
                  steering > 8
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
                title="Tahan untuk belok KANAN (D / →)"
              >
                Kanan (D) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slider Presisi */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Kiri</span>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={steering}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSteering(val);
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span>Kanan</span>
            </div>
          </div>

          {/* KOLOM 2: AKSELERASI MAJU & GERAK RODA (SUPER RESPONSIF) */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                Akselerasi & Kecepatan
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  speed > 0.1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  speed < -0.1 ? 'bg-red-950 text-red-400 border border-red-800' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {speed > 0.1 ? `${speedKmh.toFixed(0)} km/h MAJU` :
                   speed < -0.1 ? `${speedKmh.toFixed(0)} km/h MUNDUR` :
                   'DIAM'}
                </span>
              </div>
            </div>

            {/* Tombol Pedal Gas, Rem, Mundur */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                onPointerDown={() => {
                  setThrottleInput(1);
                  setCruiseSpeed(0);
                  addLog('Gas Ditekan: Truk berakselerasi MAJU!', 'action');
                }}
                onPointerUp={() => setThrottleInput(0)}
                className={`py-2 px-1 text-xs rounded-lg font-bold border flex items-center justify-center gap-1 transition select-none ${
                  throttleInput > 0 || speed > 0.5
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 active:bg-emerald-600'
                }`}
                title="Tahan untuk gas maju (W / ↑)"
              >
                <ArrowUp className="w-4 h-4" /> MAJU (W)
              </button>

              <button
                onClick={() => {
                  setThrottleInput(0);
                  setCruiseSpeed(0);
                  addLog('Rem Ditekan: Truk Berhenti Rapat', 'action');
                }}
                className="py-2 px-1 text-xs rounded-lg font-semibold border bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 active:bg-amber-600 active:text-slate-950 flex items-center justify-center gap-1 transition"
                title="Pengereman Cepat (Spasi)"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> REM
              </button>

              <button
                onPointerDown={() => {
                  setThrottleInput(-1);
                  setCruiseSpeed(0);
                  addLog('Gigi Mundur Ditekan: Truk MUNDUR', 'action');
                }}
                onPointerUp={() => setThrottleInput(0)}
                className={`py-2 px-1 text-xs rounded-lg font-bold border flex items-center justify-center gap-1 transition select-none ${
                  throttleInput < 0 || speed < -0.5
                    ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 active:bg-red-600'
                }`}
                title="Tahan untuk mundur (S / ↓)"
              >
                <ArrowDown className="w-4 h-4" /> MUNDUR
              </button>
            </div>

            {/* Mode Cruise Control (Maju Tanpa Tahan Tombol) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const nextSpeed = cruiseSpeed === 0 ? 10 : 0;
                  setCruiseSpeed(nextSpeed);
                  addLog(`Cruise Otomatis: ${nextSpeed > 0 ? 'AKTIF (36 km/h)' : 'NON-AKTIF'}`, 'action');
                }}
                className={`flex-1 py-1 px-2 text-[11px] rounded-lg font-medium border flex items-center justify-center gap-1 transition ${
                  cruiseSpeed > 0
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <FastForward className="w-3 h-3" />
                {cruiseSpeed > 0 ? 'Cruise Aktif (36 km/h)' : 'Gas Otomatis / Cruise'}
              </button>

              <button
                onClick={resetPosition}
                className="py-1 px-2 text-[11px] rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
                title="Reset Posisi ke Awal"
              >
                <MapPin className="w-3 h-3 text-amber-400" /> Reset
              </button>
            </div>
          </div>

          {/* KOLOM 3: PINTU PETERBILT & AKSESORI */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Pintu & Wiper
              </span>
              <button
                onClick={toggleWiper}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                  wiperActive
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Wind className="w-3 h-3" /> Wiper {wiperActive ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button
                onClick={toggleDoor1}
                className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition ${
                  door1Open
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Pintu Kanan: {door1Open ? 'Buka (-45°)' : 'Tutup (0°)'}
              </button>

              <button
                onClick={toggleDoor2}
                className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition ${
                  door2Open
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Pintu Kiri: {door2Open ? 'Buka (+45°)' : 'Tutup (0°)'}
              </button>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setBothDoors(true)}
                className="flex-1 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Buka Semua
              </button>
              <button
                onClick={() => setBothDoors(false)}
                className="flex-1 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Tutup Semua
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
