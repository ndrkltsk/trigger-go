import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Check, ChevronDown } from 'lucide-react-native';
import type { Option } from '@/components/ui/select';

const MACHINE_PRESETS = [
  { value: 'micro', label: 'micro' },
  { value: 'small-1x', label: 'small-1x' },
  { value: 'small-2x', label: 'small-2x' },
  { value: 'medium-1x', label: 'medium-1x' },
  { value: 'medium-2x', label: 'medium-2x' },
  { value: 'large-1x', label: 'large-1x' },
  { value: 'large-2x', label: 'large-2x' },
] as const;

export interface TriggerOptionsValues {
  delay: string;
  ttl: string;
  tags: string;
  queueName: string;
  concurrencyKey: string;
  idempotencyKey: string;
  machine: Option;
}

interface TriggerOptionsProps {
  values: TriggerOptionsValues;
  onChange: (values: TriggerOptionsValues) => void;
}

function OptionField({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export function TriggerOptions({ values, onChange }: TriggerOptionsProps) {
  const machineSheetRef = useRef<BottomSheetRef>(null);

  const update = (key: keyof TriggerOptionsValues, val: string) => {
    onChange({ ...values, [key]: val });
  };

  const handleMachineSelect = (preset: (typeof MACHINE_PRESETS)[number]) => {
    onChange({ ...values, machine: preset });
    machineSheetRef.current?.dismiss();
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex-row items-center justify-between py-2">
        <Text className="text-sm font-medium text-foreground">Advanced Options</Text>
        <ChevronDown size={16} color="#8B95A5" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <View className="gap-3 pt-2">
          <OptionField
            label="Delay"
            placeholder="e.g. 5m, 1h, 30s"
            value={values.delay}
            onChangeText={(v) => update('delay', v)}
          />
          <OptionField
            label="TTL (Time to Live)"
            placeholder="e.g. 1h, 1h42m"
            value={values.ttl}
            onChangeText={(v) => update('ttl', v)}
          />
          <OptionField
            label="Tags (comma-separated)"
            placeholder="e.g. user_123, order_456"
            value={values.tags}
            onChangeText={(v) => update('tags', v)}
          />
          <OptionField
            label="Queue Name"
            placeholder="e.g. my-queue"
            value={values.queueName}
            onChangeText={(v) => update('queueName', v)}
          />
          <OptionField
            label="Concurrency Key"
            placeholder="e.g. user-123"
            value={values.concurrencyKey}
            onChangeText={(v) => update('concurrencyKey', v)}
          />
          <OptionField
            label="Idempotency Key"
            placeholder="e.g. unique-key-123"
            value={values.idempotencyKey}
            onChangeText={(v) => update('idempotencyKey', v)}
          />
          <View className="gap-1">
            <Text className="text-xs text-muted-foreground">Machine Preset</Text>
            <Button
              variant="outline"
              className="justify-between"
              onPress={() => machineSheetRef.current?.present()}
            >
              <Text className="text-sm text-foreground">
                {values.machine?.label || 'Select preset'}
              </Text>
              <ChevronDown size={16} color="#8B95A5" />
            </Button>
            <BottomSheet
              ref={machineSheetRef}
              header={<BottomSheetHeader title="Machine Preset" />}
            >
              <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
                {values.machine && (
                  <Pressable
                    onPress={() => {
                      onChange({ ...values, machine: undefined as unknown as Option });
                      machineSheetRef.current?.dismiss();
                    }}
                    className="flex-row items-center justify-between px-3 py-2.5 rounded-md active:bg-muted border-b border-border mb-1"
                  >
                    <Text className="text-sm text-muted-foreground">Clear selection</Text>
                  </Pressable>
                )}
                {MACHINE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.value}
                    onPress={() => handleMachineSelect(preset)}
                    className="flex-row items-center justify-between px-3 py-2.5 rounded-md active:bg-muted"
                  >
                    <Text className="text-sm text-foreground">{preset.label}</Text>
                    {values.machine?.value === preset.value && (
                      <Check size={16} color="#22c55e" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </BottomSheet>
          </View>
        </View>
      </CollapsibleContent>
    </Collapsible>
  );
}
