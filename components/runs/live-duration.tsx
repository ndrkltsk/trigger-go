import React, { useEffect, useState } from 'react';
import { Text } from '@/components/ui/text';
import { formatDuration } from '@/lib/format';

/**
 * Displays a live-updating duration that ticks every second,
 * calculated from a given start time to now.
 */
export function LiveDuration({ startedAt, className }: { startedAt: string; className?: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Date.now() - new Date(startedAt).getTime()
  );

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    setElapsed(Date.now() - start);

    const id = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);

    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <Text className={className ?? "text-mobile-caption text-muted-foreground"}>
      {formatDuration(Math.max(0, elapsed))}
    </Text>
  );
}
