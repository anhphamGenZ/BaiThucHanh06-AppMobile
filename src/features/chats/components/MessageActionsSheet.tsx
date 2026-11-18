import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { REACTIONS } from '../../../services/chatService';
import { colors, radius, spacing, typography } from '../../../theme';
import type { Message } from '../../../types/models';

type MessageActionsSheetProps = {
  message: Message | undefined;
  myId: string;
  onClose: () => void;
  onReact: (message: Message, emoji: string) => void;
  onCopy: (message: Message) => void;
  onRecall: (message: Message) => void;
  onReply: (message: Message) => void;
};

// Menu nhấn giữ một tin: hàng 5 cảm xúc, Trả lời, Sao chép (tin chữ), Thu hồi (tin của mình), Huỷ.
// Tin đã thu hồi thì không mở menu.
export function MessageActionsSheet({
  message,
  myId,
  onClose,
  onReact,
  onCopy,
  onRecall,
  onReply,
}: MessageActionsSheetProps) {
  const reduced = useReducedMotion();
  const visible = message !== undefined && !message.recalled;
  const myReaction = message?.reactions[myId];
  // Chỉ tin chữ mới sao chép được; chỉ người gửi mới thấy Thu hồi.
  const canCopy = message?.type === 'text';
  const canRecall = message?.senderId === myId;

  // Đóng menu trước rồi mới chạy thao tác, để Alert không bị Modal che.
  const run = (action: (m: Message) => void) => () => {
    if (message) {
      onClose();
      action(message);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Nhấn vùng tối phía trên để đóng menu. */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Đóng menu"
      >
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Hàng cảm xúc: emoji đang chọn được tô viền, nhấn lại để gỡ. */}
          <View style={styles.reactions}>
            {REACTIONS.map(emoji => (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                accessibilityLabel={
                  emoji === myReaction ? `Gỡ cảm xúc ${emoji}` : `Thả ${emoji}`
                }
                accessibilityState={{ selected: emoji === myReaction }}
                style={[
                  styles.emojiButton,
                  emoji === myReaction && styles.emojiSelected,
                ]}
                onPress={run(m => onReact(m, emoji))}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          {/* Trả lời trích dẫn tin này. */}
          <Pressable
            accessibilityRole="button"
            style={styles.action}
            onPress={run(onReply)}
          >
            <Text style={styles.actionText}>Trả lời</Text>
          </Pressable>
          {canCopy && (
            <Pressable
              accessibilityRole="button"
              style={styles.action}
              onPress={run(onCopy)}
            >
              <Text style={styles.actionText}>Sao chép</Text>
            </Pressable>
          )}
          {canRecall && (
            <Pressable
              accessibilityRole="button"
              style={styles.action}
              onPress={run(onRecall)}
            >
              <Text style={[styles.actionText, styles.danger]}>Thu hồi</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            style={styles.action}
            onPress={onClose}
          >
            <Text style={[styles.actionText, styles.cancel]}>Huỷ</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  emojiSelected: {
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 26,
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderWarm,
  },
  actionText: {
    ...typography.name,
  },
  danger: {
    color: colors.danger,
  },
  cancel: {
    color: colors.textMuted,
  },
});
