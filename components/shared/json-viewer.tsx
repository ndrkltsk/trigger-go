import { useState, useCallback, memo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Text } from '@/components/ui/text';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react-native';

interface JsonViewerProps {
  data: unknown;
  title?: string;
  defaultCollapsed?: boolean;
  maxPreviewLines?: number;
}

const LARGE_ARRAY_THRESHOLD = 20;
const LARGE_ARRAY_INITIAL = 10;
const ICON_COLOR = '#8B95A5';

function isExpandable(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === 'object';
}

function formatLeaf(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

function leafColor(value: unknown): string {
  if (value === null) return 'text-orange-400';
  if (typeof value === 'boolean') return 'text-purple-400';
  if (typeof value === 'number') return 'text-blue-400';
  if (typeof value === 'string') return 'text-green-400';
  return 'text-foreground';
}

function summarize(value: unknown): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return `{${keys.length}}`;
  }
  return '';
}

interface JsonNodeProps {
  keyName: string | number | null;
  value: unknown;
  depth: number;
  defaultExpanded?: boolean;
}

const JsonNode = memo(function JsonNode({
  keyName,
  value,
  depth,
  defaultExpanded = false,
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const indent = depth * 16;

  if (!isExpandable(value)) {
    return (
      <View style={{ paddingLeft: indent }} className="flex-row flex-wrap py-0.5">
        {keyName !== null && (
          <Text className="text-xs font-mono text-foreground">
            {typeof keyName === 'number' ? `${keyName}: ` : `"${keyName}": `}
          </Text>
        )}
        <Text className={`text-xs font-mono ${leafColor(value)}`}>
          {formatLeaf(value)}
        </Text>
      </View>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [i, v] as [number, unknown])
    : Object.entries(value as Record<string, unknown>);
  const isLargeArray = isArray && entries.length > LARGE_ARRAY_THRESHOLD;
  const visibleEntries =
    isLargeArray && !showAll ? entries.slice(0, LARGE_ARRAY_INITIAL) : entries;
  const hiddenCount = entries.length - LARGE_ARRAY_INITIAL;

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={{ paddingLeft: indent }}
        className="flex-row items-center py-0.5"
      >
        {expanded ? (
          <ChevronDown size={12} color={ICON_COLOR} />
        ) : (
          <ChevronRight size={12} color={ICON_COLOR} />
        )}
        {keyName !== null && (
          <Text className="text-xs font-mono text-foreground ml-1">
            {typeof keyName === 'number' ? `${keyName}: ` : `"${keyName}": `}
          </Text>
        )}
        {!expanded && (
          <Text className="text-xs font-mono text-muted-foreground ml-0.5">
            {summarize(value)}
          </Text>
        )}
        {expanded && (
          <Text className="text-xs font-mono text-muted-foreground ml-0.5">
            {isArray ? '[' : '{'}
          </Text>
        )}
      </Pressable>
      {expanded && (
        <View>
          {visibleEntries.map(([k, v]) => (
            <JsonNode key={String(k)} keyName={k} value={v} depth={depth + 1} />
          ))}
          {isLargeArray && !showAll && (
            <Pressable
              onPress={() => setShowAll(true)}
              style={{ paddingLeft: (depth + 1) * 16 }}
              className="py-1"
            >
              <Text className="text-xs font-mono text-primary">
                Show {hiddenCount} more...
              </Text>
            </Pressable>
          )}
          <Text
            style={{ paddingLeft: indent + 14 }}
            className="text-xs font-mono text-muted-foreground py-0.5"
          >
            {isArray ? ']' : '}'}
          </Text>
        </View>
      )}
    </View>
  );
});

export function JsonViewer({
  data,
  title,
  defaultCollapsed,
  maxPreviewLines = 5,
}: JsonViewerProps) {
  const formatted = data != null ? JSON.stringify(data, null, 2) : null;
  const lines = formatted?.split('\n') ?? [];
  const isLarge = lines.length > maxPreviewLines;
  const shouldDefaultCollapse = defaultCollapsed ?? isLarge;

  const [open, setOpen] = useState(!shouldDefaultCollapse);
  const [copied, setCopied] = useState(false);

  if (data == null) {
    return (
      <View className="rounded-lg bg-muted/50 px-4 py-3">
        {title && (
          <Text className="text-sm font-semibold text-muted-foreground mb-1">{title}</Text>
        )}
        <Text className="text-sm text-muted-foreground">No data</Text>
      </View>
    );
  }

  const handleCopy = async () => {
    if (formatted) {
      await Clipboard.setStringAsync(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const preview = lines.slice(0, maxPreviewLines).join('\n') + (isLarge ? '\n...' : '');

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <View className="rounded-lg bg-muted/30 dark:bg-[hsl(240,4%,8%)] overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-2">
          <CollapsibleTrigger asChild>
            <Pressable className="flex-row items-center gap-2 flex-1">
              {open ? (
                <ChevronDown size={14} color={ICON_COLOR} />
              ) : (
                <ChevronRight size={14} color={ICON_COLOR} />
              )}
              {title && (
                <Text className="text-sm font-semibold text-foreground">{title}</Text>
              )}
              {!open && (
                <Text className="text-xs text-muted-foreground ml-1">
                  {lines.length} lines
                </Text>
              )}
            </Pressable>
          </CollapsibleTrigger>
          <Pressable onPress={handleCopy} className="p-1">
            {copied ? (
              <Check size={14} color="#22c55e" />
            ) : (
              <Copy size={14} color={ICON_COLOR} />
            )}
          </Pressable>
        </View>

        {!open && (
          <View className="px-4 pb-3">
            <Text className="text-xs font-mono text-muted-foreground" numberOfLines={maxPreviewLines}>
              {preview}
            </Text>
          </View>
        )}

        <CollapsibleContent>
          <ScrollView className="px-4 pb-3" nestedScrollEnabled>
            <JsonNode keyName={null} value={data} depth={0} defaultExpanded />
          </ScrollView>
        </CollapsibleContent>
      </View>
    </Collapsible>
  );
}
