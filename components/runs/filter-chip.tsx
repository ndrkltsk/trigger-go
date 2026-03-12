import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronDown } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  activeLabel?: string;
  onPress: () => void;
}

export function FilterChip({ label, isActive, activeLabel, onPress }: FilterChipProps) {
  const a11yLabel = isActive && activeLabel
    ? `${label} filter: ${activeLabel}`
    : `${label} filter`;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1 rounded-md border px-3 min-h-[32px]',
        isActive
          ? 'bg-secondary border-secondary'
          : 'bg-card border-border'
      )}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={`Open ${label.toLowerCase()} filter options`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className={cn(
          'text-xs font-medium',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
        numberOfLines={1}
      >
        {isActive && activeLabel ? activeLabel : label}
      </Text>
      <ChevronDown size={12} color={isActive ? '#71717a' : '#a1a1aa'} />
    </Pressable>
  );
}
