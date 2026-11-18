import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { Icon } from '../../../components/Icon';
import { colors, radius, spacing, typography } from '../../../theme';
import type { User } from '../../../types/models';

type SelectableContactItemProps = {
  user: User;
  selected: boolean;
  onToggle: (id: string) => void;
};

// Một dòng trong màn Tạo nhóm: avatar, tên, ô checkbox. Nhấn cả dòng để chọn/bỏ chọn.
function SelectableContactRow({
  user,
  selected,
  onToggle,
}: SelectableContactItemProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={user.name}
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onToggle(user.id)}
    >
      <Avatar
        name={user.name}
        seed={user.id}
        uri={user.avatarUrl}
        size={44}
        online={user.isOnline}
      />
      <Text style={styles.name} numberOfLines={1}>
        {user.name}
      </Text>
      <View style={[styles.box, selected && styles.boxChecked]}>
        {selected && <Icon name="check" size={16} color={colors.white} />}
      </View>
    </Pressable>
  );
}

// memo: chọn một người chỉ vẽ lại đúng dòng đó, không vẽ lại cả danh sách.
export const SelectableContactItem = memo(SelectableContactRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  rowSelected: {
    backgroundColor: colors.primaryMist,
  },
  name: {
    ...typography.name,
    flex: 1,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.offline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
