import { scheduleKeys, useSchedule, useToggleScheduleActive, useDeleteSchedule, useTimezones, useCreateSchedule, useUpdateSchedule } from '../use-schedules';

describe('scheduleKeys', () => {
  it('generates correct base key', () => {
    expect(scheduleKeys.all).toEqual(['schedules']);
  });

  it('generates correct lists key', () => {
    expect(scheduleKeys.lists()).toEqual(['schedules', 'list']);
  });

  it('generates correct list key with environment', () => {
    const key = scheduleKeys.list('dev');
    expect(key).toEqual(['schedules', 'list', { environment: 'dev' }]);
  });

  it('generates different keys for different environments', () => {
    const key1 = scheduleKeys.list('dev');
    const key2 = scheduleKeys.list('prod');
    expect(key1).not.toEqual(key2);
  });

  it('generates correct detail key', () => {
    expect(scheduleKeys.detail('sched_123')).toEqual(['schedules', 'detail', 'sched_123']);
  });

  it('generates correct details base key', () => {
    expect(scheduleKeys.details()).toEqual(['schedules', 'detail']);
  });

  it('detail keys for different IDs are distinct', () => {
    const key1 = scheduleKeys.detail('sched_1');
    const key2 = scheduleKeys.detail('sched_2');
    expect(key1).not.toEqual(key2);
  });
});

describe('scheduleKeys.timezones', () => {
  it('generates correct timezones key', () => {
    expect(scheduleKeys.timezones()).toEqual(['timezones']);
  });
});

describe('useSchedule', () => {
  it('is exported as a function', () => {
    expect(typeof useSchedule).toBe('function');
  });
});

describe('useToggleScheduleActive', () => {
  it('is exported as a function', () => {
    expect(typeof useToggleScheduleActive).toBe('function');
  });
});

describe('useDeleteSchedule', () => {
  it('is exported as a function', () => {
    expect(typeof useDeleteSchedule).toBe('function');
  });
});

describe('useTimezones', () => {
  it('is exported as a function', () => {
    expect(typeof useTimezones).toBe('function');
  });
});

describe('useCreateSchedule', () => {
  it('is exported as a function', () => {
    expect(typeof useCreateSchedule).toBe('function');
  });
});

describe('useUpdateSchedule', () => {
  it('is exported as a function', () => {
    expect(typeof useUpdateSchedule).toBe('function');
  });
});
