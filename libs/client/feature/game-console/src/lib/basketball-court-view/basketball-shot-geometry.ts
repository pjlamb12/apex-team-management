/**
 * Basketball Court Geometry and Shot Calculation Utilities
 * 
 * Normalized court coordinates:
 * x: 0 (left sideline) to 100 (right sideline)
 * y: 0 (baseline near rim) to 100 (half-court line for half-court view, or opposite baseline for full-court)
 */

export interface ShotGeometryResult {
  shotType: '2PT' | '3PT';
  distanceFeet: number;
  zone: 'paint' | 'mid_range' | 'corner_3_left' | 'corner_3_right' | 'arc_3';
}

export interface RimCoordinates {
  x: number;
  y: number;
}

// Default standard half-court dimensions in feet (High School / Youth standard)
export const COURT_WIDTH_FEET = 50;
export const HALF_COURT_LENGTH_FEET = 47;

// Rim center in normalized percentages (basket is 4ft from baseline + 1.5ft to center of 18" rim = ~5.5ft)
export const HALF_COURT_RIM: RimCoordinates = {
  x: 50,
  y: 12.5, // ~5.8 ft from baseline in 47ft half-court
};

// 3PT arc radius in feet: 19.75 ft for High School / Youth, 22.15 ft for FIBA, 23.75 ft for NBA
export const DEFAULT_THREE_POINT_RADIUS_FEET = 19.75;

// Corner three straight line offset from sideline (in feet)
export const CORNER_THREE_DISTANCE_FEET = 3.0; // 3ft from sideline -> x = (3/50)*100 = 6%, up to 94%

/**
 * Calculates Euclidean distance from rim and detects 2PT vs 3PT based on court geometry.
 */
export function calculateShotType(
  x: number,
  y: number,
  isHalfCourt = true,
  threePointRadiusFeet = DEFAULT_THREE_POINT_RADIUS_FEET
): ShotGeometryResult {
  // Clamp coordinates within 0..100
  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  const rim = isHalfCourt ? HALF_COURT_RIM : { x: 50, y: 7.5 };
  const courtLengthFeet = isHalfCourt ? HALF_COURT_LENGTH_FEET : 94;

  // Convert normalized delta to feet
  const deltaXFeet = ((clampedX - rim.x) / 100) * COURT_WIDTH_FEET;
  const deltaYFeet = ((clampedY - rim.y) / 100) * courtLengthFeet;

  const distanceFeet = Math.round(Math.sqrt(deltaXFeet * deltaXFeet + deltaYFeet * deltaYFeet) * 10) / 10;

  // Corner three detection: straight lines running from baseline up to where the arc intersects
  // In High School court, corner lines are 3ft from sideline (x <= 6% or x >= 94%)
  // up to ~14ft from baseline (y <= 30% in half-court)
  const isLeftCorner = clampedX <= 7.0 && clampedY <= 30;
  const isRightCorner = clampedX >= 93.0 && clampedY <= 30;

  if (isLeftCorner) {
    return {
      shotType: '3PT',
      distanceFeet: Math.max(distanceFeet, 19.5),
      zone: 'corner_3_left',
    };
  }

  if (isRightCorner) {
    return {
      shotType: '3PT',
      distanceFeet: Math.max(distanceFeet, 19.5),
      zone: 'corner_3_right',
    };
  }

  // Arc 3PT detection based on radial distance from rim
  if (distanceFeet >= threePointRadiusFeet) {
    return {
      shotType: '3PT',
      distanceFeet,
      zone: 'arc_3',
    };
  }

  // Inside arc (2PT):
  // Check if inside key / paint (key is 12ft wide = x between 38% and 62%, and length 19ft from baseline = y <= 40%)
  const inPaint = clampedX >= 38 && clampedX <= 62 && clampedY <= 40;

  return {
    shotType: '2PT',
    distanceFeet,
    zone: inPaint ? 'paint' : 'mid_range',
  };
}
