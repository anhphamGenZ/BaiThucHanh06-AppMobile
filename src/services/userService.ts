import { onValue, ref, update } from 'firebase/database';
import type { Unsubscribe } from '../types/models';
import { db } from './firebase';

// Node users/{uid}: họ tên và ảnh đại diện (URL Cloudinary, tuỳ chọn).
export type UserProfile = { name: string; avatarUrl?: string };

export function subscribeUsers(
  cb: (users: Record<string, UserProfile>) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'users'),
    snap => cb(snap.val() ?? {}),
    () => cb({}),
  );
}

export function subscribeMyProfile(
  uid: string,
  cb: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'users/' + uid),
    snap => cb(snap.val() ?? null),
    () => cb(null),
  );
}

// Cập nhật hồ sơ của chính mình. Danh bạ, Home và Chat đều đang lắng nghe users/*
// nên tên và ảnh mới hiện ngay ở mọi máy, không cần khởi động lại app.
export function updateProfile(
  uid: string,
  name: string,
  avatarUrl: string | null,
): Promise<void> {
  return update(ref(db, 'users/' + uid), { name: name.trim(), avatarUrl });
}
