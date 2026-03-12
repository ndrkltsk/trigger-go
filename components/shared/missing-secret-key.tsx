import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore, type Environment } from '@/stores/preferences-store';
import { ENV_FULL_LABELS as ENV_LABELS } from '@/lib/environment';

interface MissingSecretKeyProps {
  feature?: string;
  environment?: Environment;
}

export function MissingSecretKey({ feature, environment }: MissingSecretKeyProps) {
  const router = useRouter();
  const projectRef = useAuthStore((s) => s.projectRef);
  const selectedEnvironment = usePreferencesStore((s) => s.selectedEnvironment);

  const env = environment ?? selectedEnvironment;
  const envLabel = ENV_LABELS[env];

  return (
    <View
      className="flex-1 bg-background items-center justify-center px-8"
      accessibilityRole="summary"
      accessibilityLabel={`Secret API key required for ${envLabel} environment`}
    >
      {/* Illustration placeholder */}
      <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-6">
        <KeyRound size={36} color="#8B95A5" />
      </View>

      <Text variant="h3" className="text-center mb-3">
        Secret API Key Required
      </Text>

      <Text className="text-[15px] text-muted-foreground text-center mb-2 leading-[22px]">
        To access {feature ?? 'this data'} in the{' '}
        <Text className="text-[15px] font-semibold text-foreground">{envLabel}</Text>{' '}
        environment, you need to provide a secret API key.
      </Text>

      <Text className="text-[13px] text-muted-foreground text-center mb-8 leading-[20px]">
        You can find your secret key in your Trigger.dev dashboard under API keys.
      </Text>

      {projectRef && (
        <Button
          variant="default"
          className="w-full max-w-[280px]"
          onPress={() =>
            router.push(`./project/${projectRef}`)
          }
        >
          <Text className="text-sm font-medium text-primary-foreground">
            Add Secret Key
          </Text>
        </Button>
      )}
    </View>
  );
}
