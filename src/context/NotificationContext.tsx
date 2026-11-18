import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { navigateWhenReady, navigationRef } from '../navigation/navigationRef';
import { directPeerOf } from '../services/chatService';
import {
  onOpenFromNotification,
  setupLocalNotifications,
  showLocalNotification,
} from '../services/localNotificationService';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../services/notificationService';
import type { AppNotification } from '../types/models';
import { describeNotification } from '../utils/notificationText';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';

type NotificationContextValue = {
  // Thông báo thật từ notifications/{me}, mới nhất trước.
  notifications: AppNotification[];
  unreadCount: number;
  // Công tắc ở Cài đặt: tắt thì ẩn badge và không hiện thông báo hệ thống (chỉ lưu ở máy).
  enabled: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setEnabled: (enabled: boolean) => void;
  // Câu hiển thị đầy đủ của một thông báo (có tên người gửi, tên nhóm).
  describe: (n: AppNotification) => string;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const myId = useAuth().me?.id;
  const { getUser, groups } = useChat();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [enabled, setEnabled] = useState(true);

  // Ghép tiêu đề/nội dung từ dữ liệu thô (tên lấy từ Danh bạ và danh sách nhóm).
  const textOf = useCallback(
    (n: AppNotification) =>
      describeNotification(
        n,
        getUser(n.fromUid)?.name ?? 'Ai đó',
        groups[n.convId]?.name,
      ),
    [getUser, groups],
  );

  // Ref để listener Firebase (đăng ký một lần) luôn đọc giá trị mới nhất.
  const appStateRef = useRef(AppState.currentState);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const textOfRef = useRef(textOf);
  textOfRef.current = textOf;

  // Theo dõi app đang ở tiền cảnh hay nền.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      appStateRef.current = state;
    });
    return () => subscription.remove();
  }, []);

  // Xin quyền thông báo và tạo kênh "Tin nhắn" sau khi đăng nhập.
  useEffect(() => {
    if (myId) {
      setupLocalNotifications().catch(() => {});
    }
  }, [myId]);

  // Lắng nghe notifications/{me}. Khi app ở nền mà có thông báo mới (hoặc thông báo gộp
  // vừa được ghi đè bằng tin mới hơn) thì hiện thông báo hệ thống bằng notifee.
  useEffect(() => {
    if (!myId) {
      setNotifications([]);
      return;
    }
    // id → createdAt đã thấy; null ở lần nhận đầu tiên để không hiện lại thông báo cũ.
    let seen: Map<string, number> | null = null;
    return subscribeNotifications(myId, list => {
      setNotifications(list);
      if (seen && appStateRef.current === 'background' && enabledRef.current) {
        for (const n of list) {
          if (!n.read && seen.get(n.id) !== n.createdAt) {
            const { title, body } = textOfRef.current(n);
            showLocalNotification(title, body, {
              convId: n.convId,
              notifId: n.id,
            }).catch(() => {});
          }
        }
      }
      seen = new Map(list.map(n => [n.id, n.createdAt]));
    });
  }, [myId]);

  // Nhấn thông báo hệ thống: đánh dấu đã đọc rồi mở đúng cuộc trò chuyện.
  useEffect(() => {
    if (!myId) {
      return;
    }
    return onOpenFromNotification(({ convId, notifId }) => {
      markNotificationRead(myId, notifId).catch(() => {});
      const peerId = directPeerOf(convId, myId) ?? undefined;
      navigateWhenReady(() =>
        navigationRef.navigate('ChatDetail', { convId, peerId }),
      );
    });
  }, [myId]);

  // Đánh dấu một thông báo đã đọc trên DB; listener sẽ tự cập nhật danh sách.
  const markRead = useCallback(
    (id: string) => {
      if (myId) {
        markNotificationRead(myId, id).catch(() => {});
      }
    },
    [myId],
  );

  // Đánh dấu mọi thông báo chưa đọc trong một lệnh update nhiều đường dẫn.
  const markAllRead = useCallback(() => {
    if (myId) {
      const ids = notifications.filter(n => !n.read).map(n => n.id);
      markAllNotificationsRead(myId, ids).catch(() => {});
    }
  }, [myId, notifications]);

  // Số thông báo chưa đọc, dùng cho badge tab Thông báo.
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  );

  const describe = useCallback(
    (n: AppNotification) => textOf(n).line,
    [textOf],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      enabled,
      markRead,
      markAllRead,
      setEnabled,
      describe,
    }),
    [notifications, unreadCount, enabled, markRead, markAllRead, describe],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider',
    );
  }
  return value;
}
