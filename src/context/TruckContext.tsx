import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface LogMessage {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'action';
  text: string;
}

export interface BoneStatus {
  name: string;
  found: boolean;
  nodeIndex?: number;
  childrenCount?: number;
  type?: string;
}

interface TruckContextType {
  // State kemudi dan gerak
  steering: number;          // -30 (Kiri) s/d +30 (Kanan) derajat
  setSteering: (v: number | ((prev: number) => number)) => void;
  steerInput: number;        // -1 (Kiri), 0 (Lurus), 1 (Kanan)
  setSteerInput: (v: number) => void;
  speed: number;             // unit/s (kecepatan aktual)
  setSpeed: (v: number | ((prev: number) => number)) => void;
  throttleInput: number;     // -1 (Mundur), 0 (Idle/Rem), 1 (Maju/Gas)
  setThrottleInput: (v: number) => void;
  distance: number;          // total jarak bergerak
  setDistance: (v: number | ((prev: number) => number)) => void;
  isReversing: boolean;
  setIsReversing: (v: boolean) => void;
  isDriving: boolean;
  setIsDriving: (v: boolean) => void;
  cruiseSpeed: number;       // Kecepatan cruise konstan
  setCruiseSpeed: (v: number) => void;

  // Koordinat Posisi Truk di Dunia 3D
  truckPosition: [number, number, number];
  setTruckPosition: (v: [number, number, number]) => void;
  truckHeading: number;      // rotasi yaw truk (radian)
  setTruckHeading: (v: number) => void;
  resetPosition: () => void;

  // State pintu
  door1Open: boolean;
  door2Open: boolean;
  door1Progress: number;     // 0 (tutup) s/d 1 (terbuka penuh -45 deg)
  door2Progress: number;     // 0 (tutup) s/d 1 (terbuka penuh +45 deg)
  toggleDoor1: () => void;
  toggleDoor2: () => void;
  setBothDoors: (open: boolean) => void;

  // Aksesori & Simulator
  wiperActive: boolean;
  toggleWiper: () => void;
  autoDrive: boolean;
  toggleAutoDrive: () => void;
  cameraPreset: 'orbit' | 'side' | 'front' | 'cockpit';
  setCameraPreset: (v: 'orbit' | 'side' | 'front' | 'cockpit') => void;

  // Debug & Log
  logs: LogMessage[];
  addLog: (text: string, type?: LogMessage['type']) => void;
  clearLogs: () => void;
  boneStatuses: Record<string, BoneStatus>;
  registerBones: (statuses: Record<string, BoneStatus>) => void;
}

const TruckContext = createContext<TruckContextType | null>(null);

export function TruckProvider({ children }: { children: React.ReactNode }) {
  const [steering, setSteering] = useState(0);
  const [steerInput, setSteerInput] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [throttleInput, setThrottleInput] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isReversing, setIsReversing] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [cruiseSpeed, setCruiseSpeed] = useState(0);

  const [truckPosition, setTruckPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [truckHeading, setTruckHeading] = useState(0);

  const [door1Open, setDoor1Open] = useState(false);
  const [door2Open, setDoor2Open] = useState(false);
  const [door1Progress, setDoor1Progress] = useState(0);
  const [door2Progress, setDoor2Progress] = useState(0);

  const [wiperActive, setWiperActive] = useState(false);
  const [autoDrive, setAutoDrive] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'side' | 'front' | 'cockpit'>('orbit');

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [boneStatuses, setBoneStatuses] = useState<Record<string, BoneStatus>>({});

  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const newLog: LogMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time,
      type,
      text,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Simpan 50 log terakhir
    console.log(`[TRUCK_DEBUG ${time}][${type.toUpperCase()}] ${text}`);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetPosition = useCallback(() => {
    setTruckPosition([0, 0, 0]);
    setTruckHeading(0);
    setSpeed(0);
    setThrottleInput(0);
    setCruiseSpeed(0);
    setSteering(0);
    setSteerInput(0);
    addLog('Posisi Truk di-reset kembali ke titik awal (0, 0, 0)', 'action');
  }, [addLog]);

  const registerBones = useCallback((statuses: Record<string, BoneStatus>) => {
    setBoneStatuses(statuses);
    const foundCount = Object.values(statuses).filter((b) => b.found).length;
    const totalCount = Object.keys(statuses).length;
    addLog(`Deteksi Bone Model: ${foundCount}/${totalCount} teridentifikasi dengan tepat.`, foundCount > 0 ? 'success' : 'warn');
  }, [addLog]);

  const toggleDoor1 = useCallback(() => {
    setDoor1Open((prev) => {
      const next = !prev;
      addLog(`Pintu 1 (Kanan) ${next ? 'Membuka (-45°)' : 'Menutup (0°)'}`, 'action');
      return next;
    });
  }, [addLog]);

  const toggleDoor2 = useCallback(() => {
    setDoor2Open((prev) => {
      const next = !prev;
      addLog(`Pintu 2 (Kiri) ${next ? 'Membuka (+45°)' : 'Menutup (0°)'}`, 'action');
      return next;
    });
  }, [addLog]);

  const setBothDoors = useCallback((open: boolean) => {
    setDoor1Open(open);
    setDoor2Open(open);
    addLog(`Kedua Pintu ${open ? 'Dibuka Penuh' : 'Ditutup Rapat'}`, 'action');
  }, [addLog]);

  const toggleWiper = useCallback(() => {
    setWiperActive((prev) => {
      const next = !prev;
      addLog(`Wiper Kaca Depan: ${next ? 'AKTIF (Berayun)' : 'NON-AKTIF'}`, 'action');
      return next;
    });
  }, [addLog]);

  const toggleAutoDrive = useCallback(() => {
    setAutoDrive((prev) => {
      const next = !prev;
      addLog(`Auto-Drive Simulator: ${next ? 'DIMULAI (Otomatis jalan & belok)' : 'DIHENTIKAN'}`, 'action');
      return next;
    });
  }, [addLog]);

  // Animasi halus untuk door1Progress dan door2Progress
  const door1Target = door1Open ? 1 : 0;
  const door2Target = door2Open ? 1 : 0;

  useEffect(() => {
    let animId: number;
    const updateDoors = () => {
      setDoor1Progress((cur) => {
        const diff = door1Target - cur;
        if (Math.abs(diff) < 0.01) return door1Target;
        return cur + diff * 0.12;
      });
      setDoor2Progress((cur) => {
        const diff = door2Target - cur;
        if (Math.abs(diff) < 0.01) return door2Target;
        return cur + diff * 0.12;
      });
      animId = requestAnimationFrame(updateDoors);
    };
    animId = requestAnimationFrame(updateDoors);
    return () => cancelAnimationFrame(animId);
  }, [door1Target, door2Target]);

  // Log inisialisasi awal
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      addLog('Sistem Simulator Truk 3D Peterbilt 389 diinisialisasi.', 'info');
      addLog('Menghubungkan query animasi Blockbench Minecraft & Three.js...', 'info');
    }
  }, [addLog]);

  return (
    <TruckContext.Provider
      value={{
        steering,
        setSteering,
        steerInput,
        setSteerInput,
        speed,
        setSpeed,
        throttleInput,
        setThrottleInput,
        distance,
        setDistance,
        isReversing,
        setIsReversing,
        isDriving,
        setIsDriving,
        cruiseSpeed,
        setCruiseSpeed,
        truckPosition,
        setTruckPosition,
        truckHeading,
        setTruckHeading,
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
        addLog,
        clearLogs,
        boneStatuses,
        registerBones,
      }}
    >
      {children}
    </TruckContext.Provider>
  );
}

export function useTruck() {
  const context = useContext(TruckContext);
  if (!context) {
    throw new Error('useTruck must be used within a TruckProvider');
  }
  return context;
}
