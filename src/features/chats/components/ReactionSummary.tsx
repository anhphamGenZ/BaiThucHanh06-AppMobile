import { StyleSheet, Text, View } from 'react-native';
import { REACTIONS } from '../../../services/chatService';
import { colors, radius, spacing, typography } from '../../../theme';

type ReactionSummaryProps = {
  reactions: Record<string, string>;
  myId: string;
};

// Gom cảm xúc theo emoji, theo thứ tự cố định của menu, kèm số người thả.
export function ReactionSummary({ reactions, myId }: ReactionSummaryProps) {
  // Đếm số người theo từng emoji.
  const counts = new Map<string, number>();
  for (const emoji of Object.values(reactions)) {
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  if (counts.size === 0) {
    return null;
  }
  // Sắp theo thứ tự trong menu (👍 ❤️ 😂 😮 😢) để mọi máy hiển thị giống nhau.
  const order: string[] = [...REACTIONS];
  const groups = [...counts.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  );
  const mine = reactions[myId];

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        'Cảm xúc: ' +
        groups.map(([emoji, count]) => `${emoji} ${count}`).join(', ')
      }
    >
      {groups.map(([emoji, count]) => (
        <View
          key={emoji}
          // Emoji mình đã thả được tô màu teal.
          style={[styles.chip, emoji === mine && styles.chipMine]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          {count > 1 && <Text style={styles.count}>{count}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  chipMine: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 13,
  },
  count: {
    ...typography.caption,
    ...typography.numeric,
    color: colors.text,
  },
});
