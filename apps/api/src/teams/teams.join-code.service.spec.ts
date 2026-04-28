import { TeamsJoinCodeService } from './teams.join-code.service';
import { describe, it, expect } from 'vitest';

describe('TeamsJoinCodeService', () => {
  const service = new TeamsJoinCodeService();

  it('should generate 6-character alphanumeric codes', () => {
    const codes = Array.from({ length: 100 }, () => service.generate());
    
    for (const code of codes) {
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
    }
  });

  it('should generate unique codes (mostly)', () => {
    const count = 1000;
    const codes = new Set(Array.from({ length: count }, () => service.generate()));
    expect(codes.size).toBe(count);
  });
});
