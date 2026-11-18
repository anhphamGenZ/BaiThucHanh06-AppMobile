import type { AppNotification } from '../types/models';

export type NotificationText = {
  // Tiêu đề thông báo hệ thống (notifee).
  title: string;
  // Nội dung thông báo hệ thống.
  body: string;
  // Một dòng đầy đủ để hiện trong màn Thông báo.
  line: string;
};

// Ghép câu hiển thị từ dữ liệu thô notifications/{uid}/{id}.
// Dùng chung cho màn Thông báo và thông báo cục bộ, để hai nơi nói giống nhau.
export function describeNotification(
  n: AppNotification,
  senderName: string,
  groupName?: string,
): NotificationText {
  switch (n.type) {
    case 'group_added': {
      const line = `${senderName} đã thêm bạn vào nhóm "${n.text}"`;
      return { title: 'Bạn được thêm vào nhóm', body: line, line };
    }
    case 'reaction':
      return {
        title: senderName,
        body: `Đã bày tỏ ${n.text} về tin nhắn của bạn`,
        line: `${senderName} đã bày tỏ ${n.text} về tin nhắn của bạn`,
      };
    default:
      // Tin nhắn mới: trong nhóm thì tiêu đề là tên nhóm, nội dung có tên người gửi.
      return groupName
        ? {
            title: groupName,
            body: `${senderName}: ${n.text}`,
            line: `${senderName} trong "${groupName}": ${n.text}`,
          }
        : { title: senderName, body: n.text, line: `${senderName}: ${n.text}` };
  }
}
