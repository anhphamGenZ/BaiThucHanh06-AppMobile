import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  directPeerOf,
  subscribeConversation,
  subscribeUserChats,
} from '../services/chatService';
import { subscribeStatuses, type Status } from '../services/presenceService';
import { subscribeUsers, type UserProfile } from '../services/userService';
import type { Conversation, User, UserChat } from '../types/models';
import { useAuth } from './AuthContext';

type ChatContextValue = {
  // Người dùng khác (không gồm mình) kèm trạng thái online.
  users: User[];
  usersLoaded: boolean;
  getUser: (id: string) => User | undefined;
  // Các cuộc trò chuyện của mình (userChats), mới nhất trước.
  conversations: UserChat[];
  getUserChat: (convId: string) => UserChat | undefined;
  // Thông tin các nhóm mình tham gia: tên, thành viên.
  groups: Record<string, Conversation>;
  totalUnread: number;
  chatsLoaded: boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const myId = me?.id;
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [chats, setChats] = useState<UserChat[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [groups, setGroups] = useState<Record<string, Conversation>>({});

  // Hồ sơ mọi người dùng (users/*).
  useEffect(() => {
    if (!myId) {
      setProfiles({});
      setUsersLoaded(false);
      return;
    }
    return subscribeUsers(next => {
      setProfiles(next);
      setUsersLoaded(true);
    });
  }, [myId]);

  // Trạng thái online/offline (status/*).
  useEffect(() => {
    if (!myId) {
      setStatuses({});
      return;
    }
    return subscribeStatuses(setStatuses);
  }, [myId]);

  // Danh sách cuộc trò chuyện của mình (userChats/{me}).
  useEffect(() => {
    if (!myId) {
      setChats([]);
      setChatsLoaded(false);
      return;
    }
    return subscribeUserChats(myId, next => {
      setChats(next);
      setChatsLoaded(true);
    });
  }, [myId]);

  // Mã các nhóm (không phải chat 1-1), gộp thành chuỗi để effect bên dưới
  // chỉ chạy lại khi danh sách nhóm thật sự đổi, không phải mỗi khi có tin mới.
  const groupKey = useMemo(
    () =>
      myId
        ? chats
            .filter(c => directPeerOf(c.convId, myId) === null)
            .map(c => c.convId)
            .sort()
            .join(',')
        : '',
    [chats, myId],
  );

  // Lắng nghe conversations/{id} của từng nhóm để có tên nhóm và thành viên mới nhất
  // (đổi tên nhóm ở một máy thì Home ở máy khác cập nhật ngay).
  useEffect(() => {
    const ids = groupKey ? groupKey.split(',') : [];
    // Bỏ các nhóm không còn trong userChats.
    setGroups(prev =>
      Object.fromEntries(
        Object.entries(prev).filter(([id]) => ids.includes(id)),
      ),
    );
    const offs = ids.map(id =>
      subscribeConversation(id, conversation =>
        setGroups(prev => {
          const next = { ...prev };
          if (conversation) {
            next[id] = conversation;
          } else {
            delete next[id];
          }
          return next;
        }),
      ),
    );
    return () => offs.forEach(off => off());
  }, [groupKey]);

  // Ghép hồ sơ + trạng thái thành User.
  const allUsers = useMemo(
    () =>
      Object.entries(profiles).map(([id, profile]): User => {
        const status = statuses[id];
        return {
          id,
          name: profile.name,
          isOnline: status?.online === true,
          lastSeen: status?.lastChanged ?? null,
          avatarUrl: profile.avatarUrl,
        };
      }),
    [profiles, statuses],
  );

  const users = useMemo(
    () => allUsers.filter(user => user.id !== myId),
    [allUsers, myId],
  );

  // Sắp xếp cuộc trò chuyện theo tin mới nhất.
  const conversations = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );

  // Tổng số tin chưa đọc, dùng cho badge tab Tin nhắn.
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations],
  );

  const getUser = useCallback(
    (id: string) => users.find(user => user.id === id),
    [users],
  );

  const getUserChat = useCallback(
    (convId: string) => conversations.find(c => c.convId === convId),
    [conversations],
  );

  const value = useMemo(
    () => ({
      users,
      usersLoaded,
      getUser,
      conversations,
      getUserChat,
      groups,
      totalUnread,
      chatsLoaded,
    }),
    [
      users,
      usersLoaded,
      getUser,
      conversations,
      getUserChat,
      groups,
      totalUnread,
      chatsLoaded,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error('useChat must be used inside ChatProvider');
  }
  return value;
}
