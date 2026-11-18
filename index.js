/**
 * @format
 */

import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleBackgroundEvent } from './src/services/localNotificationService';

// Người dùng nhấn thông báo khi app đang chạy nền: ghi nhận để mở đúng cuộc trò chuyện.
notifee.onBackgroundEvent(handleBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);
