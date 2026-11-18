import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { colors, radius, spacing } from '../../../theme';

type ImageViewerModalProps = {
  // URL ảnh đang xem; null thì đóng.
  url: string | null;
  onClose: () => void;
};

// Xem ảnh toàn màn hình: nền đen, ảnh vừa khung (contain), nút đóng góc trên.
export function ImageViewerModal({ url, onClose }: ImageViewerModalProps) {
  const reduced = useReducedMotion();

  return (
    <Modal
      visible={url !== null}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {url ? (
          <Image
            source={{ uri: url }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Ảnh toàn màn hình"
          />
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Đóng ảnh"
          style={styles.close}
          onPress={onClose}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassOnPrimary,
  },
});
