# Báo cáo kiểm thử – Bài thực hành 06

Ngày 2026-11-18. Thiết bị: máy ảo Android 16 `Pixel_7_TH06` (đăng nhập user1 – Nguyễn An) và `Pixel_8_Pro` (user2 – Trần Bình). Dự án Firebase `chat-nang-cao-th06`. Thành viên thứ ba và thứ tư của nhóm (user3 – Lê Chi, user4 – Phạm Dũng) do một script REST đóng vai. Script ghi dữ liệu theo đúng cấu trúc và cùng các luật như app, vì máy chỉ chạy được 2 máy ảo.

Ảnh chụp lưu trong `docs/screenshots/bai06/`.

## 1. Kiểm tra tĩnh và build

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| Kiểu TypeScript | `npx tsc --noEmit` | Không lỗi |
| Lint mã app | `npx eslint src __tests__ App.tsx index.js` | Không lỗi, không cảnh báo |
| Test render | `npm test` | 1/1 pass |
| Không có API secret | tìm `api_secret`, `apiSecret`, `api_key` trong `src/` | Không có kết quả |
| Build Android debug (RN 0.87, new architecture) | `gradlew app:installDebug` | `BUILD SUCCESSFUL` trong 2 phút 6 giây, gồm `react-native-image-picker` 8.3.0, `@react-native-clipboard/clipboard` 1.16.3, `@notifee/react-native` 9.1.8 |

## 2. Kiểm thử Security Rules

Script gọi REST API của Realtime Database bằng 4 tài khoản tạm (đã xoá sau khi chạy), cho kết quả **33/33** đúng như mong đợi. Chi tiết nằm trong [báo cáo luật bảo mật](bao-cao-security-rules-bai06.docx).

Lỗi phát hiện nhờ kiểm thử: tạo nhóm bị từ chối, vì rule ghi `messages` chỉ kiểm tra thành viên trong `root` (trạng thái trước lệnh). Đã sửa để kiểm tra cả trạng thái sau lệnh, deploy lại, rồi chạy lại cho kết quả 33/33.

Trên máy ảo kiểm tra thêm: sau khi bị xoá hoặc tự rời nhóm, Phạm Dũng và Lê Chi đọc tin nhóm đều nhận `401 Permission denied`.

## 3. Luồng chat nhóm (ưu tiên)

| # | Bước | Kết quả | Ảnh |
|---|---|---|---|
| 1 | An mở Tạo nhóm, nhập tên. Chọn 1 người thì nút Tạo nhóm vẫn mờ; chọn 3 người thì nút bật | Đạt | `04-tao-nhom.png` |
| 2 | Tạo nhóm: An vào thẳng nhóm, có tin hệ thống "Nguyễn An đã tạo nhóm…", tiêu đề "3 đang online · 4 thành viên" | Đạt | – |
| 3 | Bình (Pixel 8) thấy nhóm ngay ở Home, số chưa đọc 1, badge Tin nhắn 1, badge Thông báo tăng | Đạt | – |
| 4 | Chi và Dũng nhắn vào nhóm: An thấy ngay, tên người gửi hiện ở tin đầu của mỗi chuỗi tin; số chưa đọc của Bình tăng lên 4; Home hiện "Dũng: …" | Đạt | – |
| 5 | An đang mở nhóm thì số chưa đọc không tăng và không có thông báo (`activeConv`) | Đạt | – |
| 6 | Đang soạn tin trong nhóm: "Bình, Chi đang soạn tin…"; Bình dừng gõ 3 giây thì chỉ còn "Chi đang soạn tin…" | Đạt | `05-chat-nhom-ten-nguoi-gui.png` |
| 7 | An gửi tin: "Đã gửi"; Bình mở nhóm và Chi đọc thì thành "Đã xem bởi 2 người" | Đạt | `05-chat-nhom-ten-nguoi-gui.png` |
| 8 | Gửi vị trí trong nhóm (máy ảo đặt 21.046461, 105.792206) | Đạt | – |
| 9 | Chụp ảnh và gửi trong nhóm qua Cloudinary | Đạt | – |
| 10 | Thông tin nhóm: đổi tên. Máy Bình đổi tiêu đề ngay, có tin hệ thống | Đạt | `08-thong-tin-nhom.png` |
| 11 | Trưởng nhóm thêm Bùi Linh: Linh có dòng nhóm (unread 1), thông báo `group_added`, đọc được tin nhóm | Đạt | – |
| 12 | Trưởng nhóm xoá Phạm Dũng (có xác nhận): Dũng mất dòng nhóm và bị từ chối khi đọc tin | Đạt | – |
| 13 | Lê Chi rời nhóm: mọi người thấy "Lê Chi đã rời nhóm", danh sách thành viên tự cập nhật còn 3, Chi bị từ chối khi đọc tin | Đạt | `07-quan-tri-nhom-tin-he-thong.png` |

## 4. Các tính năng khác

| Tính năng | Kết quả | Ảnh |
|---|---|---|
| Chat 1-1: "đang soạn tin…" ở tiêu đề và "Đã xem 16:20" dưới tin cuối | Đạt | `01-dang-soan-tin-da-xem.png` |
| Menu nhấn giữ: 5 cảm xúc, Trả lời, Sao chép, Thu hồi (tin của mình), Huỷ | Đạt | `09-menu-nhan-giu.png` |
| Thu hồi: "Tin nhắn đã được thu hồi" ở cả hai máy; cảm xúc gom số lượng "❤️ 2" | Đạt | `02-thu-hoi-cam-xuc.png` |
| Gửi ảnh: chụp bằng camera; xin quyền camera và vị trí lần đầu | Đạt | `03-tin-anh.png` |
| Tắt mạng khi gửi ảnh: "Tải ảnh thất bại" có nút "Thử lại"/"Bỏ"; bật mạng rồi Thử lại thì hiện "Đang gửi ảnh…" và gửi thành công | Đạt | `03a-anh-loi-thu-lai.png`, `03c-dang-gui-anh.png` |
| Nhấn ảnh xem toàn màn hình, nút ✕ để đóng | Đạt | `03b-xem-anh-toan-man-hinh.png` |
| Home hiện "📷 Hình ảnh" khi tin cuối là ảnh | Đạt | – |
| Thông báo: badge 4; hai tin liên tiếp gộp thành một thông báo; có thông báo cảm xúc và tin nhóm | Đạt | `06-thong-bao-badge.png` |
| Nhấn thông báo: mở đúng nhóm, badge giảm từ 4 xuống 3; "Đánh dấu tất cả đã đọc" đưa badge về 0 | Đạt | `06b-danh-dau-tat-ca-da-doc.png` |
| Tải theo trang: chat có hơn 25 tin, kéo lên thì tải thêm tới tin đầu tiên | Đạt | – |
| Tìm kiếm không dấu: "hop" ra "họp"; nhấn kết quả thì cuộn tới tin và tô sáng | Đạt | `10-tim-kiem-khong-dau.png` |
| Trả lời trích dẫn (sinh viên tự thử trên máy Bình): tin trả lời hiện khung trích dẫn tin của Phạm Dũng | Đạt | – |
| Thông báo hệ thống (notifee) khi app ở nền; nhấn vào mở đúng chat | Đạt (mở chat mất khoảng 5–8 giây vì app vừa kết nối lại) | `11-thong-bao-he-thong-notifee.png` |
| Đổi ảnh đại diện | Chưa thử trên giao diện; rule `avatarUrl` đã kiểm thử qua REST | – |

## 5. Vấn đề ghi nhận

- Icon nhỏ của thông báo hệ thống hiện thành ô vuông trắng, vì `smallIcon` đang dùng icon launcher. Muốn đẹp cần thêm một icon đơn sắc vào `res/drawable`.
- Avatar nhóm lấy chữ cái đầu của từ cuối trong tên (ví dụ "Nhom Bai 06" ra "0"), vì quy tắc này được thiết kế cho tên người Việt.
- `adb shell input text` không gõ được tiếng Việt có dấu, nên tên nhóm và một số tin gõ trên máy ảo là không dấu. Đây là giới hạn của công cụ test, không phải của app.
- `uiautomator dump` không chạy được vì app luôn có hiệu ứng pulse, nên test tự động phải bấm theo toạ độ.
- Dữ liệu test (25 tin thử tải trang và 3 tài khoản phụ) đã được sao lưu rồi xoá sau khi test, để dữ liệu demo chỉ còn các cuộc trò chuyện tự nhiên giữa tài khoản mẫu.
