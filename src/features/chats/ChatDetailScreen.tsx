import Clipboard from '@react-native-clipboard/clipboard';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTypingSignal } from '../../hooks/useTypingSignal';
import type { RootStackScreenProps } from '../../navigation/types';
import {
  fetchAllMessages,
  loadOlder,
  markRead,
  openDirect,
  PAGE_SIZE,
  previewOf,
  recallMessage,
  sendImage,
  sendLocation,
  sendText,
  subscribeChangesFrom,
  subscribeConversation,
  subscribeLatest,
  subscribeReadStatus,
  toggleReaction,
} from '../../services/chatService';
import {
  CameraPermissionError,
  pickImage,
  type ImageSource,
} from '../../services/imagePickerService';
import {
  getCurrentLocation,
  LocationError,
} from '../../services/locationService';
import { trackActiveConv } from '../../services/presenceService';
import { subscribeTyping } from '../../services/typingService';
import { uploadImage, type LocalImage } from '../../services/uploadService';
import { colors, spacing, typography } from '../../theme';
import type { Conversation, Message } from '../../types/models';
import { formatClock } from '../../utils/formatTime';
import { givenName } from '../../utils/names';
import { ChatHeader } from './components/ChatHeader';
import { ImageViewerModal } from './components/ImageViewerModal';
import { MessageActionsSheet } from './components/MessageActionsSheet';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { MessageSearchBar } from './components/MessageSearchBar';
import { ReplyPreview } from './components/ReplyPreview';
import {
  PendingImageBubble,
  type PendingImage,
} from './components/PendingImageBubble';

// true khi app đang ở tiền cảnh (không bị đưa xuống nền).
function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setActive(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  return active;
}

export function ChatDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'ChatDetail'>) {
  // convId luôn có; peerId chỉ có với chat 1-1 (mở từ Danh bạ/Home).
  const { convId, peerId } = route.params;
  const { me } = useAuth();
  const myId = me?.id;
  const { getUser, usersLoaded, getUserChat } = useChat();
  const peer = peerId ? getUser(peerId) : undefined;
  const userChat = getUserChat(convId);
  const isFocused = useIsFocused();
  const appActive = useAppActive();

  // ----- State -----
  const [ready, setReady] = useState(false); // conversations/{id} đã sẵn sàng
  const [openFailed, setOpenFailed] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [byId, setById] = useState<Record<string, Message>>({}); // tin đã tải, theo id
  const [hasMore, setHasMore] = useState(true); // còn trang cũ để tải không
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUids, setTypingUids] = useState<string[]>([]);
  const [readAt, setReadAt] = useState<Record<string, number>>({});
  const [actionId, setActionId] = useState<string | null>(null); // tin đang mở menu
  const [pending, setPending] = useState<PendingImage[]>([]); // ảnh đang tải lên
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null); // tin đang được trả lời
  const [searchOpen, setSearchOpen] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[] | null>(null); // dữ liệu cho tìm kiếm
  const [jumpTarget, setJumpTarget] = useState<string | null>(null); // tin cần cuộn tới
  const [highlightId, setHighlightId] = useState<string | null>(null); // tin đang tô sáng
  const listRef = useRef<FlatList<Message>>(null);
  // Bản mới nhất của byId để hàm async (cuộn tới tin gốc) đọc mà không bị giá trị cũ.
  const byIdRef = useRef(byId);
  byIdRef.current = byId;

  // Người dùng đang thực sự nhìn thấy cuộc trò chuyện này.
  const visible = ready && isFocused && appActive;
  const typing = useTypingSignal(convId, myId, visible);

  // Thêm mới hoặc thay một tin trong map (dùng cho tin mới, thu hồi, cảm xúc).
  const upsert = useCallback(
    (message: Message) => setById(prev => ({ ...prev, [message.id]: message })),
    [],
  );

  // ----- 1. Mở cuộc trò chuyện -----
  // Chat 1-1 phải có conversations/{id} trước, vì rules đọc tin dựa trên members.
  // Nhóm thì đã có sẵn từ lúc tạo nhóm.
  useEffect(() => {
    setReady(false);
    setOpenFailed(false);
    if (!myId) {
      return;
    }
    let alive = true;
    const opening = peerId ? openDirect(myId, peerId) : Promise.resolve(convId);
    opening
      .then(() => alive && setReady(true))
      .catch(() => alive && setOpenFailed(true));
    return () => {
      alive = false;
    };
  }, [myId, peerId, convId]);

  // ----- 2. Các listener realtime, huỷ hết trong cleanup -----
  useEffect(() => {
    setById({});
    setHasMore(true);
    setTypingUids([]);
    setReadAt({});
    setConversationLoaded(false);
    if (!ready || !myId) {
      return;
    }
    const offs = [
      // Thông tin cuộc trò chuyện: loại, tên nhóm, thành viên.
      subscribeConversation(convId, next => {
        setConversation(next);
        setConversationLoaded(true);
      }),
      // 20 tin mới nhất + tin mới đến.
      subscribeLatest(convId, {
        onUpsert: upsert,
        onRemove: id =>
          setById(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          }),
      }),
      // Ai đang gõ.
      subscribeTyping(convId, myId, setTypingUids),
      // Thời điểm đọc cuối của từng thành viên (Đã xem).
      subscribeReadStatus(convId, setReadAt),
    ];
    return () => offs.forEach(off => off());
  }, [ready, convId, myId, upsert]);

  // Danh sách hiển thị: mới nhất trước vì FlatList inverted. Push key tăng dần theo thời gian.
  const data = useMemo(
    () => Object.values(byId).sort((a, b) => (a.id < b.id ? 1 : -1)),
    [byId],
  );
  const oldestKey = data.length > 0 ? data[data.length - 1].id : undefined;

  // ----- 3. Thu hồi/cảm xúc trên mọi tin đã tải, kể cả các trang cũ -----
  useEffect(() => {
    if (!ready || !oldestKey) {
      return;
    }
    return subscribeChangesFrom(convId, oldestKey, upsert);
  }, [ready, convId, oldestKey, upsert]);

  // ----- 4. Báo cho người gửi biết mình đang mở chat này (không tạo thông báo cho mình) -----
  useEffect(() => {
    if (!myId || !visible) {
      return;
    }
    return trackActiveConv(myId, convId);
  }, [myId, convId, visible]);

  // ----- 5. Đánh dấu đã đọc khi đang xem và có tin mới từ người khác -----
  const lastIncoming = data.find(m => m.senderId !== myId);
  const myReadAt = myId ? readAt[myId] ?? 0 : 0;
  const unread = userChat?.unread ?? 0;
  const hasUserChat = userChat !== undefined;
  useEffect(() => {
    if (!myId || !visible || !hasUserChat) {
      return;
    }
    if (unread > 0 || (lastIncoming && lastIncoming.createdAt > myReadAt)) {
      markRead(myId, convId).catch(() => {});
    }
  }, [myId, convId, visible, hasUserChat, unread, lastIncoming, myReadAt]);

  // ----- 6. Tải trang cũ khi kéo lên đầu danh sách -----
  // FlatList inverted nên tin cũ được nối vào cuối mảng, danh sách không bị nhảy.
  const handleLoadOlder = useCallback(async () => {
    if (!ready || loadingOlder || !hasMore || !oldestKey) {
      return;
    }
    setLoadingOlder(true);
    try {
      const older = await loadOlder(convId, oldestKey);
      if (older.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setById(prev => {
        const next = { ...prev };
        for (const message of older) {
          next[message.id] = next[message.id] ?? message;
        }
        return next;
      });
    } catch {
      // Lỗi mạng: lần kéo sau sẽ thử lại.
    } finally {
      setLoadingOlder(false);
    }
  }, [ready, loadingOlder, hasMore, oldestKey, convId]);

  // ----- 7. Cuộn tới tin cần xem (trích dẫn hoặc kết quả tìm kiếm) khi nó đã có trong danh sách -----
  useEffect(() => {
    if (!jumpTarget) {
      return;
    }
    const index = data.findIndex(m => m.id === jumpTarget);
    if (index < 0) {
      return;
    }
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
    setHighlightId(jumpTarget);
    setJumpTarget(null);
  }, [jumpTarget, data]);

  // Tắt tô sáng sau 1,6 giây.
  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const timer = setTimeout(() => setHighlightId(null), 1600);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // ----- Các trạng thái chưa thể hiện màn chat -----
  if (!myId || !me) {
    return null;
  }

  if (openFailed) {
    return renderNotice(
      'Không mở được cuộc trò chuyện',
      'Kiểm tra kết nối mạng rồi thử lại.',
      () => navigation.goBack(),
    );
  }

  if (!usersLoaded || !ready || (!peerId && !conversationLoaded)) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isGroup = conversation?.type === 'group';
  if (!isGroup && !peer) {
    return renderNotice(
      'Không tìm thấy cuộc trò chuyện',
      'Người dùng hoặc nhóm này không còn tồn tại.',
      () => navigation.goBack(),
    );
  }

  // ----- Dữ liệu suy ra cho giao diện -----
  const members = conversation?.members ?? (peerId ? [myId, peerId] : [myId]);
  const others = members.filter(uid => uid !== myId);
  const nameOf = (uid: string) =>
    uid === myId ? me.name : getUser(uid)?.name ?? 'Thành viên';

  // Tiêu đề: nhóm hiện tên nhóm và số người online, chat 1-1 hiện tên và trạng thái người kia.
  const onlineCount = others.filter(uid => getUser(uid)?.isOnline).length;
  const title = isGroup ? conversation?.name ?? 'Nhóm' : peer?.name ?? '';
  const typingText =
    typingUids.length === 0
      ? undefined
      : isGroup
      ? `${typingUids
          .map(uid => givenName(nameOf(uid)))
          .join(', ')} đang soạn tin…`
      : 'đang soạn tin…';

  // Trạng thái dưới tin cuối của mình: Đã gửi / Đã xem HH:mm / Đã xem bởi N người.
  const lastMine = data.find(m => m.senderId === myId && m.type !== 'system');
  let seenLabel: string | undefined;
  if (lastMine) {
    const seenBy = others.filter(
      uid => (readAt[uid] ?? 0) >= lastMine.createdAt,
    );
    if (isGroup) {
      seenLabel =
        seenBy.length > 0 ? `Đã xem bởi ${seenBy.length} người` : 'Đã gửi';
    } else {
      seenLabel =
        seenBy.length > 0
          ? `Đã xem ${formatClock(readAt[seenBy[0]])}`
          : 'Đã gửi';
    }
  }

  // Tin đang mở menu nhấn giữ (lấy bản mới nhất từ map để thấy cảm xúc hiện tại).
  const actionMessage = actionId ? byId[actionId] : undefined;

  const scrollToLatest = () =>
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

  // ----- Gửi tin chữ -----
  const handleSend = (text: string) => {
    typing.stop();
    // Đang trả lời thì gửi kèm trích dẫn (id, người gửi, đoạn xem trước của tin gốc).
    const replyTo = replyingTo
      ? {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          preview: previewOf(replyingTo),
        }
      : undefined;
    setReplyingTo(null);
    sendText(convId, members, myId, text, replyTo).catch(() =>
      Alert.alert('Không gửi được', 'Vui lòng thử lại.'),
    );
    scrollToLatest();
  };

  // ----- Cuộn tới một tin bất kỳ -----
  // Nếu tin chưa được tải (cũ hơn các trang đang có) thì tải thêm từng trang 20 tin cho tới khi thấy.
  const jumpTo = async (messageId: string) => {
    let known = byIdRef.current;
    let more = hasMore;
    try {
      while (!known[messageId] && more) {
        const oldest = Object.keys(known).sort()[0];
        if (!oldest) {
          break;
        }
        const older = await loadOlder(convId, oldest);
        if (older.length < PAGE_SIZE) {
          more = false;
        }
        if (older.length === 0) {
          break;
        }
        known = { ...known };
        for (const message of older) {
          known[message.id] = known[message.id] ?? message;
        }
      }
    } catch {
      Alert.alert('Không tải được tin cũ', 'Vui lòng thử lại.');
      return;
    }
    if (!more) {
      setHasMore(false);
    }
    if (!known[messageId]) {
      Alert.alert('Không tìm thấy tin gốc', 'Tin này có thể đã bị xoá.');
      return;
    }
    // Gộp các trang vừa tải (giữ bản realtime mới hơn nếu có), rồi effect số 7 sẽ cuộn tới.
    const loaded = known;
    setById(prev => ({ ...loaded, ...prev }));
    setJumpTarget(messageId);
  };

  // ----- Tìm kiếm tin nhắn -----
  // Mở ô tìm thì tải toàn bộ tin một lần; chọn kết quả thì đóng ô tìm và cuộn tới tin đó.
  const openSearch = () => {
    setSearchOpen(true);
    setAllMessages(null);
    fetchAllMessages(convId)
      .then(setAllMessages)
      .catch(() => {
        setAllMessages([]);
        Alert.alert('Không tải được tin nhắn', 'Vui lòng thử lại.');
      });
  };

  const selectSearchResult = (messageId: string) => {
    setSearchOpen(false);
    jumpTo(messageId);
  };

  // ----- Gửi vị trí -----
  const handleSendLocation = async () => {
    setLocating(true);
    try {
      const point = await getCurrentLocation();
      await sendLocation(convId, members, myId, point);
      scrollToLatest();
    } catch (error) {
      if (error instanceof LocationError) {
        if (error.code === 'denied') {
          Alert.alert(
            'Không có quyền vị trí',
            'Bạn đã từ chối quyền truy cập vị trí nên không thể gửi vị trí.',
          );
        } else if (error.code === 'blocked') {
          Alert.alert(
            'Không có quyền vị trí',
            'Hãy cấp quyền vị trí trong Cài đặt để gửi vị trí.',
            [
              { text: 'Huỷ', style: 'cancel' },
              { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert('Không lấy được vị trí', 'Hãy bật GPS rồi thử lại.');
        }
      } else {
        Alert.alert('Không gửi được', 'Vui lòng thử lại.');
      }
    } finally {
      setLocating(false);
    }
  };

  // ----- Gửi ảnh: upload Cloudinary rồi mới ghi URL vào DB -----
  const setPendingStatus = (localId: string, status: PendingImage['status']) =>
    setPending(list =>
      list.map(p => (p.localId === localId ? { ...p, status } : p)),
    );

  // Tải một ảnh tạm lên; thành công thì gửi tin ảnh và xoá bong bóng tạm, lỗi thì hiện "Thử lại".
  const uploadPending = async (localId: string, image: LocalImage) => {
    setPendingStatus(localId, 'uploading');
    try {
      const url = await uploadImage(image);
      await sendImage(convId, members, myId, url);
      setPending(list => list.filter(p => p.localId !== localId));
    } catch {
      setPendingStatus(localId, 'failed');
    }
  };

  // Chụp hoặc chọn ảnh, thêm bong bóng tạm rồi bắt đầu tải lên.
  const startPick = async (source: ImageSource) => {
    try {
      const image = await pickImage(source);
      if (!image) {
        return; // người dùng huỷ
      }
      const localId = Date.now().toString(36) + Math.random().toString(36);
      setPending(list => [...list, { localId, image, status: 'uploading' }]);
      scrollToLatest();
      uploadPending(localId, image);
    } catch (error) {
      if (error instanceof CameraPermissionError) {
        Alert.alert(
          'Không có quyền camera',
          error.blocked
            ? 'Hãy cấp quyền camera trong Cài đặt để chụp ảnh.'
            : 'Bạn đã từ chối quyền camera nên không thể chụp ảnh.',
          error.blocked
            ? [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
              ]
            : undefined,
        );
      } else {
        Alert.alert('Không lấy được ảnh', 'Vui lòng thử lại.');
      }
    }
  };

  // Nút 📷: hỏi nguồn ảnh.
  const handlePickImage = () =>
    Alert.alert('Gửi ảnh', 'Chọn nguồn ảnh', [
      { text: 'Chụp ảnh', onPress: () => startPick('camera') },
      { text: 'Chọn từ thư viện', onPress: () => startPick('library') },
      { text: 'Huỷ', style: 'cancel' },
    ]);

  const retryPending = (localId: string) => {
    const item = pending.find(p => p.localId === localId);
    if (item) {
      uploadPending(localId, item.image);
    }
  };

  const cancelPending = (localId: string) =>
    setPending(list => list.filter(p => p.localId !== localId));

  // ----- Menu nhấn giữ: sao chép, thu hồi, cảm xúc -----
  const handleCopy = (message: Message) => {
    Clipboard.setString(message.text ?? '');
    if (Platform.OS === 'android') {
      ToastAndroid.show('Đã sao chép', ToastAndroid.SHORT);
    }
  };

  const handleRecall = (message: Message) => {
    Alert.alert(
      'Thu hồi tin nhắn?',
      'Mọi người trong cuộc trò chuyện sẽ thấy tin này đã được thu hồi.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: () =>
            recallMessage(convId, message.id, myId, members).catch(() =>
              Alert.alert('Không thu hồi được', 'Vui lòng thử lại.'),
            ),
        },
      ],
    );
  };

  const handleReact = (message: Message, emoji: string) => {
    toggleReaction(convId, message, myId, emoji).catch(() =>
      Alert.alert('Không thả được cảm xúc', 'Vui lòng thử lại.'),
    );
  };

  // ----- Giao diện -----
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ChatHeader
        title={title}
        avatarSeed={isGroup ? convId : peer?.id ?? convId}
        avatarUri={isGroup ? undefined : peer?.avatarUrl}
        online={isGroup ? onlineCount > 0 : peer?.isOnline === true}
        typingText={typingText}
        subtitle={
          isGroup
            ? `${onlineCount} đang online · ${members.length} thành viên`
            : undefined
        }
        lastSeen={isGroup ? undefined : peer?.lastSeen}
        onBack={() => navigation.goBack()}
        onPressSearch={openSearch}
        onPressInfo={
          isGroup
            ? () => navigation.navigate('GroupInfo', { convId })
            : undefined
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {searchOpen ? (
          // Đang tìm kiếm: thay danh sách tin bằng ô tìm + kết quả.
          <MessageSearchBar
            messages={allMessages}
            nameOf={nameOf}
            onSelect={selectSearchResult}
            onClose={() => setSearchOpen(false)}
          />
        ) : data.length === 0 && pending.length === 0 ? (
          <View style={styles.empty}>
            <EmptyState
              icon="chat"
              title="Chưa có tin nhắn"
              message={`Nhắn tin cho ${title} để bắt đầu.`}
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            inverted
            data={data}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            // Kéo tới đầu (do inverted nên là "cuối" danh sách) thì tải trang cũ.
            onEndReached={handleLoadOlder}
            onEndReachedThreshold={0.3}
            // Dòng chưa được đo nên chưa cuộn tới được: cuộn gần đúng trước rồi thử lại.
            onScrollToIndexFailed={info => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
              setTimeout(
                () =>
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.5,
                  }),
                150,
              );
            }}
            ListFooterComponent={
              loadingOlder ? (
                <ActivityIndicator
                  style={styles.older}
                  color={colors.primary}
                />
              ) : undefined
            }
            // Ảnh đang tải hiện ở cuối cuộc trò chuyện (Header của list inverted nằm dưới cùng).
            ListHeaderComponent={
              pending.length > 0 ? (
                <View style={styles.pending}>
                  {pending.map(item => (
                    <PendingImageBubble
                      key={item.localId}
                      item={item}
                      onRetry={retryPending}
                      onCancel={cancelPending}
                    />
                  ))}
                </View>
              ) : undefined
            }
            renderItem={({ item, index }) => {
              // Trong nhóm, hiện tên người gửi ở tin đầu của mỗi chuỗi tin liên tiếp cùng người.
              const older = data[index + 1];
              const showName =
                isGroup &&
                item.senderId !== myId &&
                (!older ||
                  older.senderId !== item.senderId ||
                  older.type === 'system');
              return (
                <MessageBubble
                  message={item}
                  isMine={item.senderId === myId}
                  myId={myId}
                  senderName={showName ? nameOf(item.senderId) : undefined}
                  status={item.id === lastMine?.id ? seenLabel : undefined}
                  replyName={
                    item.replyTo ? nameOf(item.replyTo.senderId) : undefined
                  }
                  highlighted={item.id === highlightId}
                  onLongPress={m => setActionId(m.id)}
                  onPressImage={setViewerUrl}
                  onPressReply={jumpTo}
                />
              );
            }}
          />
        )}
        {replyingTo && !searchOpen && (
          <ReplyPreview
            name={nameOf(replyingTo.senderId)}
            preview={previewOf(replyingTo)}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        {!searchOpen && (
          <MessageInput
            onSend={handleSend}
            onSendLocation={handleSendLocation}
            onPickImage={handlePickImage}
            locating={locating}
            onTyping={typing.onTextChange}
          />
        )}
      </KeyboardAvoidingView>
      <MessageActionsSheet
        message={actionMessage}
        myId={myId}
        onClose={() => setActionId(null)}
        onReact={handleReact}
        onCopy={handleCopy}
        onRecall={handleRecall}
        onReply={setReplyingTo}
      />
      <ImageViewerModal url={viewerUrl} onClose={() => setViewerUrl(null)} />
    </SafeAreaView>
  );
}

// Màn báo lỗi đơn giản kèm nút quay lại.
function renderNotice(title: string, message: string, onBack: () => void) {
  return (
    <SafeAreaView style={styles.safe}>
      <EmptyState icon="info" title={title} message={message} />
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>Quay lại</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  loading: {
    marginTop: 48,
  },
  older: {
    marginVertical: spacing.sm,
  },
  pending: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  back: {
    ...typography.name,
    color: colors.primary,
    textAlign: 'center',
  },
});
