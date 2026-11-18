/* eslint-env jest */
// Mọi thứ chạm tới native/mạng đều bị mock: test không được mở kết nối Firebase.
jest.mock('./src/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('./src/services/authService', () => ({
  register: jest.fn(() => Promise.resolve()),
  login: jest.fn(() => Promise.resolve()),
  logout: jest.fn(() => Promise.resolve()),
  subscribeAuth: jest.fn(cb => {
    cb(null);
    return () => {};
  }),
  mapAuthError: jest.fn(() => 'Đã có lỗi xảy ra, vui lòng thử lại'),
}));

jest.mock('./src/services/userService', () => ({
  subscribeUsers: jest.fn(() => () => {}),
  subscribeMyProfile: jest.fn(() => () => {}),
  updateProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/localNotificationService', () => ({
  setupLocalNotifications: jest.fn(() => Promise.resolve()),
  showLocalNotification: jest.fn(() => Promise.resolve()),
  handleBackgroundEvent: jest.fn(() => Promise.resolve()),
  onOpenFromNotification: jest.fn(() => () => {}),
}));

jest.mock('./src/services/presenceService', () => ({
  startPresence: jest.fn(() => () => {}),
  setOffline: jest.fn(() => Promise.resolve()),
  setOnline: jest.fn(() => Promise.resolve()),
  subscribeStatuses: jest.fn(() => () => {}),
  trackActiveConv: jest.fn(() => () => {}),
}));

jest.mock('./src/services/chatService', () => ({
  PAGE_SIZE: 20,
  LOCATION_PREVIEW: '📍 Vị trí',
  IMAGE_PREVIEW: '📷 Hình ảnh',
  RECALLED_TEXT: 'Tin nhắn đã được thu hồi',
  REACTIONS: ['👍', '❤️', '😂', '😮', '😢'],
  getDirectId: jest.fn((a, b) => [a, b].sort().join('_')),
  directPeerOf: jest.fn(() => null),
  openDirect: jest.fn((a, b) => Promise.resolve([a, b].sort().join('_'))),
  subscribeConversation: jest.fn(() => () => {}),
  sendText: jest.fn(() => Promise.resolve()),
  sendLocation: jest.fn(() => Promise.resolve()),
  sendImage: jest.fn(() => Promise.resolve()),
  sendSystemMessage: jest.fn(() => Promise.resolve()),
  previewOf: jest.fn(() => ''),
  fetchAllMessages: jest.fn(() => Promise.resolve([])),
  subscribeLatest: jest.fn(() => () => {}),
  loadOlder: jest.fn(() => Promise.resolve([])),
  subscribeChangesFrom: jest.fn(() => () => {}),
  subscribeUserChats: jest.fn(() => () => {}),
  markRead: jest.fn(() => Promise.resolve()),
  subscribeReadStatus: jest.fn(() => () => {}),
  recallMessage: jest.fn(() => Promise.resolve()),
  toggleReaction: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/groupService', () => ({
  MIN_GROUP_PICK: 2,
  createGroup: jest.fn(() => Promise.resolve('group-id')),
  renameGroup: jest.fn(() => Promise.resolve()),
  addMembers: jest.fn(() => Promise.resolve()),
  removeMember: jest.fn(() => Promise.resolve()),
  leaveGroup: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/notificationService', () => ({
  getActiveConvs: jest.fn(() => Promise.resolve({})),
  messageNotificationUpdates: jest.fn(() => ({})),
  newNotificationUpdate: jest.fn(() => ({})),
  subscribeNotifications: jest.fn(() => () => {}),
  markNotificationRead: jest.fn(() => Promise.resolve()),
  markAllNotificationsRead: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/uploadService', () => ({
  uploadImage: jest.fn(() =>
    Promise.resolve('https://res.cloudinary.com/demo/image/upload/x.jpg'),
  ),
}));

jest.mock('./src/services/imagePickerService', () => ({
  CameraPermissionError: class CameraPermissionError extends Error {
    constructor(blocked) {
      super('camera-permission');
      this.blocked = blocked;
    }
  },
  pickImage: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('./src/services/typingService', () => ({
  setTyping: jest.fn(() => Promise.resolve()),
  subscribeTyping: jest.fn(() => () => {}),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
    getString: jest.fn(() => Promise.resolve('')),
  },
}));

jest.mock('./src/services/locationService', () => ({
  LocationError: class LocationError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  },
  getCurrentLocation: jest.fn(() => Promise.resolve({ lat: 0, lng: 0 })),
  openInGoogleMaps: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const createAsyncStorage = () => {
    const store = new Map();
    return {
      getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async key => {
        store.delete(key);
      }),
    };
  };
  return { createAsyncStorage, getLegacyStorage: createAsyncStorage };
});

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    requestAuthorization: jest.fn(),
    getCurrentPosition: jest.fn(),
  },
}));
