import { Pressable, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

interface RunTagsProps {
  tags: string[];
  onTagPress?: (tag: string) => void;
}

export function RunTags({ tags, onTagPress }: RunTagsProps) {
  if (tags.length === 0) return null;

  return (
    <View className="px-4 py-3">
      <Text className="text-sm font-semibold text-foreground mb-2">Tags</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {tags.map((tag) => {
          const separatorIdx = tag.indexOf('_');
          const hasPrefix = separatorIdx > 0;
          const prefix = hasPrefix ? tag.slice(0, separatorIdx + 1) : '';
          const value = hasPrefix ? tag.slice(separatorIdx + 1) : tag;

          return (
            <Pressable key={tag} onPress={() => onTagPress?.(tag)}>
              <Badge variant="outline" className="px-2 py-0.5">
                <Text className="text-xs text-foreground">
                  {hasPrefix && (
                    <Text className="text-xs text-muted-foreground">{prefix}</Text>
                  )}
                  {value}
                </Text>
              </Badge>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
