import * as THREE from 'three';

const LAT = THREE.MathUtils.degToRad(59.94); // Oslo
const LON = 10.75;

/**
 * Direction towards the sun (three.js world: x east, y up, z south) for a local clock time in Oslo.
 * Simple solar-position approximation; good to a degree or two, which is plenty for lighting.
 */
export function sunDirection(hour: number, date = new Date()): { dir: THREE.Vector3; altitude: number } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const decl = THREE.MathUtils.degToRad(23.44 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365));
  const month = date.getMonth();
  const utcOffset = month >= 3 && month <= 9 ? 2 : 1; // CEST roughly April–October
  const solarTime = hour - utcOffset + LON / 15;
  const H = THREE.MathUtils.degToRad(15 * (solarTime - 12));

  const altitude = Math.asin(Math.sin(LAT) * Math.sin(decl) + Math.cos(LAT) * Math.cos(decl) * Math.cos(H));
  const azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(decl) * Math.cos(LAT)) + Math.PI;
  const east = Math.sin(azimuth) * Math.cos(altitude);
  const north = Math.cos(azimuth) * Math.cos(altitude);
  return { dir: new THREE.Vector3(east, Math.sin(altitude), -north).normalize(), altitude };
}
