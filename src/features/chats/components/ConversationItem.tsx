import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { HighlightText } from '../../../components/HighlightText';
import { PressableScale } from '../../../components/PressableScale';
import { colors, radius, spacing, typography } from '../../../theme';
import type { UserChat } from '../../../types/models';
import { formatTime } from '../../../utils/formatTime';
import { UnreadBadge } from './UnreadBadge';

type ConversationItemProps = {
  // Tên người kia (chat 1-1) hoặc tên nhóm.
  title: string;
  // Chuỗi cố định để chọn màu avatar (uid hoặc mã nhóm).
  avatarSeed: string;
  // Ảnh đại diện người kia (chat 1-1); nhóm không có ảnh.
  avatarUri?: string;
  // Chấm xanh: người kia online, hoặc trong nhóm có người online.
  online: boolean;
  isGroup: boolean;
  conversation: UserChat;
  // Tiền tố trước tin cuối: "Bạn: " hoặc tên người gửi trong nhóm ("An: ").
  senderPrefix: string;
  onPress: () => void;
  query?: string;
  isFirst?: boolean;
  isLast?: boolean;
};

// Một dòng ở Home: avatar, tên, tin cuối, thời gian, số chưa đọc.
export function ConversationItem({
  title,
  avatarSeed,
  avatarUri,
  online,
  isGroup,
  conversation,
  senderPrefix,
  onPress,
  query = '',
  isFirst = false,
  isLast = false,
}: ConversationItemProps) {
  const unread = conversation.unread;
  const hasUnread = unread > 0;
  // lastMessage đã là chuỗi xem trước theo loại tin: "📷 Hình ảnh", "📍 Vị trí", nội dung chữ...
  const preview = conversation.lastMessage;
  const isRecalled = conversation.lastType === 'recalled';
  // Tin hệ thống ("A đã tạo nhóm") đã có tên người làm nên không thêm tiền tố.
  const prefix = conversation.lastType === 'system' ? '' : senderPrefix;
  const time = formatTime(conversation.updatedAt);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[
        isGroup ? `Nhóm ${title}` : `Trò chuyện với ${title}`,
        online ? 'đang hoạt động' : null,
        hasUnread ? `${unread} tin chưa đọc` : null,
        `${prefix}${preview}`,
        time,
      ]
        .filter(Boolean)
        .join(', ')}
      scaleTo={0.985}
      style={[
        styles.row,
        hasUnread && styles.rowUnread,
        isFirst && styles.first,
        isLast && styles.last,
      ]}
      onPress={onPress}
    >
      {hasUnread && <View style={styles.signal} />}
      <Avatar
        name={title}
        seed={avatarSeed}
        uri={avatarUri}
        size={52}
        online={online}
      />
      <View style={styles.middle}>
        <HighlightText
          text={title}
          query={query}
          style={[styles.name, hasUnread && styles.nameUnread]}
          numberOfLines={1}
        />
        <View style={styles.previewRow}>
          {prefix !== '' && <Text style={styles.mine}>{prefix}</Text>}
          <HighlightText
            text={preview}
            query={query}
            style={[
              styles.message,
              hasUnread && styles.messageUnread,
              isRecalled && styles.messageRecalled,
            ]}
            numberOfLines={1}
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, hasUnread && styles.timeUnread]}>
          {time}
        </Text>
        <UnreadBadge count={unread} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    minHeight: 76,
  },
  rowUnread: {
    backgroundColor: colors.primaryMist,
  },
  first: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  last: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.tail,
  },
  signal: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
  },
  middle: {
    flex: 1,
  },
  name: {
    ...typography.name,
  },
  nameUnread: {
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  mine: {
    ...typography.bodyMuted,
    fontWeight: '600',
  },
  message: {
    ...typography.bodyMuted,
    flexShrink: 1,
  },
  messageUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  messageRecalled: {
    fontStyle: 'italic',
  },
  right: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 6,
  },
  time: {
    ...typography.caption,
    ...typography.numeric,
  },
  timeUnread: {
    color: colors.primary,
    fontWeight: '700',
  },
});
