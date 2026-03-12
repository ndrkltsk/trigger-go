import { View } from 'react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cronToHuman } from '@/lib/cron';

const PRESETS = [
  { label: 'Every 5 min', cron: '*/5 * * * *' },
  { label: 'Hourly', cron: '0 * * * *' },
  { label: 'Daily midnight', cron: '0 0 * * *' },
  { label: 'Mon 9 AM', cron: '0 9 * * 1' },
  { label: 'Weekdays 9 AM', cron: '0 9 * * 1-5' },
] as const;

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
  error?: string;
}

export function CronBuilder({ value, onChange, error }: CronBuilderProps) {
  const humanReadable = value ? cronToHuman(value) : '';

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.cron}
            variant={value === preset.cron ? 'default' : 'outline'}
            size="sm"
            onPress={() => onChange(preset.cron)}
          >
            <Text className={`text-xs ${value === preset.cron ? 'text-primary-foreground' : 'text-foreground'}`}>{preset.label}</Text>
          </Button>
        ))}
      </View>

      <Input
        value={value}
        onChangeText={onChange}
        placeholder="* * * * *"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {humanReadable && humanReadable !== value && (
        <Text className="text-xs text-muted-foreground">{humanReadable}</Text>
      )}

      {error && (
        <Text className="text-xs text-destructive">{error}</Text>
      )}
    </View>
  );
}
