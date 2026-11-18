import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import type { MainTabScreenProps } from '../../navigation/types';
import { directPeerOf } from '../../services/chatService';
import { colors } from '../../theme';
import type { AppNotification } from '../../types/models';
import { NotificationItem } from './components/NotificationItem';

function Separator() {
  return <View style={styles.separator} />;
}

export function NotificationsScreen({
  navigation,
}: MainTabScreenProps<'Notifications'>) {
  const myId = useAuth().me?.id;
  // Danh sách đã được sắp mới nhất trước trong notificationService.
  // describe() ghép câu hiển thị (tên người gửi, tên nhóm) từ dữ liệu thô.
  const { notifications, unreadCount, markRead, markAllRead, describe } =
    useNotifications();

  // Nhấn một thông báo: đánh dấu đã đọc rồi mở đúng cuộc trò chuyện.
  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    const peerId = myId ? directPeerOf(n.convId, myId) : null;
    navigation.navigate('ChatDetail', {
      convId: n.convId,
      peerId: peerId ?? undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Thông báo"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} thông báo chưa đọc`
            : 'Không có thông báo mới'
        }
        right={
          // Đánh dấu tất cả đã đọc (một lệnh update nhiều đường dẫn).
          <TouchableOpacity
            accessibilityRole="button"
            disabled={unreadCount === 0}
            onPress={markAllRead}
            style={[styles.markAll, unreadCount === 0 && styles.disabled]}
          >
            <Icon name="check" size={18} color={colors.primary} />
            <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            content={describe(item)}
            onPress={() => openNotification(item)}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="Chưa có thông báo"
            message="Tin nhắn mới, lời mời vào nhóm và cảm xúc sẽ xuất hiện ở đây."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  disabled: {
    opacity: 0.4,
  },
  markAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
