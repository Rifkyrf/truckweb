import React, { useEffect, useCallback } from 'react';
import {
  Truck as TruckIcon,
  RotateCcw,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Zap,
  FastForward,
  Video,
  Building2,
  Route,
} from 'lucide-react';
import { useTruck } from '../context/TruckContext';

export function Controls() {
  const {
    steering,
    setSteering,
    steerInput,
    setSteerInput,
    speed,
    throttleInput,
    setThrottleInput,
    cruiseSpeed,
    setCruiseSpeed,
    resetPosition,
    autoDrive,
    toggleAutoDrive,
    cameraMode,
    setCameraMode,
    toggleCameraMode,
    mapMode,
    toggleMapMode,
  } = useTruck();

  // Haptic feedback ringan untuk sentuhan di smartphone
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(10);
      } catch {}
    }
  }, []);

  // Keyboard shortcut listener (C: Ganti Kamera, M: Ganti Map/Kota, R: Reset Posisi)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'c') {
        triggerHaptic();
        toggleCameraMode();
      } else if (key === 'm') {
        triggerHaptic();
        toggleMapMode();
      } else if (key === 'r') {
        triggerHaptic();
        resetPosition();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCameraMode, toggleMapMode, resetPosition, triggerHaptic]);

  // Pastikan pointerup global melepaskan tombol gas dan setir agar tidak macet
  useEffect(() => {
    const handleGlobalRelease = () => {
      setThrottleInput(0);
      setSteerInput(0);
    };

    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [setThrottleInput, setSteerInput]);

  const speedKmh = Math.abs(speed * 3.6);
  const isMovingForward = speed > 0.3;
  const isReversing = speed < -0.3;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-4 select-none font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY HUD (FLUID & COMPACT DI SEMUA LAYAR)           */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2 max-w-5xl mx-auto pt-[env(safe-area-inset-top)]">
        {/* BARIS UTAMA: Brand, Speedometer, Transmisi, Quick Action */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand & Model Identity */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 shadow-lg">
            <div className="p-1 sm:p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
              <TruckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                  Peterbilt 389
                </h1>
                <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  3D
                </span>
              </div>
            </div>
          </div>

          {/* Speedometer & Transmisi Gigi */}
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 shadow-lg flex items-center gap-2 sm:gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm sm:text-xl font-black tracking-tight text-white">
                {speedKmh.toFixed(0)}
              </span>
              <span className="text-[9px] sm:text-[11px] text-slate-400 font-semibold">
                km/h
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700/70" />

            {/* Transmisi Gigi: D / N / R */}
            <div className="flex items-center gap-0.5 sm:gap-1 font-mono font-bold text-[10px] sm:text-xs">
              <span
                className={`px-1 py-0.2 rounded ${
                  isMovingForward ? 'bg-emerald-600 text-white font-black' : 'text-slate-500'
                }`}
              >
                D
              </span>
              <span
                className={`px-1 py-0.2 rounded ${
                  !isMovingForward && !isReversing ? 'bg-blue-600 text-white font-black' : 'text-slate-500'
                }`}
              >
                N
              </span>
              <span
                className={`px-1 py-0.2 rounded ${
                  isReversing ? 'bg-rose-600 text-white font-black' : 'text-slate-500'
                }`}
              >
                R
              </span>
            </div>
          </div>

          {/* Quick Actions: Auto-Drive & Reset Posisi */}
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
            {/* Tombol Auto-Drive Simulator */}
            <button
              onClick={() => {
                triggerHaptic();
                toggleAutoDrive();
              }}
              className={`px-2 sm:px-3 py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition active:scale-95 shadow-md ${
                autoDrive
                  ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse ring-2 ring-amber-400/40'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Auto-Drive Simulator"
            >
              <Zap className={`w-3.5 h-3.5 ${autoDrive ? 'fill-current text-slate-950' : 'text-amber-400'}`} />
              <span className="hidden xs:inline">{autoDrive ? 'Auto On' : 'Auto'}</span>
            </button>

            {/* Tombol Reset Posisi (Shortcut: R) */}
            <button
              onClick={() => {
                triggerHaptic();
                resetPosition();
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 text-[10px] sm:text-xs font-medium transition active:scale-95 shadow-md"
              title="Reset Posisi Truk (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* BARIS KEDUA: MODE KAMERA (FOLLOW BELAKANG vs 360°) & MODE PETA (JELAJAH KOTA vs JALAN TOL) */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3">
          {/* 1. Selector Mode Kamera (2 Mode: Follow Belakang & 360 Orbit) */}
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-0.5 sm:p-1 shadow-lg flex items-center gap-0.5 sm:gap-1">
            <span className="text-[9px] text-slate-400 font-semibold px-1.5 hidden md:inline">
              Kamera:
            </span>
            <button
              onClick={() => {
                triggerHaptic();
                setCameraMode('chase');
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition active:scale-95 ${
                cameraMode === 'chase'
                  ? 'bg-blue-600 border border-blue-400/80 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Mode Kamera Follow dari Belakang (Shortcut: C)"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Follow Belakang</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setCameraMode('orbit');
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition active:scale-95 ${
                cameraMode === 'orbit'
                  ? 'bg-amber-500 border border-amber-300 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Mode Kamera Orbit 360° Bebas (Shortcut: C)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>360° Orbit</span>
            </button>
          </div>

          {/* 2. Selector Mode Lingkungan (Jelajah Kota vs Jalan Tol) */}
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-0.5 sm:p-1 shadow-lg flex items-center gap-0.5 sm:gap-1">
            <span className="text-[9px] text-slate-400 font-semibold px-1.5 hidden md:inline">
              Peta:
            </span>
            <button
              onClick={() => {
                triggerHaptic();
                if (mapMode !== 'city') toggleMapMode();
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition active:scale-95 ${
                mapMode === 'city'
                  ? 'bg-emerald-600 border border-emerald-400/80 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Mode Jelajah Kota (Shortcut: M)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Jelajah Kota</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                if (mapMode !== 'highway') toggleMapMode();
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition active:scale-95 ${
                mapMode === 'highway'
                  ? 'bg-emerald-600 border border-emerald-400/80 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Mode Jalan Tol Bebas (Shortcut: M)"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Jalan Tol</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PETUNJUK NAVIGASI DESKTOP / SHORTCUT                                  */}
      {/* ========================================================================= */}
      <div className="w-full flex justify-center pointer-events-none">
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 backdrop-blur-sm border border-slate-800/70 rounded-full px-3.5 py-1 text-[10px] text-slate-300 shadow">
          <span>Kamera:</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[9px] font-bold">C</kbd>
          <span className="text-slate-600">•</span>
          <span>Kota/Tol:</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 font-mono text-[9px] font-bold">M</kbd>
          <span className="text-slate-600">•</span>
          <span>Reset:</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-rose-300 font-mono text-[9px] font-bold">R</kbd>
          <span className="text-slate-600">•</span>
          <span>Kemudi & Gas:</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px]">WASD</kbd>
          <span>/</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px]">Panah</kbd>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ERGONOMIC MOBILE & DESKTOP DRIVING CONSOLE (FLUID & RESPONSIVE)       */}
      {/* ========================================================================= */}
      <div className="w-full max-w-4xl mx-auto flex items-end justify-between gap-2 sm:gap-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        
        {/* ======================================================================= */}
        {/* LEFT THUMB: KEMUDI SETIR (KIRI & KANAN)                                 */}
        {/* ======================================================================= */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-xl flex flex-col gap-1.5 sm:gap-2 flex-1 max-w-[155px] xs:max-w-[175px] sm:max-w-[210px]">
          {/* Label Kemudi & Sudut */}
          <div className="flex items-center justify-between px-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Compass className="w-3 h-3 text-amber-400" />
              <span className="hidden xs:inline">Kemudi</span>
            </span>
            <span
              className={`font-mono text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded ${
                steering < -3
                  ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                  : steering > 3
                  ? 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                  : 'text-slate-400 bg-slate-800/60'
              }`}
            >
              {steering < -3
                ? `${Math.abs(steering).toFixed(0)}° Kiri`
                : steering > 3
                ? `${steering.toFixed(0)}° Kanan`
                : 'Lurus'}
            </span>
          </div>

          {/* Tombol Sentuh Belok Kiri & Kanan (Touch Target Luas & Pas) */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* Belok KIRI */}
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                triggerHaptic();
                setSteerInput(-1);
                setSteering(-28);
              }}
              onPointerUp={(e) => {
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}
                setSteerInput(0);
              }}
              onPointerCancel={() => setSteerInput(0)}
              className={`h-12 xs:h-13 sm:h-15 rounded-xl sm:rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all select-none touch-none active:scale-95 border ${
                steering < -6
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-850 border-slate-700/80 text-white hover:bg-slate-750'
              }`}
              aria-label="Belok Kiri"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider">
                Kiri
              </span>
            </button>

            {/* Belok KANAN */}
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                triggerHaptic();
                setSteerInput(1);
                setSteering(28);
              }}
              onPointerUp={(e) => {
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}
                setSteerInput(0);
              }}
              onPointerCancel={() => setSteerInput(0)}
              className={`h-12 xs:h-13 sm:h-15 rounded-xl sm:rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all select-none touch-none active:scale-95 border ${
                steering > 6
                  ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-850 border-slate-700/80 text-white hover:bg-slate-750'
              }`}
              aria-label="Belok Kanan"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider">
                Kanan
              </span>
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT THUMB: PEDAL GAS (MAJU), REM, & MUNDUR                            */}
        {/* ======================================================================= */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-xl flex flex-col gap-1.5 sm:gap-2 flex-1 max-w-[165px] xs:max-w-[185px] sm:max-w-[220px]">
          
          {/* Tombol GAS UTAMA (Besar & Dominan) */}
          <button
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              triggerHaptic();
              setThrottleInput(1);
              setCruiseSpeed(0);
            }}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
              setThrottleInput(0);
            }}
            onPointerCancel={() => setThrottleInput(0)}
            className={`w-full h-12 xs:h-13 sm:h-15 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all select-none touch-none active:scale-95 border text-xs sm:text-sm uppercase tracking-wide ${
              throttleInput > 0 || (speed > 0.3 && cruiseSpeed === 0)
                ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/40'
                : 'bg-emerald-950/70 border-emerald-700/70 text-emerald-300 hover:bg-emerald-900/70'
            }`}
            aria-label="Gas Maju"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <span>Gas (W)</span>
          </button>

          {/* Baris Kedua: Rem & Gigi Mundur */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* Tombol REM */}
            <button
              onPointerDown={() => {
                triggerHaptic();
                setThrottleInput(0);
                setCruiseSpeed(0);
              }}
              className="h-9 xs:h-10 sm:h-11 rounded-lg sm:rounded-xl font-bold border bg-slate-850 border-slate-700/80 text-amber-300 hover:bg-slate-750 active:bg-amber-500 active:text-slate-950 flex items-center justify-center gap-1 transition-all select-none touch-none active:scale-95 text-[10px] sm:text-xs"
              title="Rem Truk"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Rem</span>
            </button>

            {/* Tombol MUNDUR */}
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                triggerHaptic();
                setThrottleInput(-1);
                setCruiseSpeed(0);
              }}
              onPointerUp={(e) => {
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}
                setThrottleInput(0);
              }}
              onPointerCancel={() => setThrottleInput(0)}
              className={`h-9 xs:h-10 sm:h-11 rounded-lg sm:rounded-xl font-bold border flex items-center justify-center gap-1 transition-all select-none touch-none active:scale-95 text-[10px] sm:text-xs ${
                throttleInput < 0 || speed < -0.3
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/40'
                  : 'bg-slate-850 border-slate-700/80 text-slate-200 hover:bg-slate-750'
              }`}
              aria-label="Mundur"
            >
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Mundur</span>
            </button>
          </div>

          {/* Tombol Cruise Otomatis */}
          <button
            onClick={() => {
              triggerHaptic();
              setCruiseSpeed(cruiseSpeed > 0 ? 0 : 10);
            }}
            className={`w-full py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold border flex items-center justify-center gap-1 transition active:scale-95 ${
              cruiseSpeed > 0
                ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FastForward className="w-3 h-3" />
            <span>{cruiseSpeed > 0 ? 'Cruise On' : 'Cruise (36 km/h)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
