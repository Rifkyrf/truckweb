import React from 'react';
import { useTruck } from '../context/TruckContext';
import { CityEnvironment } from './CityEnvironment';
import { HighwayEnvironment } from './HighwayEnvironment';

/**
 * ENVIRONMENT SWITCHER:
 * Mengalihkan lingkungan 3D secara dinamis:
 * - 'city' -> Mode Jelajah Kota (City Exploration: persimpangan, gedung bertingkat, lampu jalan, trotoar)
 * - 'highway' -> Mode Jalan Tol Bebas (Infinite Highway)
 */
export function Environment() {
  const { mapMode } = useTruck();

  return mapMode === 'city' ? <CityEnvironment /> : <HighwayEnvironment />;
}
