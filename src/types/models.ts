export type Unsubscribe = () => void;

// avatarUrl: ảnh đại diện trên Cloudinary (tuỳ chọn).
export type Me = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type User = {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: number | null;
  avatarUrl?: string;
};

export type GeoPoint = { lat: number; lng: number };

export type ConversationType = 'direct' | 'group';

// Node conversations/{convId}.
export type Conversation = {
  id: string;
  type: ConversationType;
  name?: string;
  members: string[];
  createdBy: string;
  createdAt: number;
};

export type MessageType = 'text' | 'location' | 'image' | 'system';

// Tin đã thu hồi giữ nguyên node nhưng mất nội dung (text, imageUrl, lat, lng = null).
// Tin system ("A đã tạo nhóm") dùng trường text.
export type Message = {
  id: string;
  senderId: string;
  type: MessageType;
  createdAt: number;
  text?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  recalled: boolean;
  reactions: Record<string, string>;
  // Trích dẫn khi tin này trả lời một tin khác.
  replyTo?: ReplyRef;
};

// Thông tin tối thiểu của tin được trả lời, lưu kèm tin mới để không phải tải tin gốc.
export type ReplyRef = { id: string; senderId: string; preview: string };

// Node userChats/{uid}/{convId}: dòng hiển thị ở Home.
export type UserChat = {
  convId: string;
  lastMessage: string;
  lastType: string;
  lastSenderId: string;
  lastMessageId: string;
  updatedAt: number;
  unread: number;
};

export type NotificationType = 'message' | 'group_added' | 'reaction';

// Node notifications/{uid}/{id}. Tin nhắn dùng id cố định msg_{convId} để gộp theo cuộc trò chuyện.
export type AppNotification = {
  id: string;
  type: NotificationType;
  convId: string;
  fromUid: string;
  text: string;
  createdAt: number;
  read: boolean;
};
