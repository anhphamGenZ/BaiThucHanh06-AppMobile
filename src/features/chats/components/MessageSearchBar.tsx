import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HighlightText } from '../../../components/HighlightText';
import { Icon } from '../../../components/Icon';
import { colors, radius, spacing, typography } from '../../../theme';
import type { Message } from '../../../types/models';
import { formatTime } from '../../../utils/formatTime';
import { matchesFolded } from '../../../utils/textSearch';

type MessageSearchBarProps = {
  // Toàn bộ tin của cuộc trò chuyện; null khi đang tải.
  messages: Message[] | null;
  nameOf: (uid: string) => string;
  onSelect: (messageId: string) => void;
  onClose: () => void;
};

// Tìm nội dung tin nhắn trong một cuộc trò chuyện (Phần C).
// Lọc không phân biệt dấu và hoa thường, bỏ tin đã thu hồi và tin không có chữ.
// Nhấn một kết quả thì màn chat cuộn tới đúng tin đó.
export function MessageSearchBar({
  messages,
  nameOf,
  onSelect,
  onClose,
}: MessageSearchBarProps) {
  const [query, setQuery] = useState('');

  // Kết quả khớp, mới nhất trước.
  const results = useMemo(() => {
    if (!messages || query.trim() === '') {
      return [];
    }
    return messages
      .filter(
        m =>
          !m.recalled &&
          m.type === 'text' &&
          !!m.text &&
          matchesFolded(m.text, query),
      )
      .reverse();
  }, [messages, query]);

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm + nút đóng. */}
      <View style={styles.bar}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Tìm trong cuộc trò chuyện"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Tìm tin nhắn"
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Đóng tìm kiếm"
          style={styles.close}
          onPress={onClose}
        >
          <Icon name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Danh sách kết quả. */}
      {messages === null ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={m => m.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            query.trim() !== '' ? (
              <Text style={styles.count}>{`${results.length} kết quả`}</Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.result}
              onPress={() => onSelect(item.id)}
            >
              <View style={styles.resultHead}>
                <Text style={styles.sender} numberOfLines={1}>
                  {nameOf(item.senderId)}
                </Text>
                <Text style={typography.caption}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
              <HighlightText
                text={item.text ?? ''}
                query={query}
                style={typography.body}
                numberOfLines={2}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingLeft: spacing.lg,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    marginTop: spacing.xl,
  },
  count: {
    ...typography.caption,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  result: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderWarm,
  },
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sender: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
  },
});
