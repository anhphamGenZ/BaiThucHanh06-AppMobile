import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { Icon } from '../../../components/Icon';
import { colors, radius, spacing, typography } from '../../../theme';
import { formatLastSeen } from '../../../utils/formatTime';

type ChatHeaderProps = {
  // Tên người kia (chat 1-1) hoặc tên nhóm.
  title: string;
  // Chuỗi cố định để chọn màu avatar (uid hoặc mã nhóm).
  avatarSeed: string;
  // Ảnh đại diện người kia (chat 1-1).
  avatarUri?: string;
  // Chấm xanh trên avatar: người kia online, hoặc trong nhóm có người online.
  online: boolean;
  // Có giá trị khi có người đang gõ, ví dụ "đang soạn tin…" hoặc "An đang soạn tin…".
  typingText?: string;
  // Dòng phụ cố định (nhóm: "2 đang online · 4 thành viên"). Bỏ trống với chat 1-1.
  subtitle?: string;
  // Thời điểm offline của người kia (chat 1-1), để hiện "Hoạt động X phút trước".
  lastSeen?: number | null;
  onBack: () => void;
  // Mở ô tìm tin nhắn.
  onPressSearch?: () => void;
  // Nhóm: nhấn tên để mở màn Thông tin nhóm.
  onPressInfo?: () => void;
};

const LAST_SEEN_REFRESH = 60000;

export function ChatHeader({
  title,
  avatarSeed,
  avatarUri,
  online,
  typingText,
  subtitle,
  lastSeen,
  onBack,
  onPressSearch,
  onPressInfo,
}: ChatHeaderProps) {
  // Vẽ lại mỗi phút để chữ "Hoạt động X phút trước" không bị đứng yên.
  const [, setTick] = useState(0);
  const showLastSeen = !subtitle && !online && !!lastSeen;
  useEffect(() => {
    if (!showLastSeen) {
      return;
    }
    const timer = setInterval(() => setTick(t => t + 1), LAST_SEEN_REFRESH);
    return () => clearInterval(timer);
  }, [showLastSeen]);

  // Chọn dòng trạng thái theo thứ tự ưu tiên: đang gõ > dòng phụ của nhóm > online > lần cuối hoạt động.
  let status = (
    <Text style={typography.caption}>
      {lastSeen ? formatLastSeen(lastSeen) : 'Ngoại tuyến'}
    </Text>
  );
  if (typingText) {
    status = (
      <Text
        style={[typography.caption, styles.typing]}
        accessibilityLiveRegion="polite"
      >
        {typingText}
      </Text>
    );
  } else if (subtitle) {
    status = <Text style={typography.caption}>{subtitle}</Text>;
  } else if (online) {
    status = (
      <Text style={[typography.caption, styles.online]}>Đang hoạt động</Text>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        hitSlop={4}
        style={styles.back}
        onPress={onBack}
      >
        <Icon name="back" size={24} />
      </TouchableOpacity>
      <Avatar
        name={title}
        seed={avatarSeed}
        uri={avatarUri}
        size={42}
        online={online}
        pulse
      />
      {/* Nhóm: nhấn vùng tên để mở Thông tin nhóm. */}
      <TouchableOpacity
        style={styles.texts}
        disabled={!onPressInfo}
        accessibilityRole={onPressInfo ? 'button' : undefined}
        accessibilityHint={onPressInfo ? 'Mở thông tin nhóm' : undefined}
        onPress={onPressInfo}
      >
        <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {status}
      </TouchableOpacity>
      {onPressSearch && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tìm tin nhắn"
          style={styles.action}
          onPress={onPressSearch}
        >
          <Icon name="search" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
      {onPressInfo && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Thông tin nhóm"
          style={styles.action}
          onPress={onPressInfo}
        >
          <Icon name="info" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderWarm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.name,
    fontSize: 17,
    fontWeight: '700',
  },
  online: {
    color: colors.onlineText,
    fontWeight: '700',
  },
  typing: {
    color: colors.primary,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
