import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { HighlightText } from '../../../components/HighlightText';
import { Icon } from '../../../components/Icon';
import { PressableScale } from '../../../components/PressableScale';
import { colors, radius, spacing, typography } from '../../../theme';
import type { User } from '../../../types/models';
import { formatLastSeen } from '../../../utils/formatTime';

type ContactItemProps = {
  user: User;
  query: string;
  unread: number;
  isFirst: boolean;
  isLast: boolean;
  onOpen: (peerId: string) => void;
};

export const ContactItem = memo(function ContactRow({
  user,
  query,
  unread,
  isFirst,
  isLast,
  onOpen,
}: ContactItemProps) {
  const status = user.isOnline
    ? 'Đang hoạt động'
    : user.lastSeen
    ? formatLastSeen(user.lastSeen)
    : 'Ngoại tuyến';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[
        user.name,
        status,
        unread > 0 ? `${unread} tin mới` : null,
        'nhấn để nhắn tin',
      ]
        .filter(Boolean)
        .join(', ')}
      scaleTo={0.985}
      style={[styles.row, isFirst && styles.first, isLast && styles.last]}
      onPress={() => onOpen(user.id)}
    >
      <Avatar
        name={user.name}
        seed={user.id}
        uri={user.avatarUrl}
        size={46}
        online={user.isOnline}
        pulse={user.isOnline}
      />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <HighlightText
            text={user.name}
            query={query}
            style={styles.name}
            numberOfLines={1}
          />
          {unread > 0 && (
            <View style={styles.newPill}>
              <Text style={styles.newText}>
                {unread > 99 ? '99+' : unread} mới
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.status, user.isOnline && styles.statusOnline]}
          numberOfLines={1}
        >
          {status}
        </Text>
      </View>
      <View style={styles.action}>
        <Icon name="chat" size={18} color={colors.primary} />
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 70,
  },
  first: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  last: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.tail,
  },
  body: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.name,
    flexShrink: 1,
  },
  newPill: {
    paddingHorizontal: spacing.sm,
    height: 20,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  newText: {
    ...typography.numeric,
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  status: {
    ...typography.caption,
    marginTop: 3,
  },
  statusOnline: {
    color: colors.onlineText,
    fontWeight: '700',
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderBottomRightRadius: radius.tail,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
