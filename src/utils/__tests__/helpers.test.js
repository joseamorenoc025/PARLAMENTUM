import { describe, it, expect } from 'vitest';
import { getDaysSince, getStagnationColor, getStagnationLabel } from '../helpers';

describe('Helpers Utility', () => {
  describe('getDaysSince', () => {
    it('returns 999 if no date is provided', () => {
      expect(getDaysSince(null)).toBe(999);
    });

    it('calculates the correct number of days', () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000));
      const dateStr = tenDaysAgo.toISOString().split('T')[0];
      expect(getDaysSince(dateStr)).toBe(10);
    });
  });

  describe('getStagnationColor', () => {
    it('returns red for > 30 days', () => {
      const today = new Date();
      const oldDate = new Date(today.getTime() - (31 * 24 * 60 * 60 * 1000));
      const dateStr = oldDate.toISOString().split('T')[0];
      expect(getStagnationColor(dateStr)).toContain('text-red-500');
    });

    it('returns amber for 15-30 days', () => {
        const today = new Date();
        const midDate = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000));
        const dateStr = midDate.toISOString().split('T')[0];
        expect(getStagnationColor(dateStr)).toContain('text-amber-500');
      });

    it('returns emerald for < 15 days', () => {
      const today = new Date();
      const recentDate = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
      const dateStr = recentDate.toISOString().split('T')[0];
      expect(getStagnationColor(dateStr)).toContain('text-emerald-500');
    });
  });

  describe('getStagnationLabel', () => {
    it('returns correct labels', () => {
        const today = new Date();
        
        const oldDate = new Date(today.getTime() - (35 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const midDate = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const recentDate = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

        expect(getStagnationLabel(oldDate)).toBe('Estancado (>30 días)');
        expect(getStagnationLabel(midDate)).toBe('Atención (15-30 días)');
        expect(getStagnationLabel(recentDate)).toBe('Activo (<15 días)');
    });
  });
});
