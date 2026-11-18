import {
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { navigationRef } from './src/navigation/navigationRef';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
  },
};

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* Thứ tự provider: Auth → Chat → Notification (thông báo cần tên người dùng/nhóm từ Chat). */}
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef} theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
