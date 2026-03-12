import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { isValidSecretKeyFormat } from '@/lib/validation';
import { scheduleKeys } from '@/hooks/api/use-schedules';
import { deploymentKeys } from '@/hooks/api/use-deployments';
import { ENV_FULL_LABELS as ENV_LABELS, ENV_DOT_COLORS } from '@/lib/environment';

export function maskKey(key: string): string {
  if (key.length <= 10) return key;
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-3);
  return `${prefix}****${suffix}`;
}

export function SecretKeyRow({ env }: { env: Environment }) {
  const currentKey = useSecretKeysStore((s) => s.keys[env]);
  const { setSecretKey, removeSecretKey } = useSecretKeysStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('Key cannot be empty');
      return;
    }
    if (!isValidSecretKeyFormat(trimmed, env)) {
      setError(`Key must start with the correct prefix for ${env}`);
      return;
    }
    await setSecretKey(env, trimmed);
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    queryClient.invalidateQueries({ queryKey: deploymentKeys.all });
    setIsEditing(false);
    setInputValue('');
    setError(null);
  };

  const handleRemove = async () => {
    await removeSecretKey(env);
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    queryClient.invalidateQueries({ queryKey: deploymentKeys.all });
    setIsEditing(false);
    setInputValue('');
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
    setError(null);
  };

  return (
    <View className="px-4 py-3">
      <Pressable
        onPress={() => {
          if (!isEditing) {
            setIsEditing(true);
            setInputValue('');
          }
        }}
        className="flex-row items-center gap-3"
        disabled={isEditing}
      >
        <View className={`w-2.5 h-2.5 rounded-full ${ENV_DOT_COLORS[env]}`} />
        <View className="flex-1">
          <Text className="text-mobile-secondary text-foreground font-medium">
            {ENV_LABELS[env]}
          </Text>
          {!isEditing && (
            <Text className={`text-mobile-caption mt-0.5 ${currentKey ? 'text-foreground' : 'text-muted-foreground'}`}>
              {currentKey ? maskKey(currentKey) : 'Not configured'}
            </Text>
          )}
        </View>
      </Pressable>

      {isEditing && (
        <View className="mt-3 gap-2">
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                value={inputValue}
                onChangeText={(text) => {
                  setInputValue(text);
                  setError(null);
                }}
                placeholder={currentKey ? maskKey(currentKey) : `Enter secret key for ${env}`}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showKey}
              />
            </View>
            <Pressable onPress={() => setShowKey(!showKey)} className="p-2">
              {showKey ? (
                <EyeOff size={18} color="#a1a1aa" />
              ) : (
                <Eye size={18} color="#a1a1aa" />
              )}
            </Pressable>
          </View>
          {error && (
            <Text className="text-xs text-destructive">{error}</Text>
          )}
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              onPress={handleCancel}
              className="flex-1 h-8"
            >
              <Text className="text-xs font-medium">Cancel</Text>
            </Button>
            {currentKey && (
              <Button
                variant="outline"
                onPress={handleRemove}
                className="h-8 border-destructive/30"
              >
                <Trash2 size={14} color="#EF4444" />
              </Button>
            )}
            <Button
              variant="outline"
              onPress={handleSave}
              className="flex-1 h-8"
            >
              <View className="flex-row items-center gap-1">
                <Check size={14} color="#22C55E" />
                <Text className="text-xs font-medium">Save</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
