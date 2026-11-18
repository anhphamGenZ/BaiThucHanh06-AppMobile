import notifee, {
  AndroidImportance,
  EventType,
  type Event,
} from '@notifee/react-native';
import type { Unsubscribe } from '../types/models';

// Thông báo cục bộ bằng notifee (Phần C).
// Giới hạn: không có FCM/Cloud Functions (gói Spark) nên chỉ hiện được khi tiến trình app
// còn sống ở nền. App bị tắt hẳn thì không có thông báo.

const CHANNEL_ID = 'messages';

// Thông tin kèm theo thông báo để biết mở chat nào khi người dùng nhấn vào.
export type OpenTarget = { convId: string; notifId: string };

// Nhấn thông báo khi màn hình chưa sẵn sàng nhận (app vừa quay lại) thì giữ tạm ở đây.
let pendingOpen: OpenTarget | null = null;
let openListener: ((target: OpenTarget) => void) | null = null;
let initialChecked = false;

// Xin quyền POST_NOTIFICATIONS (Android 13+) và tạo kênh "Tin nhắn". Gọi một lần sau khi đăng nhập.
export async function setupLocalNotifications(): Promise<void> {
  await notifee.requestPermission();
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Tin nhắn',
    importance: AndroidImportance.HIGH,
  });
}

// Hiện một thông báo hệ thống. Dùng id của thông báo trong DB làm id,
// nên thông báo gộp "msg_{convId}" ghi đè lên thông báo cũ của cùng cuộc trò chuyện.
export async function showLocalNotification(
  title: string,
  body: string,
  target: OpenTarget,
): Promise<void> {
  await notifee.displayNotification({
    id: target.notifId,
    title,
    body,
    data: target,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

// Lấy convId/notifId từ sự kiện notifee.
function targetOf(
  data: Record<string, unknown> | undefined,
): OpenTarget | null {
  return typeof data?.convId === 'string' && typeof data?.notifId === 'string'
    ? { convId: data.convId, notifId: data.notifId }
    : null;
}

// Giao yêu cầu mở chat cho màn hình, hoặc giữ lại nếu chưa ai đăng ký nhận.
function deliver(target: OpenTarget) {
  if (openListener) {
    openListener(target);
  } else {
    pendingOpen = target;
  }
}

// Gọi từ index.js qua notifee.onBackgroundEvent: người dùng nhấn thông báo khi app đang ở nền.
export async function handleBackgroundEvent(event: Event): Promise<void> {
  if (event.type === EventType.PRESS) {
    const target = targetOf(event.detail.notification?.data);
    if (target) {
      deliver(target);
    }
  }
}

// Đăng ký nhận yêu cầu "mở chat từ thông báo" (nhấn khi app ở tiền cảnh, ở nền, hoặc app được mở từ thông báo).
export function onOpenFromNotification(
  listener: (target: OpenTarget) => void,
): Unsubscribe {
  openListener = listener;

  // Yêu cầu đến trước khi đăng ký.
  if (pendingOpen) {
    const target = pendingOpen;
    pendingOpen = null;
    listener(target);
  }

  // App được khởi động bằng cách nhấn thông báo (chỉ kiểm tra một lần mỗi phiên).
  if (!initialChecked) {
    initialChecked = true;
    notifee
      .getInitialNotification()
      .then(initial => {
        const target = targetOf(initial?.notification.data);
        if (target) {
          listener(target);
        }
      })
      .catch(() => {});
  }

  // Nhấn thông báo khi app đang mở.
  const off = notifee.onForegroundEvent(event => {
    if (event.type === EventType.PRESS) {
      const target = targetOf(event.detail.notification?.data);
      if (target) {
        listener(target);
      }
    }
  });

  return () => {
    off();
    if (openListener === listener) {
      openListener = null;
    }
  };
}
