import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export interface TruckPhysics {
  position: THREE.Vector3;
  heading: number;
  speed: number;
  steering: number;
  resetId: number; // incremental counter for reset detection
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

  // Koordinat Posisi Truk di Dunia 3D (React State untuk UI)
  truckPosition: [number, number, number];
  setTruckPosition: (v: [number, number, number]) => void;
  truckHeading: number;      // rotasi yaw truk (radian)
  setTruckHeading: (v: number) => void;
  resetPosition: () => void;

  // 60/120 FPS High-Performance Mutable Ref untuk Camera & Environment (No React re-render stutter)
  truckPhysicsRef: React.MutableRefObject<TruckPhysics>;

  // Simulator Mode
  autoDrive: boolean;
  toggleAutoDrive: () => void;
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
  const [autoDrive, setAutoDrive] = useState(false);

  // Mutable ref shared across useFrame loops
  const truckPhysicsRef = useRef<TruckPhysics>({
    position: new THREE.Vector3(0, 0, 0),
    heading: 0,
    speed: 0,
    steering: 0,
    resetId: 0,
  });

  const resetPosition = useCallback(() => {
    truckPhysicsRef.current.position.set(0, 0, 0);
    truckPhysicsRef.current.heading = 0;
    truckPhysicsRef.current.speed = 0;
    truckPhysicsRef.current.steering = 0;
    truckPhysicsRef.current.resetId += 1;

    setTruckPosition([0, 0, 0]);
    setTruckHeading(0);
    setSpeed(0);
    setThrottleInput(0);
    setCruiseSpeed(0);
    setSteering(0);
    setSteerInput(0);
    setAutoDrive(false);
  }, []);

  const toggleAutoDrive = useCallback(() => {
    setAutoDrive((prev) => !prev);
  }, []);

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
        truckPhysicsRef,
        autoDrive,
        toggleAutoDrive,
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
