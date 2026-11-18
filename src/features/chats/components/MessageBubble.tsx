import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon } from '../../../components/Icon';
import { RECALLED_TEXT } from '../../../services/chatService';
import { openInGoogleMaps } from '../../../services/locationService';
import { colors, radius, spacing, typography } from '../../../theme';
import type { Message } from '../../../types/models';
import { formatClock } from '../../../utils/formatTime';
import { ReactionSummary } from './ReactionSummary';

export const IMAGE_BUBBLE_WIDTH = 220;
export const IMAGE_BUBBLE_HEIGHT = 260;

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
  myId: string;
  // Tên người gửi, chỉ truyền trong nhóm với tin của người khác (đầu mỗi chuỗi tin liên tiếp).
  senderName?: string;
  // "Đã gửi", "Đã xem HH:mm" hoặc "Đã xem bởi N người"; chỉ truyền cho tin cuối của mình.
  status?: string;
  // Tên người gửi tin gốc khi tin này là trả lời.
  replyName?: string;
  // Đang được tô sáng (vừa cuộn tới từ trích dẫn hoặc kết quả tìm kiếm).
  highlighted?: boolean;
  onLongPress: (message: Message) => void;
  onPressImage: (url: string) => void;
  // Nhấn vào phần trích dẫn: cuộn tới tin gốc.
  onPressReply: (messageId: string) => void;
};

export function MessageBubble({
  message,
  isMine,
  myId,
  senderName,
  status,
  replyName,
  highlighted = false,
  onLongPress,
  onPressImage,
  onPressReply,
}: MessageBubbleProps) {
  // Tin hệ thống ("A đã tạo nhóm"): dòng chữ nhỏ ở giữa, không có menu nhấn giữ.
  if (message.type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const time = formatClock(message.createdAt);

  // Khung chung: tên người gửi (nhóm) → trích dẫn → bong bóng → cảm xúc → trạng thái Đã gửi/Đã xem.
  const reply = message.replyTo;
  return (
    <View
      style={[
        styles.row,
        isMine ? styles.alignMine : styles.alignOther,
        highlighted && styles.highlighted,
      ]}
    >
      {senderName ? <Text style={styles.sender}>{senderName}</Text> : null}
      {reply && !message.recalled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Trả lời ${replyName ?? ''}: ${
            reply.preview
          }. Nhấn để xem tin gốc`}
          style={styles.quote}
          onPress={() => onPressReply(reply.id)}
        >
          <Text style={styles.quoteName} numberOfLines={1}>
            {replyName ?? 'Tin nhắn'}
          </Text>
          <Text style={styles.quoteText} numberOfLines={2}>
            {reply.preview}
          </Text>
        </Pressable>
      ) : null}
      {renderBody(message, isMine, time, onLongPress, onPressImage)}
      {!message.recalled && (
        <ReactionSummary reactions={message.reactions} myId={myId} />
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

// Phần bong bóng theo loại tin: đã thu hồi, vị trí, ảnh, chữ.
function renderBody(
  message: Message,
  isMine: boolean,
  time: string,
  onLongPress: (message: Message) => void,
  onPressImage: (url: string) => void,
) {
  // Tin đã thu hồi: chữ nghiêng, màu phụ, không mở menu.
  if (message.recalled) {
    return (
      <View style={[styles.bubble, styles.recalled]}>
        <Text style={styles.recalledText}>{RECALLED_TEXT}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    );
  }

  // Tin ảnh: nhấn để xem toàn màn hình, nhấn giữ để mở menu.
  if (message.type === 'image' && message.imageUrl) {
    const url = message.imageUrl;
    return (
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Hình ảnh, nhấn để xem toàn màn hình"
        onPress={() => onPressImage(url)}
        onLongPress={() => onLongPress(message)}
        style={styles.imageFrame}
      >
        <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        <Text style={styles.imageTime}>{time}</Text>
      </Pressable>
    );
  }

  // Tin vị trí: thẻ bản đồ minh hoạ, nhấn để mở Google Maps.
  if (
    message.type === 'location' &&
    message.lat !== undefined &&
    message.lng !== undefined
  ) {
    const point = { lat: message.lat, lng: message.lng };
    return (
      <TouchableOpacity
        accessibilityRole="link"
        accessibilityLabel="Vị trí, nhấn để mở Google Maps, nhấn giữ để mở menu"
        activeOpacity={0.8}
        style={styles.locationCard}
        onPress={() => openInGoogleMaps(point).catch(() => {})}
        onLongPress={() => onLongPress(message)}
      >
        <View style={styles.mapPreview}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Path
              d="M0 30 H240 M0 60 H240 M60 0 V90 M120 0 V90 M180 0 V90"
              stroke={colors.white}
              strokeWidth={1}
              strokeOpacity={0.7}
            />
            <Path
              d="M-10 78 C 50 50, 90 70, 130 40 S 210 20, 250 10"
              stroke={colors.primaryBright}
              strokeWidth={3}
              strokeOpacity={0.45}
              fill="none"
            />
            <Circle
              cx="50%"
              cy="50%"
              r={24}
              fill={colors.primary}
              opacity={0.12}
            />
          </Svg>
          <View style={styles.pin}>
            <Icon name="mapPin" size={22} color={colors.white} />
          </View>
        </View>
        <View style={styles.locationBody}>
          <Text style={styles.locationTitle}>Vị trí hiện tại</Text>
          <Text style={styles.coords}>
            {`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`}
          </Text>
          <View style={styles.locationFooter}>
            <Text style={styles.openMaps}>Nhấn để mở Google Maps</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Tin chữ: nhấn giữ để sao chép, thu hồi, thả cảm xúc.
  return (
    <Pressable
      accessibilityHint="Nhấn giữ để sao chép, thu hồi hoặc thả cảm xúc"
      style={[styles.bubble, isMine ? styles.mine : styles.other]}
      onLongPress={() => onLongPress(message)}
    >
      <Text style={[typography.body, isMine && styles.mineText]}>
        {message.text}
      </Text>
      <Text style={[styles.time, isMine && styles.mineMeta]}>{time}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: '78%',
  },
  alignMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  alignOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  highlighted: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
  },
  quote: {
    maxWidth: '100%',
    marginBottom: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  quoteName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  quoteText: {
    ...typography.caption,
  },
  sender: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  systemRow: {
    alignSelf: 'center',
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  systemText: {
    ...typography.caption,
    textAlign: 'center',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  mine: {
    backgroundColor: colors.bubbleMine,
    borderBottomRightRadius: radius.tail,
  },
  other: {
    backgroundColor: colors.bubbleOther,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderBottomLeftRadius: radius.tail,
  },
  recalled: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  recalledText: {
    ...typography.bodyMuted,
    fontStyle: 'italic',
  },
  mineText: {
    color: colors.bubbleMineText,
  },
  time: {
    ...typography.numeric,
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
    color: colors.textMuted,
  },
  mineMeta: {
    color: colors.bubbleMineMeta,
  },
  status: {
    ...typography.caption,
    marginTop: 2,
  },
  imageFrame: {
    width: IMAGE_BUBBLE_WIDTH,
    height: IMAGE_BUBBLE_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageTime: {
    ...typography.numeric,
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    fontSize: 11,
    color: colors.white,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  locationCard: {
    width: 240,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    overflow: 'hidden',
  },
  mapPreview: {
    height: 90,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderBottomLeftRadius: radius.tail,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationTitle: {
    ...typography.name,
    fontSize: 15,
  },
  coords: {
    ...typography.caption,
    marginTop: 2,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  openMaps: {
    ...typography.caption,
    color: colors.primary,
  },
});
