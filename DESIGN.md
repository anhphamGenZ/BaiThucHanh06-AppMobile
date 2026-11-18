# Quy ước giao diện

Giá trị cụ thể nằm trong `src/theme/index.ts`; component chỉ lấy màu, khoảng cách, bo góc từ token, không viết hex trực tiếp.

## Màu
- Nền `#F6F4EF`, thẻ `#FFFFFF`, chữ `#111827`, chữ phụ `#6B7280`.
- Chính: teal `#0B7A7C` (đậm `#064E50`, sáng `#2BB5B0`); nền teal nhạt `#E3F4F4` / `#F0F9F8`.
- Trạng thái: online `#22C55E` (chữ `#15803D`), offline `#9CA3AF`, lỗi `#EF4444`.
- `warm` `#F2994A` chỉ dùng làm điểm nhấn, không dùng cho chữ hay nút.

## Chữ, khoảng cách, bo góc
- Font hệ thống (Roboto). Cỡ: `display` 28, `screenTitle` 26, `name` 16, `body` 15, `bodyMuted` 14, `caption` 12, `overline` 11 (in hoa).
- Spacing: 4 · 8 · 12 · 16 · 24 · 32. Lề ngang màn hình 16.
- Radius: `sm` 8 · `md` 12 · `lg` 16 · `xl` 20 · `xxl` 28 · `tail` 6 · `pill`. `tail` là góc nhỏ ở thẻ, nút chính, ô nhập.

## Chuyển động
- `fast` 150ms, `base` 220ms, `pulse` 1600ms; so le 35ms tối đa 8 mục; nhấn co về 0.97.
- Dùng `Animated` (native driver) và `LayoutAnimation`; tắt khi bật "Giảm chuyển động" (`useReducedMotion`).

## Component
- Danh sách là nhóm thẻ bo góc trên nền kem, ngăn cách bằng `InsetSeparator`.
- Home: lời chào, ô tìm, thẻ hộp thư, dải "Đang hoạt động", chip lọc Tất cả / Chưa đọc / Online, danh sách.
- Danh bạ: sắp xếp A→Z, nhóm theo chữ cái đầu (Đ riêng, ký tự lạ vào `#`), tiêu đề nhóm dính khi cuộn.
- Dòng chưa đọc: nền `primaryMist`, tên đậm, `UnreadBadge`.
- Online: chấm xanh trên avatar; `pulse` chỉ dùng ở vài chỗ (header, dải Đang hoạt động, ChatHeader).
- Tin nhắn vị trí trong chat: thẻ bản đồ có icon `mapPin`. Dòng tin cuối ở Home dùng đúng chuỗi đề bài yêu cầu: "📍 Vị trí", "📷 Hình ảnh".
- Tìm kiếm: ô pill, đoạn khớp tô bằng `HighlightText`. Đang tải dùng `SkeletonList`, danh sách rỗng dùng `EmptyState`.
- Vùng chạm tối thiểu 44×44; nút chỉ có icon phải có `accessibilityLabel`.
