import { formatDistanceToNow, format } from 'date-fns';

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '--';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '--';
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '--';
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return '--';
  }
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '--';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (ms >= 3_600_000) {
    const hours = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m ${seconds}s`;
}

export function formatCost(cents: number | null | undefined): string {
  if (cents == null) return '--';
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(4)}`;
}

export function maskToken(token: string): string {
  if (token.length <= 10) return token;
  return `${token.slice(0, 7)}...${token.slice(-3)}`;
}
