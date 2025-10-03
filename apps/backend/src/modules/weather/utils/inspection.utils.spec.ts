import { calculateInspectionDeadline, WorkingHoursConfig } from './inspection.utils';

describe('Inspection Deadline Calculator', () => {
  const _defaultWorkingHours: WorkingHoursConfig = {
    start: 8,
    end: 17,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
  };

  describe('calculateInspectionDeadline - Weekday Storms', () => {
    it('should add 24 working hours for weekday storm (Monday 9am)', () => {
      // Storm ends Monday 9am
      const stormEnd = new Date('2025-10-06T09:00:00'); // Monday
      const deadline = calculateInspectionDeadline(stormEnd);

      // Monday 9am + 24 working hours = Wednesday 9am
      // Mon 9am-5pm: 8 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-12pm: 7 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
      expect(deadline.getHours()).toBeGreaterThanOrEqual(8);
    });

    it('should add 24 working hours for mid-week storm (Wednesday 2pm)', () => {
      // Storm ends Wednesday 2pm
      const stormEnd = new Date('2025-10-08T14:00:00'); // Wednesday
      const deadline = calculateInspectionDeadline(stormEnd);

      // Wednesday 2pm + 24 working hours
      // Wed 2pm-5pm: 3 hours
      // Thu 8am-5pm: 9 hours
      // Fri 8am-5pm: 9 hours
      // Mon 8am-11am: 3 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(1); // Monday
      expect(deadline.getHours()).toBeGreaterThanOrEqual(8);
    });
  });

  describe('calculateInspectionDeadline - Weekend Storms', () => {
    it('should skip weekend for Saturday storm', () => {
      // Storm ends Saturday 2pm
      const stormEnd = new Date('2025-10-04T14:00:00'); // Saturday
      const deadline = calculateInspectionDeadline(stormEnd);

      // Saturday is non-working day, so 24 hours starts Monday 8am
      // Mon 8am-5pm: 9 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
      expect([1, 2, 3, 4, 5]).toContain(deadline.getDay()); // Weekday only
    });

    it('should skip weekend for Sunday storm', () => {
      // Storm ends Sunday 10am
      const stormEnd = new Date('2025-10-05T10:00:00'); // Sunday
      const deadline = calculateInspectionDeadline(stormEnd);

      // Sunday is non-working day, so 24 hours starts Monday 8am
      // Mon 8am-5pm: 9 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
      expect([1, 2, 3, 4, 5]).toContain(deadline.getDay()); // Weekday only
    });

    it('should skip weekend for Friday evening storm', () => {
      // Storm ends Friday 4pm
      const stormEnd = new Date('2025-10-03T16:00:00'); // Friday 4pm
      const deadline = calculateInspectionDeadline(stormEnd);

      // Fri 4pm-5pm: 1 hour
      // Skip weekend
      // Mon 8am-5pm: 9 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-12pm: 5 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBeGreaterThan(0); // Not Sunday
      expect(deadline.getDay()).toBeLessThan(6); // Not Saturday
      expect([1, 2, 3, 4, 5]).toContain(deadline.getDay()); // Weekday
    });
  });

  describe('calculateInspectionDeadline - Working Hours Logic', () => {
    it('should respect working hours 8am-5pm', () => {
      // Storm ends Tuesday 8am (start of working day)
      const stormEnd = new Date('2025-10-07T08:00:00'); // Tuesday 8am
      const deadline = calculateInspectionDeadline(stormEnd);

      // Tue 8am-5pm: 9 hours
      // Wed 8am-5pm: 9 hours
      // Thu 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(4); // Thursday
      expect(deadline.getHours()).toBeLessThan(17); // Before 5pm
      expect(deadline.getHours()).toBeGreaterThanOrEqual(8); // After 8am
    });

    it('should not count non-working hours (before 8am)', () => {
      // Storm ends Tuesday 6am (before working hours)
      const stormEnd = new Date('2025-10-07T06:00:00'); // Tuesday 6am
      const deadline = calculateInspectionDeadline(stormEnd);

      // 6am-8am: 0 hours (non-working)
      // Tue 8am-5pm: 9 hours
      // Wed 8am-5pm: 9 hours
      // Thu 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(4); // Thursday
    });

    it('should not count non-working hours (after 5pm)', () => {
      // Storm ends Tuesday 5pm (end of working day)
      const stormEnd = new Date('2025-10-07T17:00:00'); // Tuesday 5pm
      const deadline = calculateInspectionDeadline(stormEnd);

      // Tue 5pm-next morning: 0 hours (non-working)
      // Wed 8am-5pm: 9 hours
      // Thu 8am-5pm: 9 hours
      // Fri 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(5); // Friday
    });
  });

  describe('calculateInspectionDeadline - Custom Working Hours', () => {
    it('should support custom working hours (6am-4pm)', () => {
      const customHours: WorkingHoursConfig = {
        start: 6,
        end: 16,
        daysOfWeek: [1, 2, 3, 4, 5],
      };

      // Storm ends Monday 6am (start of custom working day)
      const stormEnd = new Date('2025-10-06T06:00:00'); // Monday 6am
      const deadline = calculateInspectionDeadline(stormEnd, customHours);

      // Mon 6am-4pm: 10 hours
      // Tue 6am-4pm: 10 hours
      // Wed 6am-10am: 4 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
      expect(deadline.getHours()).toBeGreaterThanOrEqual(6);
      expect(deadline.getHours()).toBeLessThan(16);
    });

    it('should support custom working days (including Saturday)', () => {
      const customHours: WorkingHoursConfig = {
        start: 8,
        end: 17,
        daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday-Saturday
      };

      // Storm ends Friday 4pm
      const stormEnd = new Date('2025-10-03T16:00:00'); // Friday 4pm
      const deadline = calculateInspectionDeadline(stormEnd, customHours);

      // Fri 4pm-5pm: 1 hour
      // Sat 8am-5pm: 9 hours
      // Sun: 0 hours (not working)
      // Mon 8am-5pm: 9 hours
      // Tue 8am-12pm: 5 hours
      // Total: 24 hours
      expect([1, 2, 6]).toContain(deadline.getDay()); // Mon, Tue, or Sat
    });
  });

  describe('calculateInspectionDeadline - Edge Cases', () => {
    it('should handle storm ending exactly at 8am', () => {
      // Storm ends Monday 8am (exact start of working hours)
      const stormEnd = new Date('2025-10-06T08:00:00'); // Monday 8am
      const deadline = calculateInspectionDeadline(stormEnd);

      // Mon 8am-5pm: 9 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
    });

    it('should handle storm ending exactly at 5pm', () => {
      // Storm ends Monday 5pm (exact end of working hours)
      const stormEnd = new Date('2025-10-06T17:00:00'); // Monday 5pm
      const deadline = calculateInspectionDeadline(stormEnd);

      // Mon 5pm-next morning: 0 hours (non-working)
      // Tue 8am-5pm: 9 hours
      // Wed 8am-5pm: 9 hours
      // Thu 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(4); // Thursday
    });

    it('should handle midnight storm', () => {
      // Storm ends Tuesday midnight (00:00)
      const stormEnd = new Date('2025-10-07T00:00:00'); // Tuesday 12am
      const deadline = calculateInspectionDeadline(stormEnd);

      // Midnight-8am: 0 hours (non-working)
      // Tue 8am-5pm: 9 hours
      // Wed 8am-5pm: 9 hours
      // Thu 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(4); // Thursday
    });
  });

  describe('calculateInspectionDeadline - EPA Compliance Scenarios', () => {
    it('should calculate deadline for typical storm scenario (Wed 3pm)', () => {
      // Storm ends Wednesday 3pm
      const stormEnd = new Date('2025-10-08T15:00:00'); // Wednesday 3pm
      const deadline = calculateInspectionDeadline(stormEnd);

      // Wed 3pm-5pm: 2 hours
      // Thu 8am-5pm: 9 hours
      // Fri 8am-5pm: 9 hours
      // Mon 8am-12pm: 4 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(1); // Monday
      expect(deadline.getHours()).toBeGreaterThanOrEqual(8);
      expect(deadline.getHours()).toBeLessThan(17);
    });

    it('should return deadline after storm (not before)', () => {
      // Storm ends Monday 9am
      const stormEnd = new Date('2025-10-06T09:00:00');
      const deadline = calculateInspectionDeadline(stormEnd);

      // Deadline must be after storm end time
      expect(deadline.getTime()).toBeGreaterThan(stormEnd.getTime());
    });

    it('should calculate deadline across multiple weeks if needed', () => {
      // Storm ends Friday 5pm (end of week)
      const stormEnd = new Date('2025-10-03T17:00:00'); // Friday 5pm
      const deadline = calculateInspectionDeadline(stormEnd);

      // Skip weekend, add 24 working hours starting Monday
      // Mon 8am-5pm: 9 hours
      // Tue 8am-5pm: 9 hours
      // Wed 8am-2pm: 6 hours
      // Total: 24 hours
      expect(deadline.getDay()).toBe(3); // Wednesday
      expect(deadline.getTime()).toBeGreaterThan(stormEnd.getTime());
    });
  });
});
