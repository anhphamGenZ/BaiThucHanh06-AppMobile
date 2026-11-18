import {
  increment,
  push,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';
import type { Me } from '../types/models';
import { sendSystemMessage } from './chatService';
import { db } from './firebase';
import { newNotificationUpdate } from './notificationService';

// Số người tối thiểu phải chọn, không tính người tạo nhóm.
export const MIN_GROUP_PICK = 2;

// Tạo nhóm bằng MỘT lệnh update() nhiều đường dẫn:
//   1. conversations/{id}: type "group", tên, members, người tạo;
//   2. messages/{id}/{key}: tin hệ thống "A đã tạo nhóm X";
//   3. userChats/{m}/{id} của mọi thành viên (người khác có unread = 1);
//   4. notifications/{m}/{pushId} loại "group_added" cho từng người được thêm.
// Rules kiểm tra thành viên bằng newData, vì conversations/{id} chưa có trong DB lúc đánh giá.
export async function createGroup(
  me: Me,
  name: string,
  memberIds: string[],
): Promise<string> {
  const groupName = name.trim();
  const others = [...new Set(memberIds)].filter(uid => uid !== me.id);
  if (!groupName || others.length < MIN_GROUP_PICK) {
    throw new Error('Nhóm cần tên và ít nhất 2 thành viên khác');
  }

  // Sinh mã nhóm và mã tin hệ thống ngay ở máy (push() chưa ghi gì lên server).
  const convId = push(ref(db, 'conversations')).key;
  const msgKey = convId ? push(ref(db, 'messages/' + convId)).key : null;
  if (!convId || !msgKey) {
    throw new Error('Không tạo được mã nhóm');
  }

  const everyone = [me.id, ...others];
  const systemText = `${me.name} đã tạo nhóm "${groupName}"`;

  // (1) Thông tin nhóm.
  const members: Record<string, true> = {};
  for (const uid of everyone) {
    members[uid] = true;
  }
  const updates: Record<string, unknown> = {
    ['conversations/' + convId]: {
      type: 'group',
      name: groupName,
      members,
      createdBy: me.id,
      createdAt: serverTimestamp(),
    },
    // (2) Tin hệ thống đầu tiên của nhóm.
    ['messages/' + convId + '/' + msgKey]: {
      senderId: me.id,
      type: 'system',
      text: systemText,
      createdAt: serverTimestamp(),
    },
  };

  // (3) Dòng nhóm ở Home của từng thành viên.
  for (const uid of everyone) {
    const base = 'userChats/' + uid + '/' + convId;
    updates[base + '/lastMessage'] = systemText;
    updates[base + '/lastType'] = 'system';
    updates[base + '/lastSenderId'] = me.id;
    updates[base + '/lastMessageId'] = msgKey;
    updates[base + '/updatedAt'] = serverTimestamp();
    if (uid !== me.id) {
      updates[base + '/unread'] = increment(1);
    }
  }

  // (4) Thông báo "được thêm vào nhóm"; text lưu tên nhóm để hiển thị.
  for (const uid of others) {
    Object.assign(
      updates,
      newNotificationUpdate(uid, 'group_added', convId, me.id, groupName),
    );
  }

  await update(ref(db), updates);
  return convId;
}

// ===== Quản trị nhóm =====
// Mỗi thao tác là MỘT lệnh update: thay đổi nhóm + tin hệ thống + dòng tin cuối ở Home của thành viên.

// Đổi tên nhóm (mọi thành viên đều được đổi).
export function renameGroup(
  convId: string,
  me: Me,
  members: string[],
  newName: string,
): Promise<void> {
  const name = newName.trim();
  return sendSystemMessage(
    convId,
    members,
    me.id,
    `${me.name} đã đổi tên nhóm thành "${name}"`,
    { extra: { ['conversations/' + convId + '/name']: name } },
  );
}

// Thêm thành viên (chỉ người tạo nhóm). Người mới có dòng nhóm ở Home và thông báo "group_added".
export function addMembers(
  convId: string,
  me: Me,
  members: string[],
  groupName: string,
  newMembers: { id: string; name: string }[],
): Promise<void> {
  const extra: Record<string, unknown> = {};
  for (const member of newMembers) {
    extra['conversations/' + convId + '/members/' + member.id] = true;
    Object.assign(
      extra,
      newNotificationUpdate(member.id, 'group_added', convId, me.id, groupName),
    );
  }
  const names = newMembers.map(m => m.name).join(', ');
  return sendSystemMessage(
    convId,
    [...members, ...newMembers.map(m => m.id)],
    me.id,
    `${me.name} đã thêm ${names}`,
    { extra },
  );
}

// Xoá một thành viên (chỉ người tạo nhóm). Người bị xoá mất dòng nhóm ở Home và mất quyền đọc tin.
export function removeMember(
  convId: string,
  me: Me,
  members: string[],
  member: { id: string; name: string },
): Promise<void> {
  return sendSystemMessage(
    convId,
    members.filter(uid => uid !== member.id),
    me.id,
    `${me.name} đã xoá ${member.name} khỏi nhóm`,
    {
      extra: {
        ['conversations/' + convId + '/members/' + member.id]: null,
        ['userChats/' + member.id + '/' + convId]: null,
      },
    },
  );
}

// Tự rời nhóm: xoá mình khỏi members và xoá dòng nhóm ở Home của mình.
// Tin "A đã rời nhóm" chỉ cập nhật Home của những người còn lại (includeSender = false).
export function leaveGroup(
  convId: string,
  me: Me,
  members: string[],
): Promise<void> {
  return sendSystemMessage(
    convId,
    members.filter(uid => uid !== me.id),
    me.id,
    `${me.name} đã rời nhóm`,
    {
      includeSender: false,
      extra: {
        ['conversations/' + convId + '/members/' + me.id]: null,
        ['userChats/' + me.id + '/' + convId]: null,
      },
    },
  );
}
