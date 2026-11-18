import {
  get,
  onValue,
  push,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';
import type {
  AppNotification,
  NotificationType,
  Unsubscribe,
} from '../types/models';
import { db } from './firebase';

const notificationsPath = (uid: string) => 'notifications/' + uid;

function notificationValue(
  type: NotificationType,
  convId: string,
  fromUid: string,
  text: string,
) {
  return {
    type,
    convId,
    fromUid,
    text,
    createdAt: serverTimestamp(),
    read: false,
  };
}

// Đọc activeConv/{uid} của từng người nhận (song song). Lỗi đọc thì coi như không mở chat nào.
export async function getActiveConvs(
  uids: string[],
): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    uids.map(async uid => {
      try {
        const snap = await get(ref(db, 'activeConv/' + uid));
        return [uid, typeof snap.val() === 'string' ? snap.val() : null];
      } catch {
        return [uid, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}

// Thông báo tin mới, gộp một thông báo cho mỗi cuộc trò chuyện (id cố định msg_{convId}).
// Bỏ qua người đang mở đúng cuộc trò chuyện. Trả về các path để ghép vào update() gửi tin.
export function messageNotificationUpdates(
  recipients: string[],
  activeConvs: Record<string, string | null>,
  convId: string,
  fromUid: string,
  text: string,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const uid of recipients) {
    if (uid !== fromUid && activeConvs[uid] !== convId) {
      updates[notificationsPath(uid) + '/msg_' + convId] = notificationValue(
        'message',
        convId,
        fromUid,
        text,
      );
    }
  }
  return updates;
}

// Thông báo riêng lẻ (được thêm vào nhóm, cảm xúc): id lấy từ push().
export function newNotificationUpdate(
  toUid: string,
  type: NotificationType,
  convId: string,
  fromUid: string,
  text: string,
): Record<string, unknown> {
  const key = push(ref(db, notificationsPath(toUid))).key;
  if (!key) {
    return {};
  }
  return {
    [notificationsPath(toUid) + '/' + key]: notificationValue(
      type,
      convId,
      fromUid,
      text,
    ),
  };
}

const TYPES: NotificationType[] = ['message', 'group_added', 'reaction'];

export function subscribeNotifications(
  me: string,
  cb: (notifications: AppNotification[]) => void,
): Unsubscribe {
  return onValue(
    ref(db, notificationsPath(me)),
    snap => {
      const list: AppNotification[] = [];
      snap.forEach(child => {
        const v = child.val();
        if (
          !child.key ||
          !v ||
          !TYPES.includes(v.type) ||
          typeof v.convId !== 'string' ||
          typeof v.createdAt !== 'number'
        ) {
          return;
        }
        list.push({
          id: child.key,
          type: v.type,
          convId: v.convId,
          fromUid: typeof v.fromUid === 'string' ? v.fromUid : '',
          text: typeof v.text === 'string' ? v.text : '',
          createdAt: v.createdAt,
          read: v.read === true,
        });
      });
      cb(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    () => cb([]),
  );
}

export function markNotificationRead(me: string, id: string): Promise<void> {
  return update(ref(db, notificationsPath(me) + '/' + id), { read: true });
}

// Một lệnh update nhiều đường dẫn cho mọi thông báo chưa đọc.
export function markAllNotificationsRead(
  me: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) {
    return Promise.resolve();
  }
  const updates: Record<string, boolean> = {};
  for (const id of ids) {
    updates[notificationsPath(me) + '/' + id + '/read'] = true;
  }
  return update(ref(db), updates);
}
