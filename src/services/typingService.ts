import { onDisconnect, onValue, ref, remove, set } from 'firebase/database';
import type { Unsubscribe } from '../types/models';
import { db } from './firebase';

const typingRef = (convId: string, uid: string) =>
  ref(db, 'typing/' + convId + '/' + uid);

// Đăng ký onDisconnect trước khi bật để app bị tắt đột ngột cũng không kẹt "đang soạn tin".
export async function setTyping(
  convId: string,
  me: string,
  on: boolean,
): Promise<void> {
  const target = typingRef(convId, me);
  if (on) {
    await onDisconnect(target).remove();
    await set(target, true);
    return;
  }
  await remove(target);
  await onDisconnect(target).cancel();
}

// Danh sách uid đang gõ, không tính chính mình.
export function subscribeTyping(
  convId: string,
  me: string,
  cb: (uids: string[]) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'typing/' + convId),
    snap => {
      const uids: string[] = [];
      snap.forEach(child => {
        if (child.key && child.key !== me && child.val() === true) {
          uids.push(child.key);
        }
      });
      cb(uids);
    },
    () => cb([]),
  );
}
