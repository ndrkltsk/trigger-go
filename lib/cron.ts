const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(hour: string, minute: string): string {
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${displayHour}:00 ${period}` : `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
}

export function cronToHuman(expression: string): string {
  if (!expression || typeof expression !== 'string') return expression;

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return expression;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  try {
    // Every N minutes: */N * * * *
    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const interval = minute.slice(2);
      return interval === '1' ? 'Every minute' : `Every ${interval} minutes`;
    }

    // Every N hours: 0 */N * * *
    if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const interval = hour.slice(2);
      return interval === '1' ? 'Every hour' : `Every ${interval} hours`;
    }

    // Every hour at minute M: M * * * *
    if (!minute.includes('*') && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const m = parseInt(minute, 10);
      return m === 0 ? 'Every hour' : `Every hour at minute ${m}`;
    }

    // Daily at specific time: M H * * *
    if (!minute.includes('*') && !minute.includes('/') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Every day at ${formatTime(hour, minute)}`;
    }

    // Specific day of week: M H * * D
    if (!minute.includes('*') && !minute.includes('/') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && !dayOfWeek.includes('*')) {
      const dayNum = parseInt(dayOfWeek, 10);
      const dayName = DAYS[dayNum] ?? `day ${dayOfWeek}`;
      return `Every ${dayName} at ${formatTime(hour, minute)}`;
    }

    // Specific day of month: M H D * *
    if (!minute.includes('*') && !minute.includes('/') && !hour.includes('*') && !hour.includes('/') && !dayOfMonth.includes('*') && month === '*' && dayOfWeek === '*') {
      const d = parseInt(dayOfMonth, 10);
      const suffix = d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th';
      return `Monthly on the ${d}${suffix} at ${formatTime(hour, minute)}`;
    }

    return expression;
  } catch {
    return expression;
  }
}
