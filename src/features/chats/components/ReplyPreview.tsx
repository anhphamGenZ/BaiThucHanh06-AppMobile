import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { colors, radius, spacing, typography } from '../../../theme';

type ReplyPreviewProps = {
  // Tên người gửi tin đang được trả lời.
  name: string;
  // Đoạn xem trước của tin đó.
  preview: string;
  onCancel: () => void;
};

// Dải "Đang trả lời ..." nằm ngay trên ô nhập tin, có nút huỷ.
export function ReplyPreview({ name, preview, onCancel }: ReplyPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {`Đang trả lời ${name}`}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Huỷ trả lời"
        style={styles.close}
        onPress={onCancel}
      >
        <Icon name="close" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryMist,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderWarm,
  },
  bar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  texts: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
