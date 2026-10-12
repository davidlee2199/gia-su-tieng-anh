# 06 · Bảo mật và độ tin cậy

## Bảo mật
- Khoá Gemini chỉ ở `localStorage` của máy người dùng; **không** có trong mã, commit, hay URL chia sẻ.
- Repo công khai: `tools/qa.mjs` quét khoá (`AIza…`, `sk-…`, khoá riêng) và email nội bộ.
- Mô tả cá nhân người dùng (`gs_about`) chỉ nằm trên máy.
- Không bật micro khi chưa bấm Gọi; kết thúc gọi thì giải phóng micro + khoá màn hình.

## Giấy phép
| Tài nguyên | Giấy phép | Cách dùng |
|---|---|---|
| TalkingHead, HeadAudio | MIT | Nạp từ CDN |
| three.js | MIT | CDN |
| Chuyển động Bandai Namco Research | CC BY-NC-ND | Tải lúc chạy từ CDN; không lưu/không phát tán bản chỉnh; ghi công trong Cài đặt |
| Nhân vật | Do chủ dự án tự nặn trong VRoid | `tools/sam-david.vrm` |
| Bục 3D | Tạo bằng Magnific (gói trả phí của chủ dự án) | `bg/buc.glb` |
| Video/tranh nền | Chủ dự án tự tạo bằng Gemini | `bg/` |

## Độ tin cậy — lùi từng bước
| Hỏng | Hành vi |
|---|---|
| Video nền không tải | Dùng tranh tĩnh theo buổi |
| `buc.glb` không tải | Đĩa ngọc trơn |
| Open-Meteo lỗi/offline | Thời tiết "quang" |
| Mocap không tải | Không cử chỉ mocap, các cử chỉ khác vẫn chạy |
| Mất Gemini Live | Thông báo, bấm Gọi lại |
| Sam lỡ nói ngôn ngữ lạ | Cắt tiếng, nhắc nói lại tiếng Anh |
| `localStorage` bị chặn | Vẫn chạy, không nhớ |
