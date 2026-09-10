import React, { useEffect } from 'react';
import {
  RotateCcw,
  Truck as TruckIcon,
  Play,
  Square,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  FastForward,
  Eye,
  Compass,
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
    cruiseSpeed,
    setCruiseSpeed,
    resetPosition,
    autoDrive,
    toggleAutoDrive,
  } = useTruck();

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
  const isMovingForward = speed > 0.2;
  const isReversing = speed < -0.2;

  // Haptic feedback ringan untuk perangkat mobile layar sentuh
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(10);
      } catch {
        // Abaikan jika browser membatasi haptic
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY HUD (CLEAN & MINIMALIST)                       */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center justify-between gap-2 max-w-6xl mx-auto">
        {/* Brand & Model Identity */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3 sm:px-4 py-2 shadow-xl">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Peterbilt 389
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold uppercase">
                3D Rig
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              Simulator Kendali
            </p>
          </div>
        </div>

        {/* Speedometer & Gear Indicator */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3.5 sm:px-5 py-2 shadow-xl flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-mono text-base sm:text-2xl font-black tracking-tight text-white">
                {speedKmh.toFixed(0)}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
                km/h
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700/70" />

          {/* Transmisi Gigi */}
          <div className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm">
            <span
              className={`px-1.5 py-0.5 rounded ${
                isMovingForward
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                  : 'text-slate-500'
              }`}
            >
              D
            </span>
            <span
              className={`px-1.5 py-0.5 rounded ${
                !isMovingForward && !isReversing
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-500'
              }`}
            >
              N
            </span>
            <span
              className={`px-1.5 py-0.5 rounded ${
                isReversing
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                  : 'text-slate-500'
              }`}
            >
              R
            </span>
          </div>
        </div>

        {/* Action Buttons: Auto-Drive & Reset */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Auto Drive Demo Button */}
          <button
            onClick={() => {
              triggerHaptic();
              toggleAutoDrive();
            }}
            className={`text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-semibold shadow-lg flex items-center gap-1.5 transition active:scale-95 ${
              autoDrive
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold ring-2 ring-amber-400/40'
                : 'bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:bg-slate-800'
            }`}
            title="Nyalakan atau matikan simulasi jalan otomatis"
          >
            {autoDrive ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span className="hidden sm:inline">
              {autoDrive ? 'Auto Aktif' : 'Auto-Drive'}
            </span>
          </button>

          {/* Reset Posisi */}
          <button
            onClick={() => {
              triggerHaptic();
              resetPosition();
            }}
            className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 text-slate-200 transition active:scale-95"
            title="Reset posisi truk ke titik awal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HINT KAMERA ORBIT 360 (TENGAH ATAS)                                   */}
      {/* ========================================================================= */}
      <div className="w-full flex justify-center pointer-events-none mt-1">
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-full px-3 py-1 text-[11px] text-slate-400 flex items-center gap-1.5 shadow">
          <Eye className="w-3 h-3 text-blue-400 shrink-0" />
          <span className="hidden xs:inline">Kamera Orbit 360°:</span>
          <span>Geser layar untuk memutar • Cubit/Scroll untuk Zoom</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ERGONOMIC MOBILE & DESKTOP DRIVING CONSOLE (BOTTOM)                   */}
      {/* ========================================================================= */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2.5">
        
        {/* Driving Pads: Left Thumb (Steering) & Right Thumb (Throttle / Brakes) */}
        <div className="flex items-end justify-between gap-3 w-full">
          
          {/* =================================================================== */}
          {/* LEFT THUMB: KEMUDI SETIR (KIRI & KANAN)                             */}
          {/* =================================================================== */}
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-3xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 w-44 sm:w-56">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Kemudi
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  steering < -3
                    ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                    : steering > 3
                    ? 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
                    : 'text-slate-400 bg-slate-800/60'
                }`}
              >
                {steering < -3
                  ? `${Math.abs(steering).toFixed(0)}° KIRI`
                  : steering > 3
                  ? `${steering.toFixed(0)}° KANAN`
                  : '0° LURUS'}
              </span>
            </div>

            {/* Tombol Sentuh Belok Kiri & Kanan (Touch Target Besar & Nyaman) */}
            <div className="grid grid-cols-2 gap-2">
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
                className={`h-14 sm:h-16 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all select-none touch-none active:scale-95 border ${
                  steering < -6
                    ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-750'
                }`}
                aria-label="Belok Kiri"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider">
                  Kiri (A)
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
                className={`h-14 sm:h-16 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all select-none touch-none active:scale-95 border ${
                  steering > 6
                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-750'
                }`}
                aria-label="Belok Kanan"
              >
                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider">
                  Kanan (D)
                </span>
              </button>
            </div>

            {/* Slider Kemudi Presisi Halus */}
            <div className="flex items-center gap-1.5 px-1 pt-0.5">
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
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                title="Slider Kemudi"
              />
            </div>
          </div>

          {/* =================================================================== */}
          {/* CENTER: DESKTOP KEYBOARD HINT (TERSEMBUNYI DI HP KECIL)            */}
          {/* =================================================================== */}
          <div className="hidden lg:flex flex-col items-center justify-center pb-2 text-[11px] text-slate-400 pointer-events-none">
            <div className="flex items-center gap-1 mb-1">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs shadow">W</kbd>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs shadow">A</kbd>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs shadow">S</kbd>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs shadow">D</kbd>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-300">Panah Keyboard</span>
            </div>
            <p className="text-[10px] text-slate-500">Spasi untuk pengereman darurat</p>
          </div>

          {/* =================================================================== */}
          {/* RIGHT THUMB: PEDAL GAS (MAJU), REM, & MUNDUR                        */}
          {/* =================================================================== */}
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-3xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 w-52 sm:w-64">
            
            {/* Tombol GAS / MAJU UTAMA (Besar & Dominan untuk Ibu Jari Kanan) */}
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
              className={`w-full h-14 sm:h-16 rounded-2xl font-black flex items-center justify-center gap-2 transition-all select-none touch-none active:scale-95 border text-xs sm:text-sm uppercase tracking-wide ${
                throttleInput > 0 || (speed > 0.3 && cruiseSpeed === 0)
                  ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-xl shadow-emerald-500/40 ring-2 ring-emerald-400/40'
                  : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
              }`}
              aria-label="Gas Maju"
            >
              <ArrowUp className="w-6 h-6 stroke-[3]" />
              <span>Gas Maju (W)</span>
            </button>

            {/* Baris Kedua: Rem & Gigi Mundur */}
            <div className="grid grid-cols-2 gap-2">
              {/* Tombol REM */}
              <button
                onPointerDown={() => {
                  triggerHaptic();
                  setThrottleInput(0);
                  setCruiseSpeed(0);
                }}
                className="h-11 sm:h-12 rounded-xl font-bold border bg-slate-800/90 border-slate-700/80 text-amber-300 hover:bg-slate-750 active:bg-amber-600 active:text-slate-950 flex items-center justify-center gap-1.5 transition-all select-none touch-none active:scale-95 text-[11px] sm:text-xs"
                title="Rem Truk"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>REM</span>
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
                className={`h-11 sm:h-12 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all select-none touch-none active:scale-95 text-[11px] sm:text-xs ${
                  throttleInput < 0 || speed < -0.3
                    ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/40'
                    : 'bg-slate-800/90 border-slate-700/80 text-slate-200 hover:bg-slate-750'
                }`}
                aria-label="Mundur"
              >
                <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                <span>Mundur (S)</span>
              </button>
            </div>

            {/* Tombol Cruise Otomatis (Sangat Berguna di Mobile agar Jempol tidak pegal) */}
            <button
              onClick={() => {
                triggerHaptic();
                setCruiseSpeed(cruiseSpeed > 0 ? 0 : 10);
              }}
              className={`w-full py-1.5 px-2 rounded-xl text-[10px] sm:text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                cruiseSpeed > 0
                  ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <FastForward className="w-3 h-3" />
              <span>{cruiseSpeed > 0 ? 'Cruise Aktif (36 km/h)' : 'Gas Otomatis / Cruise'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
