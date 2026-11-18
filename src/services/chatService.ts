import {
  endBefore,
  get,
  increment,
  limitToLast,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  orderByKey,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  startAt,
  update,
} from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import type {
  Conversation,
  GeoPoint,
  Message,
  ReplyRef,
  Unsubscribe,
  UserChat,
} from '../types/models';
import { db } from './firebase';
import {
  getActiveConvs,
  messageNotificationUpdates,
  newNotificationUpdate,
} from './notificationService';

// ===== Hằng số dùng chung =====

// Số tin mỗi trang: lần đầu tải 20 tin mới nhất, kéo lên tải thêm 20 tin cũ hơn.
export const PAGE_SIZE = 20;
// Chuỗi hiển thị ở Home (userChats.lastMessage) theo loại tin.
export const LOCATION_PREVIEW = '📍 Vị trí';
export const IMAGE_PREVIEW = '📷 Hình ảnh';
export const RECALLED_TEXT = 'Tin nhắn đã được thu hồi';
// 5 cảm xúc cho phép. Phải trùng từng ký tự với danh sách trong database.rules.json.
export const REACTIONS = ['👍', '❤️', '😂', '😮', '😢'] as const;

// Nội dung riêng của từng loại tin; các trường chung (senderId, createdAt) do sendMessage thêm.
type Payload =
  | { type: 'text'; text: string; replyTo?: ReplyRef }
  | { type: 'location'; lat: number; lng: number }
  | { type: 'image'; imageUrl: string }
  | { type: 'system'; text: string };

const messagesPath = (convId: string) => 'messages/' + convId;
const userChatPath = (uid: string, convId: string) =>
  'userChats/' + uid + '/' + convId;

// ===== Mã cuộc trò chuyện 1-1 =====

// Chat 1-1 có mã cố định sort(a, b).join('_') để hai người luôn mở cùng một cuộc trò chuyện.
export function getDirectId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

// Tách uid người kia từ mã chat 1-1. Trả về null nếu convId là nhóm hoặc không chứa mình.
// Mã nhóm tạo bằng push() nên không bao giờ có dạng "<uid mình>_<uid khác>".
export function directPeerOf(convId: string, me: string): string | null {
  const parts = convId.split('_');
  if (parts.length !== 2) {
    return null;
  }
  if (parts[0] === me) {
    return parts[1];
  }
  return parts[1] === me ? parts[0] : null;
}

// ===== Node conversations/{convId} =====

// Tạo conversations/{id} cho chat 1-1 ở lần mở đầu tiên.
// Bắt buộc có node này trước khi đọc/gửi tin, vì rules kiểm tra thành viên qua members.
export async function openDirect(me: string, peer: string): Promise<string> {
  const id = getDirectId(me, peer);
  const convRef = ref(db, 'conversations/' + id);

  // Đã có thì dùng luôn (rules cho phép đọc node chưa tồn tại nếu mã chứa uid của mình).
  if ((await get(convRef)).exists()) {
    return id;
  }

  // Chưa có thì tạo mới. Rules chỉ cho tạo, không cho ghi đè.
  try {
    await set(convRef, {
      type: 'direct',
      members: { [me]: true, [peer]: true },
      createdBy: me,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Người kia có thể vừa tạo cùng lúc nên lệnh set bị từ chối: đọc lại để chắc chắn.
    if (!(await get(convRef)).exists()) {
      throw error;
    }
  }
  return id;
}

// Chuyển snapshot conversations/{id} thành object; dữ liệu sai cấu trúc thì trả null.
function parseConversation(snap: DataSnapshot): Conversation | null {
  const v = snap.val();
  if (!snap.key || !v || (v.type !== 'direct' && v.type !== 'group')) {
    return null;
  }
  return {
    id: snap.key,
    type: v.type,
    name: typeof v.name === 'string' ? v.name : undefined,
    members: Object.keys(v.members ?? {}),
    createdBy: typeof v.createdBy === 'string' ? v.createdBy : '',
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
  };
}

// Lắng nghe thông tin cuộc trò chuyện (loại, tên nhóm, danh sách thành viên).
export function subscribeConversation(
  convId: string,
  cb: (conversation: Conversation | null) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'conversations/' + convId),
    snap => cb(parseConversation(snap)),
    () => cb(null),
  );
}

// ===== Gửi tin =====

// Gửi một tin bằng MỘT lệnh update() nhiều đường dẫn, nên tất cả cùng thành công hoặc cùng thất bại:
//   1. messages/{convId}/{key}: nội dung tin;
//   2. userChats/{m}/{convId} của mọi thành viên: tin cuối, loại tin, người gửi, thời gian;
//   3. unread: increment(1) cho mọi thành viên trừ người gửi;
//   4. notifications/{m}/msg_{convId} cho người nhận đang không mở cuộc trò chuyện này.
type SendOptions = {
  // Đường dẫn ghi thêm trong cùng lệnh update (ví dụ đổi tên nhóm, thêm/xoá thành viên).
  extra?: Record<string, unknown>;
  // false: không tạo thông báo tin mới (tin hệ thống của quản trị nhóm).
  notify?: boolean;
  // false: không ghi userChats của người gửi (người gửi vừa rời nhóm).
  includeSender?: boolean;
};

async function sendMessage(
  convId: string,
  members: string[],
  me: string,
  payload: Payload,
  preview: string,
  options: SendOptions = {},
): Promise<string> {
  // push() chỉ sinh khoá ở máy (theo thời gian), chưa ghi gì lên server.
  const key = push(ref(db, messagesPath(convId))).key;
  if (!key) {
    throw new Error('Không tạo được khoá tin nhắn');
  }
  // Những người được cập nhật dòng tin cuối ở Home.
  const everyone =
    options.includeSender === false
      ? [...new Set(members)].filter(uid => uid !== me)
      : [...new Set([...members, me])];
  const recipients = everyone.filter(uid => uid !== me);

  // (1) Nội dung tin. createdAt lấy giờ server để mọi máy sắp xếp giống nhau.
  const updates: Record<string, unknown> = {
    [messagesPath(convId) + '/' + key]: {
      senderId: me,
      ...payload,
      createdAt: serverTimestamp(),
    },
  };

  // (2) + (3) Dòng tin cuối ở Home của từng thành viên và số chưa đọc.
  for (const uid of everyone) {
    const base = userChatPath(uid, convId);
    updates[base + '/lastMessage'] = preview;
    updates[base + '/lastType'] = payload.type;
    updates[base + '/lastSenderId'] = me;
    updates[base + '/lastMessageId'] = key;
    updates[base + '/updatedAt'] = serverTimestamp();
    if (uid !== me) {
      updates[base + '/unread'] = increment(1);
    }
  }

  // (4) Thông báo: đọc activeConv của người nhận ngay trước khi gửi để bỏ qua người đang mở chat.
  if (options.notify !== false) {
    const activeConvs = await getActiveConvs(recipients);
    Object.assign(
      updates,
      messageNotificationUpdates(recipients, activeConvs, convId, me, preview),
    );
  }

  // Các thay đổi đi kèm (đổi tên nhóm, thêm/xoá thành viên...).
  Object.assign(updates, options.extra);

  await update(ref(db), updates);
  return key;
}

// Tin chữ: bỏ khoảng trắng thừa, chuỗi rỗng thì không gửi. replyTo có khi đang trả lời một tin.
export async function sendText(
  convId: string,
  members: string[],
  me: string,
  text: string,
  replyTo?: ReplyRef,
): Promise<void> {
  const body = text.trim();
  if (body) {
    const payload: Payload = replyTo
      ? { type: 'text', text: body, replyTo }
      : { type: 'text', text: body };
    await sendMessage(convId, members, me, payload, body);
  }
}

// Tin hệ thống của quản trị nhóm ("A đã rời nhóm"), ghi cùng lệnh với thay đổi trong `extra`.
export async function sendSystemMessage(
  convId: string,
  members: string[],
  me: string,
  text: string,
  options: Omit<SendOptions, 'notify'> = {},
): Promise<void> {
  await sendMessage(convId, members, me, { type: 'system', text }, text, {
    ...options,
    notify: false,
  });
}

// Chuỗi xem trước của một tin, dùng cho trích dẫn khi trả lời.
export function previewOf(message: Message): string {
  if (message.type === 'image') {
    return IMAGE_PREVIEW;
  }
  if (message.type === 'location') {
    return LOCATION_PREVIEW;
  }
  return (message.text ?? '').slice(0, 120);
}

// Tin vị trí: lưu lat/lng phẳng trong tin để rules kiểm tra từng trường.
export async function sendLocation(
  convId: string,
  members: string[],
  me: string,
  point: GeoPoint,
): Promise<void> {
  await sendMessage(
    convId,
    members,
    me,
    { type: 'location', lat: point.lat, lng: point.lng },
    LOCATION_PREVIEW,
  );
}

// Tin ảnh: chỉ lưu URL Cloudinary (secure_url), ảnh đã được upload trước đó.
export async function sendImage(
  convId: string,
  members: string[],
  me: string,
  imageUrl: string,
): Promise<void> {
  await sendMessage(
    convId,
    members,
    me,
    { type: 'image', imageUrl },
    IMAGE_PREVIEW,
  );
}

// ===== Đọc tin =====

// Chỉ giữ cảm xúc dạng chuỗi: { uid: emoji }.
function parseReactions(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (value && typeof value === 'object') {
    for (const [uid, emoji] of Object.entries(value)) {
      if (typeof emoji === 'string') {
        result[uid] = emoji;
      }
    }
  }
  return result;
}

// Chuyển snapshot một tin thành Message; tin sai cấu trúc thì bỏ qua (trả null).
function parseMessage(snap: DataSnapshot): Message | null {
  const v = snap.val();
  const knownType =
    v?.type === 'text' ||
    v?.type === 'location' ||
    v?.type === 'image' ||
    v?.type === 'system';
  if (
    !snap.key ||
    !knownType ||
    typeof v.senderId !== 'string' ||
    typeof v.createdAt !== 'number'
  ) {
    return null;
  }

  // Trường chung của mọi loại tin.
  const message: Message = {
    id: snap.key,
    senderId: v.senderId,
    type: v.type,
    createdAt: v.createdAt,
    recalled: v.recalled === true,
    reactions: parseReactions(v.reactions),
  };

  // Tin đã thu hồi không còn nội dung.
  if (message.recalled) {
    return message;
  }

  // Trích dẫn (nếu tin này là trả lời).
  const r = v.replyTo;
  if (
    r &&
    typeof r.id === 'string' &&
    typeof r.senderId === 'string' &&
    typeof r.preview === 'string'
  ) {
    message.replyTo = { id: r.id, senderId: r.senderId, preview: r.preview };
  }

  // Nội dung theo từng loại tin.
  if (v.type === 'text' || v.type === 'system') {
    return typeof v.text === 'string' ? { ...message, text: v.text } : null;
  }
  if (v.type === 'image') {
    return typeof v.imageUrl === 'string'
      ? { ...message, imageUrl: v.imageUrl }
      : null;
  }
  if (typeof v.lat === 'number' && typeof v.lng === 'number') {
    return { ...message, lat: v.lat, lng: v.lng };
  }
  return null;
}

type MessageHandlers = {
  onUpsert: (message: Message) => void;
  onRemove: (id: string) => void;
};

// Lắng nghe 20 tin mới nhất (limitToLast). Tin mới đến thì onChildAdded, thu hồi/cảm xúc thì onChildChanged.
// Lưu ý: khi có tin mới, tin cũ nhất trượt khỏi cửa sổ 20 tin và cũng phát child_removed.
// Vì vậy chỉ xoá khỏi màn hình khi node thật sự không còn (tin hiện tạm bị server từ chối).
export function subscribeLatest(
  convId: string,
  handlers: MessageHandlers,
): Unsubscribe {
  const base = ref(db, messagesPath(convId));
  const q = query(base, limitToLast(PAGE_SIZE));

  const emit = (snap: DataSnapshot) => {
    const message = parseMessage(snap);
    if (message) {
      handlers.onUpsert(message);
    }
  };
  const offAdded = onChildAdded(q, emit);
  const offChanged = onChildChanged(q, emit);

  const offRemoved = onChildRemoved(q, snap => {
    const id = snap.key;
    if (!id) {
      return;
    }
    // Kiểm tra lại trên server: còn tồn tại nghĩa là chỉ trượt khỏi cửa sổ, giữ nguyên.
    get(ref(db, messagesPath(convId) + '/' + id))
      .then(current => {
        if (!current.exists()) {
          handlers.onRemove(id);
        }
      })
      .catch(() => {});
  });

  // Hàm huỷ cả ba listener, gọi trong cleanup của useEffect.
  return () => {
    offAdded();
    offChanged();
    offRemoved();
  };
}

// Tải một trang cũ hơn: 20 tin ngay trước oldestKey, thứ tự cũ → mới.
export async function loadOlder(
  convId: string,
  oldestKey: string,
): Promise<Message[]> {
  const snap = await get(
    query(
      ref(db, messagesPath(convId)),
      orderByKey(),
      endBefore(oldestKey),
      limitToLast(PAGE_SIZE),
    ),
  );
  const list: Message[] = [];
  snap.forEach(child => {
    const message = parseMessage(child);
    if (message) {
      list.push(message);
    }
  });
  return list;
}

// Tải toàn bộ tin của một cuộc trò chuyện một lần, dùng cho tìm kiếm.
// Quy mô bài thực hành nhỏ nên chấp nhận được; app thật nên tìm ở server.
export async function fetchAllMessages(convId: string): Promise<Message[]> {
  const snap = await get(ref(db, messagesPath(convId)));
  const list: Message[] = [];
  snap.forEach(child => {
    const message = parseMessage(child);
    if (message) {
      list.push(message);
    }
  });
  return list;
}

// Theo dõi thay đổi (thu hồi, cảm xúc) trên mọi tin từ oldestKey trở về sau,
// gồm cả các trang cũ đã tải. Màn hình gắn lại listener này mỗi khi tải thêm trang.
export function subscribeChangesFrom(
  convId: string,
  oldestKey: string,
  onChange: (message: Message) => void,
): Unsubscribe {
  return onChildChanged(
    query(ref(db, messagesPath(convId)), orderByKey(), startAt(oldestKey)),
    snap => {
      const message = parseMessage(snap);
      if (message) {
        onChange(message);
      }
    },
  );
}

// ===== Danh sách cuộc trò chuyện ở Home =====

// Lắng nghe userChats/{uid}: mỗi con là một cuộc trò chuyện (1-1 hoặc nhóm) của người dùng.
export function subscribeUserChats(
  uid: string,
  cb: (chats: UserChat[]) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'userChats/' + uid),
    snap => {
      const list: UserChat[] = [];
      snap.forEach(child => {
        const v = child.val();
        if (!child.key || typeof v?.updatedAt !== 'number') {
          return;
        }
        list.push({
          convId: child.key,
          lastMessage: typeof v.lastMessage === 'string' ? v.lastMessage : '',
          lastType: typeof v.lastType === 'string' ? v.lastType : 'text',
          lastSenderId:
            typeof v.lastSenderId === 'string' ? v.lastSenderId : '',
          lastMessageId:
            typeof v.lastMessageId === 'string' ? v.lastMessageId : '',
          updatedAt: v.updatedAt,
          // Bản ghi phía người gửi không có `unread` nên mặc định 0.
          unread: typeof v.unread === 'number' ? v.unread : 0,
        });
      });
      cb(list);
    },
    () => cb([]),
  );
}

// ===== Đã xem =====

// Đánh dấu đã đọc: đưa unread về 0 và ghi thời điểm đọc vào readStatus (dùng cho "Đã xem HH:mm").
// Chỉ gọi khi userChats/{me}/{convId} đã tồn tại, vì rules yêu cầu bản ghi đủ trường.
export function markRead(me: string, convId: string): Promise<void> {
  return update(ref(db), {
    [userChatPath(me, convId) + '/unread']: 0,
    ['readStatus/' + convId + '/' + me]: serverTimestamp(),
  });
}

// Lắng nghe readStatus/{convId}: { uid: thời điểm đọc cuối }.
export function subscribeReadStatus(
  convId: string,
  cb: (readAt: Record<string, number>) => void,
): Unsubscribe {
  return onValue(
    ref(db, 'readStatus/' + convId),
    snap => {
      const result: Record<string, number> = {};
      snap.forEach(child => {
        if (child.key && typeof child.val() === 'number') {
          result[child.key] = child.val();
        }
      });
      cb(result);
    },
    () => cb({}),
  );
}

// ===== Thu hồi và cảm xúc =====

// Thu hồi: KHÔNG xoá node, chỉ ghi recalled = true và xoá nội dung.
// Nếu đây là tin cuối thì sửa luôn dòng tin cuối ở Home của mọi thành viên trong cùng lệnh update.
export async function recallMessage(
  convId: string,
  msgId: string,
  me: string,
  members: string[],
): Promise<void> {
  // lastMessageId giống nhau ở mọi thành viên nên đọc bản của mình là đủ.
  const lastId = await get(
    ref(db, userChatPath(me, convId) + '/lastMessageId'),
  );

  const path = messagesPath(convId) + '/' + msgId;
  const updates: Record<string, unknown> = {
    [path + '/recalled']: true,
    [path + '/text']: null,
    [path + '/imageUrl']: null,
    [path + '/lat']: null,
    [path + '/lng']: null,
  };

  if (lastId.val() === msgId) {
    for (const uid of new Set([...members, me])) {
      updates[userChatPath(uid, convId) + '/lastMessage'] = RECALLED_TEXT;
      updates[userChatPath(uid, convId) + '/lastType'] = 'recalled';
    }
  }
  await update(ref(db), updates);
}

// Thả hoặc gỡ cảm xúc. Nhấn lại đúng emoji đang chọn thì gỡ, chọn emoji khác thì thay.
// Khi thả vào tin của người khác thì kèm thông báo "reaction" cho người gửi tin, trong cùng lệnh update.
export function toggleReaction(
  convId: string,
  message: Message,
  me: string,
  emoji: string,
): Promise<void> {
  const reactionPath =
    messagesPath(convId) + '/' + message.id + '/reactions/' + me;

  // Gỡ cảm xúc đang chọn.
  if (message.reactions[me] === emoji) {
    return remove(ref(db, reactionPath));
  }

  // Thả cảm xúc mới (+ thông báo nếu không phải tin của mình).
  const updates: Record<string, unknown> = { [reactionPath]: emoji };
  if (message.senderId !== me) {
    Object.assign(
      updates,
      newNotificationUpdate(message.senderId, 'reaction', convId, me, emoji),
    );
  }
  return update(ref(db), updates);
}
