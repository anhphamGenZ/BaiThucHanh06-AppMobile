import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import type { Unsubscribe } from '../types/models';
import { auth, db } from './firebase';
import { setOffline } from './presenceService';

export type AuthUser = { uid: string; email: string | null };

const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
];

// Tên chỉ lấy từ users/{uid} (không dùng updateProfile) để không race với onAuthStateChanged.
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  await set(ref(db, 'users/' + user.uid), { name: name.trim() });
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout(uid: string): Promise<void> {
  // Không await: ghi RTDB chỉ resolve khi server xác nhận, mất mạng sẽ treo.
  // onDisconnect đã đăng ký trên server vẫn là lưới an toàn.
  setOffline(uid).catch(() => {});
  await signOut(auth);
}

export function subscribeAuth(
  cb: (user: AuthUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, user =>
    cb(user ? { uid: user.uid, email: user.email } : null),
  );
}

export function mapAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
  if (INVALID_CREDENTIAL_CODES.includes(code)) {
    return 'Email hoặc mật khẩu không đúng';
  }
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email đã được sử dụng';
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/weak-password':
      return 'Mật khẩu tối thiểu 6 ký tự';
    case 'auth/network-request-failed':
      return 'Không có kết nối mạng';
    case 'auth/too-many-requests':
      return 'Thử sai quá nhiều lần, vui lòng thử lại sau';
    default:
      return 'Đã có lỗi xảy ra, vui lòng thử lại';
  }
}
