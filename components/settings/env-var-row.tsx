import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, EyeOff, MoreVertical, Pencil, Trash2 } from 'lucide-react-native';

interface EnvVarRowProps {
  envVar: { name: string; value: string };
  onEdit: () => void;
  onDelete: () => void;
}

export const EnvVarRow = memo(function EnvVarRow({
  envVar,
  onEdit,
  onDelete,
}: EnvVarRowProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View className="flex-row items-center px-4 py-3">
      <View className="flex-1 mr-2">
        <Text className="text-mobile-secondary font-bold text-foreground">{envVar.name}</Text>
        <Text
          className="text-mobile-caption text-muted-foreground mt-0.5"
          numberOfLines={revealed ? undefined : 1}
        >
          {revealed ? envVar.value : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
        </Text>
      </View>
      <Pressable onPress={() => setRevealed((prev) => !prev)} className="p-2">
        {revealed ? (
          <EyeOff size={20} color="#8B95A5" />
        ) : (
          <Eye size={20} color="#8B95A5" />
        )}
      </Pressable>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable className="p-2">
            <MoreVertical size={20} color="#8B95A5" />
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onPress={onEdit}>
            <Pencil size={16} color="#8B95A5" />
            <Text className="text-mobile-secondary text-foreground">Edit</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={onDelete}>
            <Trash2 size={16} color="#ef4444" />
            <Text className="text-mobile-secondary text-destructive">Delete</Text>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
});
