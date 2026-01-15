import { getSlotDateInIST, getSlotTimeInIST, formatSlotTimeInIST, formatSlotDateTimeInIST, isSameDateIST, parseISTDateString, getTodayDateInIST, isSlotOnSelectedDate } from './timezone.util';

describe('Timezone Utility - UTC to IST Conversion', () => {
  describe('getSlotDateInIST', () => {
    /**
     * CRITICAL TEST CASE: Jan 12, 21:30 UTC should appear as Jan 13 in IST
     * This is the primary bug fix - slots created late evening in UTC
     * belong to the next day in IST
     */
    it('should convert Jan 12 21:30 UTC to Jan 13 IST date', () => {
      const utcDate = new Date('2026-01-12T21:30:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-13');
    });

    /**
     * Test Jan 19, 21:30 UTC → Jan 20 IST
     */
    it('should convert Jan 19 21:30 UTC to Jan 20 IST date', () => {
      const utcDate = new Date('2026-01-19T21:30:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-20');
    });

    /**
     * Test Jan 26, 21:30 UTC → Jan 27 IST
     */
    it('should convert Jan 26 21:30 UTC to Jan 27 IST date', () => {
      const utcDate = new Date('2026-01-26T21:30:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-27');
    });

    /**
     * Test early UTC time (same day in IST)
     * Jan 13, 03:00 UTC → Jan 13, 08:30 IST (same date)
     */
    it('should keep same date when UTC time is early', () => {
      const utcDate = new Date('2026-01-13T03:00:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-13');
    });

    /**
     * Test boundary: Just before midnight UTC
     * Jan 12, 23:59 UTC → Jan 13, 05:29 IST
     */
    it('should handle near-midnight UTC correctly', () => {
      const utcDate = new Date('2026-01-12T23:59:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-13');
    });

    /**
     * Test boundary: Just after IST cutoff
     * Jan 12, 18:31 UTC → Jan 13, 00:01 IST (next day)
     */
    it('should cross date boundary at IST midnight', () => {
      const utcDate = new Date('2026-01-12T18:31:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-13');
    });

    /**
     * Test: Just before IST cutoff
     * Jan 12, 18:29 UTC → Jan 12, 23:59 IST (same day)
     */
    it('should stay same day just before IST midnight', () => {
      const utcDate = new Date('2026-01-12T18:29:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-12');
    });

    /**
     * Test month boundary
     * Jan 31, 21:00 UTC → Feb 1 IST
     */
    it('should handle month boundary correctly', () => {
      const utcDate = new Date('2026-01-31T21:00:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-02-01');
    });

    /**
     * Test year boundary
     * Dec 31, 21:00 UTC → Jan 1 IST (next year)
     */
    it('should handle year boundary correctly', () => {
      const utcDate = new Date('2025-12-31T21:00:00.000Z');
      const istDateStr = getSlotDateInIST(utcDate);
      expect(istDateStr).toBe('2026-01-01');
    });
  });

  describe('getSlotTimeInIST', () => {
    it('should convert 21:30 UTC to 03:00:00 IST', () => {
      const utcDate = new Date('2026-01-12T21:30:00.000Z');
      const istTime = getSlotTimeInIST(utcDate);
      expect(istTime).toBe('03:00:00');
    });

    it('should handle midnight UTC correctly', () => {
      const utcDate = new Date('2026-01-13T00:00:00.000Z');
      const istTime = getSlotTimeInIST(utcDate);
      expect(istTime).toBe('05:30:00');
    });
  });

  describe('formatSlotTimeInIST', () => {
    it('should format 21:30 UTC as readable IST time', () => {
      const utcDate = new Date('2026-01-12T21:30:00.000Z');
      const formatted = formatSlotTimeInIST(utcDate);
      // Should be "03:00 AM" or similar format
      expect(formatted).toMatch(/03:00/);
    });
  });

  describe('formatSlotDateTimeInIST', () => {
    it('should format complete datetime in IST', () => {
      const utcDate = new Date('2026-01-12T21:30:00.000Z');
      const formatted = formatSlotDateTimeInIST(utcDate);
      // Should contain Jan 13 (next day in IST) and 03:00
      expect(formatted).toMatch(/13.*Jan.*2026/);
      expect(formatted).toMatch(/03:00/);
    });
  });

  describe('isSameDateIST', () => {
    it('should return true for matching dates', () => {
      expect(isSameDateIST('2026-01-13', '2026-01-13')).toBe(true);
    });

    it('should return false for different dates', () => {
      expect(isSameDateIST('2026-01-12', '2026-01-13')).toBe(false);
    });
  });

  describe('isSlotOnSelectedDate', () => {
    /**
     * CRITICAL: This test verifies the correct slot matching logic
     * Slot created at Jan 12 21:30 UTC has slotDate = "2026-01-13"
     * It should match when user selects Jan 13 in calendar
     */
    it('should match slot with slotDate to selected calendar date', () => {
      const slotDate = '2026-01-13'; // From backend
      const selectedDate = '2026-01-13'; // User selected in calendar
      expect(isSlotOnSelectedDate(slotDate, selectedDate)).toBe(true);
    });

    it('should NOT match slot when dates differ', () => {
      const slotDate = '2026-01-13'; // From backend
      const selectedDate = '2026-01-12'; // User selected wrong date
      expect(isSlotOnSelectedDate(slotDate, selectedDate)).toBe(false);
    });
  });

  describe('parseISTDateString', () => {
    it('should parse YYYY-MM-DD string to Date object', () => {
      const dateStr = '2026-01-13';
      const date = parseISTDateString(dateStr);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // 0-indexed (January)
      expect(date.getDate()).toBe(13);
    });
  });

  describe('Edge Cases and Validation', () => {
    /**
     * Comprehensive test for the original reported bug scenario
     */
    it('should fix the original bug: slots appear on correct calendar dates', () => {
      // Scenario: Coach creates slots for Jan 12, 21:30-22:30 UTC
      const slotStartUTC = new Date('2026-01-12T21:30:00.000Z');
      const slotEndUTC = new Date('2026-01-12T22:30:00.000Z');

      // Backend computes slotDate
      const slotDate = getSlotDateInIST(slotStartUTC);

      // Frontend user selects Jan 13 in calendar (local timezone)
      const userSelectedDate = '2026-01-13';

      // Slot should match and appear
      expect(slotDate).toBe('2026-01-13');
      expect(isSlotOnSelectedDate(slotDate, userSelectedDate)).toBe(true);

      // Verify time display
      const displayTime = formatSlotTimeInIST(slotStartUTC);
      expect(displayTime).toMatch(/03:00/); // 3 AM IST
    });

    /**
     * Test that wrong date selection doesn't show the slot
     */
    it('should NOT show slot on wrong date selection', () => {
      const slotStartUTC = new Date('2026-01-12T21:30:00.000Z');
      const slotDate = getSlotDateInIST(slotStartUTC); // 2026-01-13

      // User mistakenly selects Jan 12 (the UTC date)
      const userSelectedDate = '2026-01-12';

      // Slot should NOT match
      expect(isSlotOnSelectedDate(slotDate, userSelectedDate)).toBe(false);
    });
  });
});
