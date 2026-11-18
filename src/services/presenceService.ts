import {
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from 'firebase/database';
import type { Unsubscribe } from '../types/models';
import { db } from './firebase';

export type Status = { online: boolean; lastChanged: number };

const statusRef = (uid: string) => ref(db, 'status/' + uid);
const offlineValue = () => ({ online: false, lastChanged: serverTimestamp() });

// Mẫu `.info/connected` chính thức. `visible = false` → luôn ghi offline, không ghi online.
// Presence là best-effort nên lỗi ghi bị nuốt để không thành unhandled rejection.
export function startPresence(uid: string, visible: boolean): Unsubscribe {
  return onValue(ref(db, '.info/connected'), snap => {
    if (snap.val() !== true) {
      return;
    }
    if (!visible) {
      set(statusRef(uid), offlineValue()).catch(() => {});
      return;
    }
    onDisconnect(statusRef(uid))
      .set(offlineValue())
      .then(() =>
        set(statusRef(uid), { online: true, lastChanged: serverTimestamp() }),
      )
      .catch(() => {});
  });
}

export function setOffline(uid: string): Promise<void> {
  return set(statusRef(uid), offlineValue());
}

// Ghi online lại khi app quay về tiền cảnh. Kết nối không bị ngắt nên onDisconnect vẫn còn hiệu lực.
export function setOnline(uid: string): Promise<void> {
  return set(statusRef(uid), { online: true, lastChanged: serverTimestamp() });
}

// activeConv/{uid} = cuộc trò chuyện đang mở, để người gửi biết có cần tạo thông báo không.
// Ghi lại mỗi lần kết nối lại, vì onDisconnect đã xoá nó khi app ngắt kết nối.
export function trackActiveConv(uid: string, convId: string): Unsubscribe {
  const target = ref(db, 'activeConv/' + uid);
  const off = onValue(ref(db, '.info/connected'), snap => {
    if (snap.val() !== true) {
      return;
    }
    onDisconnect(target)
      .remove()
      .then(() => set(target, convId))
      .catch(() => {});
  });
  return () => {
    off();
    remove(target).catch(() => {});
    onDisconnect(target)
      .cancel()
      .catch(() => {});
  };
}

export function subscribeStatuses(
  cb: (statuses: Record<string, Status>) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'status'),
    snap => cb(snap.val() ?? {}),
    () => cb({}),
  );
}
