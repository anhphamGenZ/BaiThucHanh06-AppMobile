import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Config của Web app Firebase không phải bí mật; bảo mật dựa vào Auth + Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBiS16WXKDVOC5gINbwQ9H-mhIBRatXS6U',
  authDomain: 'chat-nang-cao-th06.firebaseapp.com',
  databaseURL:
    'https://chat-nang-cao-th06-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'chat-nang-cao-th06',
  storageBucket: 'chat-nang-cao-th06.firebasestorage.app',
  messagingSenderId: '556820743304',
  appId: '1:556820743304:web:a18a8ddb191a1873fd4b3d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(
        createAsyncStorage('firebase-auth'),
      ),
    });
  } catch {
    // Fast Refresh: initializeAuth ném auth/already-initialized ở lần gọi thứ hai.
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getDatabase(app);
