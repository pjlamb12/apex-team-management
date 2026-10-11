import { describe, it, expect } from 'vitest';
import { calculateShotType } from './basketball-shot-geometry';

describe('basketball-shot-geometry', () => {
  it('should detect rim / layups as 2PT in paint', () => {
    const result = calculateShotType(50, 12.5);
    expect(result.shotType).toBe('2PT');
    expect(result.distanceFeet).toBe(0);
    expect(result.zone).toBe('paint');
  });

  it('should detect mid-paint floaters as 2PT in paint', () => {
    const result = calculateShotType(50, 25);
    expect(result.shotType).toBe('2PT');
    expect(result.distanceFeet).toBeGreaterThan(0);
    expect(result.distanceFeet).toBeLessThan(12);
    expect(result.zone).toBe('paint');
  });

  it('should detect free throw line as 2PT in paint', () => {
    const result = calculateShotType(50, 40);
    expect(result.shotType).toBe('2PT');
    expect(result.distanceFeet).toBeGreaterThan(12);
    expect(result.distanceFeet).toBeLessThan(15);
    expect(result.zone).toBe('paint');
  });

  it('should detect mid-range elbow shots outside paint as 2PT mid_range', () => {
    // Elbow is at x = 32% (left) and y = 40%
    const result = calculateShotType(30, 40);
    expect(result.shotType).toBe('2PT');
    expect(result.zone).toBe('mid_range');
    expect(result.distanceFeet).toBeLessThan(19.75);
  });

  it('should detect top of the key 3-pointer as 3PT arc_3', () => {
    // Top of key is around y = 60%, x = 50%
    // distance = (60 - 12.5) * 0.47 = 47.5 * 0.47 = 22.3 ft > 19.75 ft
    const result = calculateShotType(50, 60);
    expect(result.shotType).toBe('3PT');
    expect(result.zone).toBe('arc_3');
    expect(result.distanceFeet).toBeGreaterThan(19.75);
  });

  it('should detect deep 3-pointer as 3PT arc_3', () => {
    const result = calculateShotType(50, 75);
    expect(result.shotType).toBe('3PT');
    expect(result.zone).toBe('arc_3');
    expect(result.distanceFeet).toBeGreaterThan(25);
  });

  it('should detect left corner 3 as 3PT corner_3_left', () => {
    // Left sideline: x = 5%, y = 15%
    const result = calculateShotType(5, 15);
    expect(result.shotType).toBe('3PT');
    expect(result.zone).toBe('corner_3_left');
  });

  it('should detect right corner 3 as 3PT corner_3_right', () => {
    // Right sideline: x = 95%, y = 15%
    const result = calculateShotType(95, 15);
    expect(result.shotType).toBe('3PT');
    expect(result.zone).toBe('corner_3_right');
  });

  it('should clamp out-of-bounds coordinates cleanly', () => {
    const leftOob = calculateShotType(-10, 50);
    expect(leftOob).toBeDefined();
    expect(leftOob.shotType).toBe('3PT');

    const topOob = calculateShotType(50, 110);
    expect(topOob).toBeDefined();
    expect(topOob.shotType).toBe('3PT');
  });
});
