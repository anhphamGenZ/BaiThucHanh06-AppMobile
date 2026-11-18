import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { PressableScale } from '../../../components/PressableScale';
import { colors, spacing, typography } from '../../../theme';
import type { Me } from '../../../types/models';
import { givenName } from '../../../utils/names';

type GreetingHeaderProps = {
  me: Me;
  online: boolean;
  onPressProfile: () => void;
};

function greetingFor(hour: number): string {
  if (hour < 5) {
    return 'Khuya rồi';
  }
  if (hour < 11) {
    return 'Chào buổi sáng';
  }
  if (hour < 13) {
    return 'Chào buổi trưa';
  }
  if (hour < 18) {
    return 'Chào buổi chiều';
  }
  if (hour < 22) {
    return 'Chào buổi tối';
  }
  return 'Khuya rồi';
}

export function GreetingHeader({
  me,
  online,
  onPressProfile,
}: GreetingHeaderProps) {
  const greeting = greetingFor(new Date().getHours());

  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <View style={styles.eyebrowRow}>
          <View style={styles.spark} />
          <Text style={styles.eyebrow}>{greeting},</Text>
        </View>
        <Text style={typography.display} numberOfLines={1}>
          {givenName(me.name)}
        </Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Mở cài đặt tài khoản"
        hitSlop={6}
        onPress={onPressProfile}
      >
        <Avatar
          name={me.name}
          seed={me.id}
          uri={me.avatarUrl}
          size={44}
          online={online}
          pulse
        />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  texts: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderBottomLeftRadius: 1,
    backgroundColor: colors.warm,
  },
  eyebrow: {
    ...typography.bodyMuted,
    fontWeight: '600',
  },
});
