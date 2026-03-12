import { cronToHuman } from '@/lib/cron';

describe('cronToHuman', () => {
  describe('every N minutes', () => {
    it('converts every minute', () => {
      expect(cronToHuman('*/1 * * * *')).toBe('Every minute');
    });

    it('converts every 5 minutes', () => {
      expect(cronToHuman('*/5 * * * *')).toBe('Every 5 minutes');
    });

    it('converts every 15 minutes', () => {
      expect(cronToHuman('*/15 * * * *')).toBe('Every 15 minutes');
    });
  });

  describe('every N hours', () => {
    it('converts every hour', () => {
      expect(cronToHuman('0 */1 * * *')).toBe('Every hour');
    });

    it('converts every 2 hours', () => {
      expect(cronToHuman('0 */2 * * *')).toBe('Every 2 hours');
    });

    it('converts every 6 hours', () => {
      expect(cronToHuman('0 */6 * * *')).toBe('Every 6 hours');
    });
  });

  describe('every hour at specific minute', () => {
    it('converts minute 0 to every hour', () => {
      expect(cronToHuman('0 * * * *')).toBe('Every hour');
    });

    it('converts specific minute', () => {
      expect(cronToHuman('30 * * * *')).toBe('Every hour at minute 30');
    });
  });

  describe('daily at specific time', () => {
    it('converts midnight', () => {
      expect(cronToHuman('0 0 * * *')).toBe('Every day at 12:00 AM');
    });

    it('converts morning time', () => {
      expect(cronToHuman('30 9 * * *')).toBe('Every day at 9:30 AM');
    });

    it('converts noon', () => {
      expect(cronToHuman('0 12 * * *')).toBe('Every day at 12:00 PM');
    });

    it('converts afternoon time', () => {
      expect(cronToHuman('15 14 * * *')).toBe('Every day at 2:15 PM');
    });
  });

  describe('specific day of week', () => {
    it('converts Sunday', () => {
      expect(cronToHuman('0 9 * * 0')).toBe('Every Sunday at 9:00 AM');
    });

    it('converts Monday', () => {
      expect(cronToHuman('0 8 * * 1')).toBe('Every Monday at 8:00 AM');
    });

    it('converts Friday', () => {
      expect(cronToHuman('30 17 * * 5')).toBe('Every Friday at 5:30 PM');
    });
  });

  describe('specific day of month', () => {
    it('converts 1st of month', () => {
      expect(cronToHuman('0 0 1 * *')).toBe('Monthly on the 1st at 12:00 AM');
    });

    it('converts 2nd of month', () => {
      expect(cronToHuman('0 10 2 * *')).toBe('Monthly on the 2nd at 10:00 AM');
    });

    it('converts 3rd of month', () => {
      expect(cronToHuman('0 10 3 * *')).toBe('Monthly on the 3rd at 10:00 AM');
    });

    it('converts 15th of month', () => {
      expect(cronToHuman('0 12 15 * *')).toBe('Monthly on the 15th at 12:00 PM');
    });

    it('converts 21st of month', () => {
      expect(cronToHuman('0 9 21 * *')).toBe('Monthly on the 21st at 9:00 AM');
    });

    it('converts 22nd of month', () => {
      expect(cronToHuman('0 9 22 * *')).toBe('Monthly on the 22nd at 9:00 AM');
    });

    it('converts 23rd of month', () => {
      expect(cronToHuman('0 9 23 * *')).toBe('Monthly on the 23rd at 9:00 AM');
    });
  });

  describe('fallback', () => {
    it('returns expression for unrecognized patterns', () => {
      expect(cronToHuman('0 0 1 1 *')).toBe('0 0 1 1 *');
    });

    it('returns expression for wrong part count', () => {
      expect(cronToHuman('* * *')).toBe('* * *');
    });

    it('returns expression for empty string', () => {
      expect(cronToHuman('')).toBe('');
    });
  });
});
