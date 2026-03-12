import { forwardRef, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { View, TextInput, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCreateEnvVar, useImportEnvVars } from '@/hooks/api/use-envvars';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore, type Environment } from '@/stores/preferences-store';
import { useToast } from '@/stores/toast-store';
import { parseEnvFile, type EnvVariable, type EnvParseError } from '@/lib/env-parser';
import type { EnvType } from '@/services/api/envvars';

const ENV_VAR_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const EnvVarAddSheet = forwardRef<BottomSheetRef>((_, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);
  const createMutation = useCreateEnvVar();
  const importMutation = useImportEnvVars();

  const [activeTab, setActiveTab] = useState('single');

  // Single mode state
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Bulk mode state
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<EnvVariable[] | null>(null);
  const [parseErrors, setParseErrors] = useState<EnvParseError[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const resetState = useCallback(() => {
    setActiveTab('single');
    setName('');
    setValue('');
    setNameError(null);
    setRawText('');
    setParsed(null);
    setParseErrors([]);
    setHasParsed(false);
  }, []);

  useImperativeHandle(ref, () => ({
    present: async () => {
      resetState();
      await sheetRef.current?.present();
    },
    dismiss: async () => {
      await sheetRef.current?.dismiss();
    },
  }));

  const handleCreateSingle = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    if (!ENV_VAR_NAME_REGEX.test(trimmedName)) {
      setNameError(
        'Name must start with a letter or underscore, and contain only letters, numbers, and underscores'
      );
      return;
    }
    setNameError(null);
    try {
      await createMutation.mutateAsync({ name: trimmedName, value });
      sheetRef.current?.dismiss();
      showToast({ type: 'success', title: 'Variable created' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed to create variable',
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  }, [name, value, createMutation, showToast]);

  const handleParse = useCallback(() => {
    const result = parseEnvFile(rawText);
    setParsed(result.valid);
    setParseErrors(result.errors);
    setHasParsed(true);
  }, [rawText]);

  const handleImport = useCallback(async () => {
    if (!projectRef || !parsed?.length) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await importMutation.mutateAsync({
        projectRef,
        env: env as EnvType,
        variables: parsed,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.dismiss();
      showToast({
        type: 'success',
        title: `${parsed.length} variable${parsed.length === 1 ? '' : 's'} imported`,
      });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', title: 'Failed to import variables' });
    }
  }, [projectRef, env, parsed, importMutation, showToast]);

  const canImport = hasParsed && parsed !== null && parsed.length > 0 && parseErrors.length === 0;

  const footer =
    activeTab === 'single' ? (
      <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
        <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
          <Text className="text-sm font-medium">Cancel</Text>
        </Button>
        <Button
          glassTintColor="rgb(38, 217, 104)"
          variant="glass"
          onPress={handleCreateSingle}
          disabled={createMutation.isPending}
          className="flex-1"
        >
          <Text className="text-sm font-medium text-primary-foreground">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Text>
        </Button>
      </View>
    ) : (
      <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
        <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
          <Text className="text-sm font-medium">Cancel</Text>
        </Button>
        {hasParsed ? (
          <Button
            glassTintColor="rgb(38, 217, 104)"
            variant="glass"
            onPress={handleImport}
            disabled={!canImport || importMutation.isPending}
            className="flex-1"
          >
            <Text className="text-sm font-medium text-primary-foreground">
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${parsed?.length ?? 0} Var${(parsed?.length ?? 0) === 1 ? '' : 's'}`}
            </Text>
          </Button>
        ) : (
          <Button
            variant="glass"
            onPress={handleParse}
            disabled={rawText.trim().length === 0}
            className="flex-1"
          >
            <Text className="text-sm font-medium">Parse & Preview</Text>
          </Button>
        )}
      </View>
    );

  return (
    <BottomSheet
      ref={sheetRef}
      header={<BottomSheetHeader title="Add Variables" />}
      footer={footer}
    >
      <View className="px-4 pt-4 pb-8 gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="single">
              <Text>Single</Text>
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <Text>Bulk Paste</Text>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <View className="gap-3 pt-2">
              <View>
                <Text className="text-xs font-medium text-muted-foreground mb-1">Name</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="VARIABLE_NAME"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {nameError && (
                  <Text className="text-xs text-destructive mt-1">{nameError}</Text>
                )}
              </View>
              <View>
                <Text className="text-xs font-medium text-muted-foreground mb-1">Value</Text>
                <Input
                  value={value}
                  onChangeText={setValue}
                  placeholder="Enter value..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </TabsContent>

          <TabsContent value="bulk">
            <View className="gap-3 pt-2">
              <Text className="text-sm text-muted-foreground">
                Paste your .env file content below. Each line should follow the format NAME=value.
              </Text>

              <TextInput
                className="bg-card border-border border rounded-lg p-3 text-foreground min-h-[160px]"
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontSize: 13,
                }}
                multiline
                textAlignVertical="top"
                placeholder={'NAME=value\nANOTHER=value2\n# Comments are ignored'}
                placeholderTextColor="#71717a"
                value={rawText}
                onChangeText={(text) => {
                  setRawText(text);
                  if (hasParsed) {
                    setHasParsed(false);
                    setParsed(null);
                    setParseErrors([]);
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {hasParsed && parsed !== null && parsed.length > 0 && (
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <CheckCircle2 size={16} color="#22c55e" />
                    <Text className="text-sm font-medium text-foreground">
                      {parsed.length} valid variable{parsed.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View className="bg-card border-border border rounded-lg overflow-hidden">
                    {parsed.map((v, i) => (
                      <View
                        key={v.name}
                        className={`flex-row items-center px-3 py-2 ${i > 0 ? 'border-t border-border' : ''}`}
                      >
                        <Text
                          className="text-sm font-medium text-foreground flex-1"
                          numberOfLines={1}
                        >
                          {v.name}
                        </Text>
                        <Text
                          className="text-xs text-muted-foreground ml-2 max-w-[50%]"
                          numberOfLines={1}
                        >
                          {v.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {hasParsed && parsed !== null && parsed.length === 0 && parseErrors.length === 0 && (
                <Text className="text-sm text-muted-foreground">
                  No variables found in the input.
                </Text>
              )}

              {hasParsed && parseErrors.length > 0 && (
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={16} color="#ef4444" />
                    <Text className="text-sm font-medium text-destructive">
                      {parseErrors.length} error{parseErrors.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View className="bg-destructive/10 border-destructive/30 border rounded-lg overflow-hidden">
                    {parseErrors.map((e, i) => (
                      <View
                        key={`error-${e.line}`}
                        className={`px-3 py-2 ${i > 0 ? 'border-t border-destructive/20' : ''}`}
                      >
                        <Text className="text-xs text-destructive font-medium">
                          Line {e.line}: {e.error}
                        </Text>
                        <Text
                          className="text-xs text-muted-foreground font-mono mt-0.5"
                          numberOfLines={1}
                        >
                          {e.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </TabsContent>
        </Tabs>
      </View>
    </BottomSheet>
  );
});

EnvVarAddSheet.displayName = 'EnvVarAddSheet';
