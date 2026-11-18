import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme';
import type { LocalImage } from '../../../services/uploadService';
import { IMAGE_BUBBLE_HEIGHT, IMAGE_BUBBLE_WIDTH } from './MessageBubble';

// Ảnh đang tải lên Cloudinary. Chỉ nằm trong state của màn chat, không ghi vào DB.
export type PendingImage = {
  localId: string;
  image: LocalImage;
  status: 'uploading' | 'failed';
};

type PendingImageBubbleProps = {
  item: PendingImage;
  onRetry: (localId: string) => void;
  onCancel: (localId: string) => void;
};

// Bong bóng tạm: ảnh xem trước mờ + vòng loading khi đang tải; lỗi thì có nút "Thử lại" và "Bỏ".
export function PendingImageBubble({
  item,
  onRetry,
  onCancel,
}: PendingImageBubbleProps) {
  const failed = item.status === 'failed';

  return (
    <View style={styles.frame}>
      <Image
        source={{ uri: item.image.uri }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        {failed ? (
          <>
            <Text style={styles.error}>Tải ảnh thất bại</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.retry}
              onPress={() => onRetry(item.localId)}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.cancel}
              onPress={() => onCancel(item.localId)}
            >
              <Text style={styles.cancelText}>Bỏ</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={styles.uploading}>Đang gửi ảnh…</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'flex-end',
    width: IMAGE_BUBBLE_WIDTH,
    height: IMAGE_BUBBLE_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.overlay,
  },
  uploading: {
    ...typography.caption,
    color: colors.white,
  },
  error: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  retry: {
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    ...typography.name,
    color: colors.white,
  },
  cancel: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.caption,
    color: colors.white,
  },
});
