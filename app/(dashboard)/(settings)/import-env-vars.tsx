import React, { useState, useCallback } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ContentContainer } from '@/components/layout';
import { useImportEnvVars } from '@/hooks/api/use-envvars';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore, type Environment } from '@/stores/preferences-store';
import type { EnvType } from '@/services/api/envvars';
import { useToast } from '@/stores/toast-store';
import { parseEnvFile, type EnvVariable, type EnvParseError } from '@/lib/env-parser';

export default function ImportEnvVarsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);
  const importMutation = useImportEnvVars();

  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<EnvVariable[] | null>(null);
  const [parseErrors, setParseErrors] = useState<EnvParseError[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

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
      showToast({ type: 'success', title: `${parsed.length} variable${parsed.length === 1 ? '' : 's'} imported` });
      router.back();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', title: 'Failed to import variables' });
    }
  }, [projectRef, env, parsed, importMutation, showToast, router]);

  const canImport = hasParsed && parsed !== null && parsed.length > 0 && parseErrors.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <Stack.Screen options={{ title: 'Import Variables' }} />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ContentContainer variant="reading">
        <View className="p-4 tablet:p-8 gap-4">
          <Text className="text-sm text-muted-foreground">
            Paste your .env file content below. Each line should follow the format NAME=value.
          </Text>

          <TextInput
            className="bg-card border-border border rounded-lg p-3 text-foreground min-h-[200px]"
            style={{ fontFamily: process.env.EXPO_OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 }}
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

          <Button variant="outline" onPress={handleParse} disabled={rawText.trim().length === 0}>
            <Text>Parse & Preview</Text>
          </Button>

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
                    <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground ml-2 max-w-[50%]" numberOfLines={1}>
                      {v.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {hasParsed && parsed !== null && parsed.length === 0 && parseErrors.length === 0 && (
            <Text className="text-sm text-muted-foreground">No variables found in the input.</Text>
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
                    <Text className="text-xs text-muted-foreground font-mono mt-0.5" numberOfLines={1}>
                      {e.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {hasParsed && (
            <Button
              onPress={handleImport}
              disabled={!canImport || importMutation.isPending}
            >
              <Upload size={16} color="white" />
              <Text>
                {importMutation.isPending
                  ? 'Importing...'
                  : `Import ${parsed?.length ?? 0} Variable${(parsed?.length ?? 0) === 1 ? '' : 's'}`}
              </Text>
            </Button>
          )}
        </View>
        </ContentContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
