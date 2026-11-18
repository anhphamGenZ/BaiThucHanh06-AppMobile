import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '../../../components/Icon';
import { colors, radius, shadowGlow, spacing } from '../../../theme';

type MessageInputProps = {
  onSend: (text: string) => void;
  onSendLocation: () => void;
  // Mở lựa chọn "Chụp ảnh" / "Chọn từ thư viện".
  onPickImage: () => void;
  locating: boolean;
  // Gọi mỗi khi nội dung ô nhập đổi, để bật/tắt "đang soạn tin".
  onTyping?: (text: string) => void;
};

// Thanh nhập tin: [vị trí] [ảnh] [ô nhập] [gửi].
export function MessageInput({
  onSend,
  onSendLocation,
  onPickImage,
  locating,
  onTyping,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Gửi vị trí: hiện vòng loading trong lúc lấy toạ độ GPS. */}
      <TouchableOpacity
        style={styles.tool}
        disabled={locating}
        accessibilityRole="button"
        accessibilityLabel="Gửi vị trí"
        onPress={onSendLocation}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name="mapPin" size={22} color={colors.primary} />
        )}
      </TouchableOpacity>

      {/* Gửi ảnh: chụp mới hoặc chọn từ thư viện. */}
      <TouchableOpacity
        style={styles.tool}
        accessibilityRole="button"
        accessibilityLabel="Gửi ảnh"
        onPress={onPickImage}
      >
        <Icon name="camera" size={22} color={colors.primary} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={next => {
          setText(next);
          onTyping?.(next);
        }}
        multiline
        maxLength={1000}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Ô nhập tin nhắn"
      />

      {/* Gửi tin chữ rồi xoá ô nhập. */}
      <TouchableOpacity
        style={[styles.send, canSend ? styles.sendActive : styles.sendIdle]}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Gửi"
        onPress={() => {
          onSend(text);
          setText('');
        }}
      >
        <Icon name="send" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderWarm,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderBottomLeftRadius: radius.tail,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderBottomRightRadius: radius.tail,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
    ...shadowGlow,
  },
  sendIdle: {
    backgroundColor: colors.border,
  },
});
