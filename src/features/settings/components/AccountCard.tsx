import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import {
  colors,
  radius,
  shadowCard,
  spacing,
  typography,
} from '../../../theme';
import type { Me } from '../../../types/models';

type AccountCardProps = {
  me: Me;
  online: boolean;
};

export function AccountCard({ me, online }: AccountCardProps) {
  return (
    <View style={styles.card}>
      <Avatar
        name={me.name}
        seed={me.id}
        uri={me.avatarUrl}
        size={80}
        online={online}
        pulse
      />
      <Text style={styles.name}>{me.name}</Text>
      <Text style={typography.bodyMuted}>{me.email}</Text>
      <View style={[styles.pill, online ? styles.pillOn : styles.pillOff]}>
        <Text style={[styles.pillText, online ? styles.pillTextOn : null]}>
          {online ? 'Đang hoạt động' : 'Đang ẩn trạng thái'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderBottomLeftRadius: radius.tail,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    ...shadowCard,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  pill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillOn: {
    backgroundColor: colors.primarySoft,
  },
  pillOff: {
    backgroundColor: colors.background,
  },
  pillText: {
    ...typography.caption,
  },
  pillTextOn: {
    color: colors.onlineText,
    fontWeight: '700',
  },
});
