import { useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { BottomSheet, BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { useEnvironment } from '@/hooks/use-environment';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { cn } from '@/lib/utils';
import { ENV_LABELS, ENV_DOT_COLORS, ENV_TEXT_COLORS, ENV_COLORS } from '@/lib/environment';

export function EnvironmentSwitcher() {
  const { currentEnvironment, availableEnvironments, setEnvironment } = useEnvironment();
  const sheetRef = useRef<BottomSheetRef>(null);
  const { height } = useWindowDimensions();
  const projectRef = useAuthStore((s) => s.projectRef);
  const projectName = useProjectsStore((s) =>
    s.savedProjects.find((p) => p.projectRef === projectRef)?.name
  );

  return (
    <>
      <Pressable
        onPress={() => sheetRef.current?.present()}
        hitSlop={8}
        className="items-center px-2"
        accessibilityRole="button"
        accessibilityLabel={`Environment: ${ENV_LABELS[currentEnvironment]}. Tap to change.`}
      >
        <Text className={cn('text-sm font-semibold', ENV_TEXT_COLORS[currentEnvironment])}>
          {ENV_LABELS[currentEnvironment]}
        </Text>
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Select Environment" />}
      >
        <ScrollView nestedScrollEnabled className="px-4 py-2">
          {projectRef && (
            <View className="mb-2 pb-2 border-b border-border">
              <Text className="text-xs text-muted-foreground">Project</Text>
              {projectName && (
                <Text className="text-sm font-medium text-foreground">{projectName}</Text>
              )}
              <Text className="text-xs text-muted-foreground">{projectRef}</Text>
            </View>
          )}
          {availableEnvironments.map((env) => {
            const isActive = env === currentEnvironment;
            return (
              <Pressable
                key={env}
                onPress={() => {
                  setEnvironment(env);
                  sheetRef.current?.dismiss();
                }}
                className="flex-row items-center gap-3 px-1 py-3"
              >
                <View className={cn('h-2.5 w-2.5 rounded-full', ENV_DOT_COLORS[env])} />
                <Text
                  className={cn(
                    'text-base flex-1',
                    isActive ? cn('font-semibold', ENV_TEXT_COLORS[env]) : 'text-foreground'
                  )}
                >
                  {ENV_LABELS[env]}
                </Text>
                {isActive && <Check size={18} color={ENV_COLORS[env]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
