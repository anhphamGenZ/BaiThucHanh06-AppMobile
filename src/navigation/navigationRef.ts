import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Ref của NavigationContainer, để điều hướng từ nơi không có prop navigation
// (ví dụ khi người dùng nhấn vào thông báo hệ thống).
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Điều hướng khi NavigationContainer đã sẵn sàng; chưa sẵn sàng (app vừa mở) thì thử lại vài lần.
export function navigateWhenReady(
  action: () => void,
  attempts = 20,
  delayMs = 250,
): void {
  if (navigationRef.isReady()) {
    action();
  } else if (attempts > 0) {
    setTimeout(() => navigateWhenReady(action, attempts - 1, delayMs), delayMs);
  }
}
