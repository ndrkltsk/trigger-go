import { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react-native';
import {
  useNotificationRulesStore,
  type NotificationRule,
} from '@/stores/notification-rules-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { ENV_FULL_LABELS } from '@/lib/environment';

const TRIGGER_TYPES: { value: string; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'tag', label: 'Tag' },
  { value: 'schedule', label: 'Schedule' },
];

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'failure', label: 'Failure' },
  { value: 'completion', label: 'Completion' },
  { value: 'any', label: 'Any' },
];

const SEVERITIES: { value: string; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

interface RuleFormSheetProps {
  editRule?: NotificationRule | null;
  onDismiss?: () => void;
}

function toOption(value: string, options: { value: string; label: string }[]): Option | undefined {
  const found = options.find((o) => o.value === value);
  return found ? { value: found.value, label: found.label } : undefined;
}

export const RuleFormSheet = forwardRef<BottomSheetRef, RuleFormSheetProps>(
  ({ editRule, onDismiss }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const { addRule, updateRule } = useNotificationRulesStore();
    const availableEnvironments = useEnvironmentsStore((s) => s.availableEnvironments);

    const ENVIRONMENTS: { value: string; label: string }[] = [
      { value: 'any', label: 'Any' },
      ...availableEnvironments.map((env) => ({ value: env, label: ENV_FULL_LABELS[env] })),
    ];

    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState<Option | undefined>(undefined);
    const [triggerValue, setTriggerValue] = useState('');
    const [eventType, setEventType] = useState<Option | undefined>(undefined);
    const [environment, setEnvironment] = useState<Option | undefined>(undefined);
    const [severity, setSeverity] = useState<Option | undefined>(undefined);
    const [validationError, setValidationError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      present: async () => {
        if (editRule) {
          setName(editRule.name);
          setTriggerType(toOption(editRule.triggerType, TRIGGER_TYPES));
          setTriggerValue(editRule.triggerValue);
          setEventType(toOption(editRule.eventType, EVENT_TYPES));
          setEnvironment(toOption(editRule.environment, ENVIRONMENTS));
          setSeverity(toOption(editRule.severity, SEVERITIES));
        } else {
          setName('');
          setTriggerType(undefined);
          setTriggerValue('');
          setEventType(toOption('failure', EVENT_TYPES));
          setEnvironment(toOption('any', ENVIRONMENTS));
          setSeverity(toOption('normal', SEVERITIES));
        }
        setValidationError(null);
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const handleSave = () => {
      if (!name.trim()) {
        setValidationError('Rule name is required');
        return;
      }
      if (!triggerType?.value) {
        setValidationError('Trigger type is required');
        return;
      }
      if (!triggerValue.trim()) {
        setValidationError('Trigger value is required');
        return;
      }

      const ruleData = {
        name: name.trim(),
        triggerType: triggerType.value as NotificationRule['triggerType'],
        triggerValue: triggerValue.trim(),
        eventType: (eventType?.value ?? 'any') as NotificationRule['eventType'],
        environment: (environment?.value ?? 'any') as NotificationRule['environment'],
        severity: (severity?.value ?? 'normal') as NotificationRule['severity'],
        enabled: editRule?.enabled ?? true,
      };

      if (editRule) {
        updateRule(editRule.id, ruleData);
      } else {
        addRule(ruleData);
      }

      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        ref={sheetRef}
        detents={['auto', 1]}
        onDidDismiss={onDismiss}
        header={<BottomSheetHeader title={editRule ? 'Edit Rule' : 'New Rule'} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button glassTintColor='rgb(38, 217, 104)' variant="glass" onPress={handleSave} className="flex-1">
              <Text className="text-sm font-medium text-primary-foreground">{editRule ? 'Update Rule' : 'Create Rule'}</Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pb-6">
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4 py-2">
              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">Rule Name</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Alert on payment failures"
                  autoCapitalize="none"
                />
              </View>

              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">Trigger Type</Text>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} label={t.label}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>

              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">
                  {triggerType?.value === 'task'
                    ? 'Task Identifier'
                    : triggerType?.value === 'tag'
                      ? 'Tag Value'
                      : triggerType?.value === 'schedule'
                        ? 'Schedule ID'
                        : 'Trigger Value'}
                </Text>
                <Input
                  value={triggerValue}
                  onChangeText={setTriggerValue}
                  placeholder={
                    triggerType?.value === 'task'
                      ? 'e.g. process-payment'
                      : triggerType?.value === 'tag'
                        ? 'e.g. user_123'
                        : triggerType?.value === 'schedule'
                          ? 'e.g. sched_abc123'
                          : 'Enter value'
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">Event Type</Text>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((e) => (
                      <SelectItem key={e.value} value={e.value} label={e.label}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>

              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">Environment</Text>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value} label={e.label}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>

              <View className="gap-1">
                <Text className="text-mobile-caption text-muted-foreground">Severity</Text>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value} label={s.label}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {severity?.value === 'high' && (
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <AlertTriangle size={12} color="#f59e0b" />
                    <Text className="text-mobile-caption text-amber-500">
                      High severity rules override quiet hours
                    </Text>
                  </View>
                )}
              </View>

              {validationError && (
                <Text className="text-xs text-destructive">{validationError}</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </BottomSheet>
    );
  }
);

RuleFormSheet.displayName = 'RuleFormSheet';
