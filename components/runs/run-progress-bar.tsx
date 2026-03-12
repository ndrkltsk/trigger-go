import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';

interface RunProgressBarProps {
  metadata: Record<string, unknown> | null;
}

interface ProgressInfo {
  /** Normalized 0-1 progress value */
  value: number;
  /** Optional step info text like "Step 3 of 10" */
  stepInfo?: string;
}

function detectProgress(metadata: Record<string, unknown>): ProgressInfo | null {
  let value: number | null = null;
  let stepInfo: string | undefined;

  // Check step/totalSteps first (provides both value and step info)
  const step = metadata.step;
  const totalSteps = metadata.totalSteps;
  if (typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0) {
    value = step / totalSteps;
    stepInfo = `Step ${step} of ${totalSteps}`;
  }

  // Check progress / progressPercent / percent (may override step-based value)
  const progressRaw =
    metadata.progress ?? metadata.progressPercent ?? metadata.percent;

  if (typeof progressRaw === 'number') {
    // Determine if 0-1 float or 0-100 integer:
    // Values >= 2 are treated as 0-100 scale (e.g. 75, 50.5)
    // Values < 2 are treated as 0-1 scale (e.g. 0.5, 1.0, 1.5 overshoot)
    if (progressRaw >= 2) {
      value = progressRaw / 100;
    } else {
      value = progressRaw;
    }
  }

  if (value === null) return null;

  // Clamp to [0, 1]
  value = Math.min(Math.max(value, 0), 1);

  return { value, stepInfo };
}

export function RunProgressBar({ metadata }: RunProgressBarProps) {
  if (!metadata) return null;

  const progress = detectProgress(metadata);
  if (!progress) return null;

  const percentage = Math.round(progress.value * 100);

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Progress value={percentage} className="flex-1 h-2" indicatorClassName="bg-primary" />
        <Text className="text-xs font-semibold text-muted-foreground w-10 text-right">
          {percentage}%
        </Text>
      </View>
      {progress.stepInfo && (
        <Text className="text-xs text-muted-foreground mt-1">{progress.stepInfo}</Text>
      )}
    </View>
  );
}
