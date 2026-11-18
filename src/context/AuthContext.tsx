import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  login as loginRequest,
  logout as logoutRequest,
  mapAuthError,
  register as registerRequest,
  subscribeAuth,
  type AuthUser,
} from '../services/authService';
import {
  setOffline,
  setOnline,
  startPresence,
} from '../services/presenceService';
import { subscribeMyProfile } from '../services/userService';
import type { Me } from '../types/models';

type AuthContextValue = {
  me: Me | null;
  initializing: boolean;
  showOnline: boolean;
  setShowOnline: (visible: boolean) => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const prefsStorage = createAsyncStorage('chat-prefs');
const showOnlineKey = (uid: string) => 'show-online:' + uid;

type OnlinePref = { uid: string; visible: boolean };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  // Chỉ có giá trị khi đã đọc xong AsyncStorage của đúng uid, để presence không ghi online rồi mới ẩn.
  const [pref, setPref] = useState<OnlinePref | null>(null);

  useEffect(
    () =>
      subscribeAuth(user => {
        try {
          setAuthUser(user);
        } finally {
          setInitializing(false);
        }
      }),
    [],
  );

  const uid = authUser?.uid;
  const email = authUser?.email ?? '';

  useEffect(() => {
    if (!uid) {
      setMe(null);
      setPref(null);
      return;
    }
    return subscribeMyProfile(uid, profile =>
      setMe({
        id: uid,
        email,
        name: profile?.name ?? '',
        avatarUrl: profile?.avatarUrl,
      }),
    );
  }, [uid, email]);

  useEffect(() => {
    if (!uid) {
      return;
    }
    let cancelled = false;
    prefsStorage
      .getItem(showOnlineKey(uid))
      .then(value => {
        if (!cancelled) {
          setPref({ uid, visible: value !== 'false' });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPref({ uid, visible: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const prefReady = pref !== null && pref.uid === uid;
  const showOnline = prefReady ? pref.visible : true;

  useEffect(() => {
    if (!uid || !prefReady) {
      return;
    }
    return startPresence(uid, showOnline);
  }, [uid, prefReady, showOnline]);

  // Ở nền quá 5 giây thì ghi offline (người khác thấy "Hoạt động X phút trước") nhưng GIỮ kết nối,
  // để app vẫn nhận thông báo mới và hiện thông báo hệ thống bằng notifee. Quay lại thì ghi online.
  // Khi app bị tắt hẳn, onDisconnect trên server vẫn tự ghi offline như cũ.
  useEffect(() => {
    if (!uid) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wentOffline = false;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        timer = setTimeout(() => {
          wentOffline = true;
          setOffline(uid).catch(() => {});
        }, 5000);
      } else if (state === 'active') {
        clearTimeout(timer);
        if (wentOffline && showOnline) {
          setOnline(uid).catch(() => {});
        }
        wentOffline = false;
      }
    });
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [uid, showOnline]);

  const setShowOnline = useCallback(
    (visible: boolean) => {
      if (!uid) {
        return;
      }
      setPref({ uid, visible });
      prefsStorage.setItem(showOnlineKey(uid), String(visible)).catch(() => {});
    },
    [uid],
  );

  const login = useCallback(async (emailInput: string, password: string) => {
    try {
      await loginRequest(emailInput, password);
      return null;
    } catch (error) {
      return mapAuthError(error);
    }
  }, []);

  const register = useCallback(
    async (name: string, emailInput: string, password: string) => {
      try {
        await registerRequest(name, emailInput, password);
        return null;
      } catch (error) {
        return mapAuthError(error);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (uid) {
      await logoutRequest(uid);
    }
  }, [uid]);

  const value = useMemo(
    () => ({
      me,
      // Giữ màn chờ tới khi biết có đăng nhập hay không và đã đọc xong hồ sơ, để không nháy màn Đăng nhập.
      initializing: initializing || (authUser !== null && me === null),
      showOnline,
      setShowOnline,
      login,
      register,
      logout,
    }),
    [
      me,
      authUser,
      initializing,
      showOnline,
      setShowOnline,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
