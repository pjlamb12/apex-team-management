import { getDefaultSlots, getPositionFromSlot } from './lineup-entry.model';

describe('lineup-entry.model', () => {
  describe('getDefaultSlots', () => {
    it('should return 1-3-4-1 formation for 9v9 soccer with CDM and CAM', () => {
      const slots = getDefaultSlots(9, 'Soccer');
      expect(slots).toEqual([0, 2, 3, 4, 7, 9, 13, 18, 21]);
      
      const positions = slots.map(s => getPositionFromSlot(s, 'Soccer'));
      expect(positions[0]).toBe('GK');
      expect(positions.slice(1, 4)).toEqual(['DEF', 'DEF', 'DEF']);
      expect(positions.filter(p => p === 'MID').length).toBe(4);
      expect(positions.filter(p => p === 'FWD').length).toBe(1);
    });

    it('should return 4-4-2 formation for 11v11 soccer', () => {
      const slots = getDefaultSlots(11, 'Soccer');
      expect(slots).toEqual([0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14]);
    });

    it('should return 2-3-1 formation for 7v7 soccer', () => {
      const slots = getDefaultSlots(7, 'Soccer');
      expect(slots).toEqual([0, 2, 4, 7, 8, 9, 13]);
    });

    it('should return 6 rotation slots for Volleyball', () => {
      const slots = getDefaultSlots(6, 'Volleyball');
      expect(slots).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('getPositionFromSlot', () => {
    it('should map slot 0 to GK', () => {
      expect(getPositionFromSlot(0)).toBe('GK');
    });

    it('should map slots 1-5 to DEF', () => {
      [1, 2, 3, 4, 5].forEach(s => {
        expect(getPositionFromSlot(s)).toBe('DEF');
      });
    });

    it('should map slots 6-10 and 16-21 to MID', () => {
      [6, 7, 8, 9, 10, 16, 17, 18, 19, 20, 21].forEach(s => {
        expect(getPositionFromSlot(s)).toBe('MID');
      });
    });

    it('should map slots 11-15 to FWD', () => {
      [11, 12, 13, 14, 15].forEach(s => {
        expect(getPositionFromSlot(s)).toBe('FWD');
      });
    });

    it('should map slot 99 to Libero for Volleyball', () => {
      expect(getPositionFromSlot(99, 'Volleyball')).toBe('Libero');
    });
  });
});
