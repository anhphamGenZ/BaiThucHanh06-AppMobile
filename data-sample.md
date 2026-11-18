(gốc)
├── conversations/lan_minh: { type: "direct", members: { lan: true, minh: true } }
├── messages/lan_minh/
│ ├── msg_01: { senderId: "minh", text: "Tối nay đi ăn lẩu không?",
│ │ reactions: { lan: "❤️", minh: "❤️" } }
│ └── msg_02: { senderId: "minh", recalled: true }
├── userChats/
│ ├── lan/lan_minh: { lastMessage: "Tin nhắn đã được thu hồi", unread: 0 }
│ └── minh/lan_minh: { lastMessage: "Tin nhắn đã được thu hồi", unread: 0 }
├── readStatus/lan_minh: { lan: 14:23:05 }
├── typing/lan_minh: (trống, không ai đang gõ)
└── status/
├── lan: { online: true, lastChanged: 14:20:00 }
└── minh: { online: false, lastChanged: 14:26:00 }

(gốc)
├── users/ 18 mục ← tài khoản (tên người dùng)
├── status/ 3 mục ← online/offline
├── conversations/ 3 mục ← các cuộc trò chuyện
├── messages/ 3 mục ← tin nhắn, chia theo cuộc trò chuyện
├── userChats/ 4 mục ← dòng ở màn hình Home của từng người
├── typing/ 2 mục ← ai đang gõ
└── notifications/ ← thông báo

conversations/BzQl…\_Ehx1…:
type: "direct" ← chat 1-1
members: { BzQl…: true, Ehx1…: true } ← 2 thành viên
createdBy: "BzQl…"
createdAt: 1794991331196 ← thời gian dạng số mili-giây

messages/BzQl…\_Ehx1…/m2:
senderId: "BzQl…", type: "image",
recalled: true ← tin ảnh đã bị thu hồi, không còn link ảnh

messages/BzQl…\_Ehx1…/m3:
senderId: "Ehx1…", type: "text", text: [an],
replyTo: { id: "m1", preview: "Xin chào" } ← tin trả lời tin m1 (Phần C)
