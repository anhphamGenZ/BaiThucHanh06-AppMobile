import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { PressableScale } from '../../../components/PressableScale';
import { PulseDot } from '../../../components/PulseDot';
import { colors, spacing, typography } from '../../../theme';
import type { User } from '../../../types/models';
import { givenName } from '../../../utils/names';

type OnlineStripProps = {
  users: User[];
  onOpen: (peerId: string) => void;
};

// Dải "Đang hoạt động": chạm một avatar để mở chat ngay.
export function OnlineStrip({ users, onOpen }: OnlineStripProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PulseDot size={8} />
        <Text style={typography.overline}>Đang hoạt động · {users.length}</Text>
      </View>
      <FlatList
        horizontal
        data={users}
        keyExtractor={user => user.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Nhắn tin cho ${item.name}, đang hoạt động`}
            style={styles.item}
            onPress={() => onOpen(item.id)}
          >
            <Avatar
              name={item.name}
              seed={item.id}
              uri={item.avatarUrl}
              size={52}
              online
              ring
            />
            <Text style={styles.name} numberOfLines={1}>
              {givenName(item.name)}
            </Text>
          </PressableScale>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  item: {
    width: 76,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  name: {
    ...typography.caption,
    color: colors.text,
    marginTop: 6,
    maxWidth: 68,
  },
});
