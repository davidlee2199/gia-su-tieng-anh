# 04 · API và dữ liệu

## Dịch vụ ngoài
| Dịch vụ | Dùng để | Khoá | Lùi khi hỏng |
|---|---|---|---|
| Gemini REST `gemini-flash-lite-latest` | Chat chữ, chấm Writing, giáo trình | Người dùng dán (`gs_key`) | Báo lỗi trong khung chat |
| Gemini Live `gemini-3.8-live`, giọng Aoede (WebSocket) | Gọi thoại | cùng khoá | Thông báo "Mất kết nối… Bấm Gọi lại" |
| Open-Meteo `/v1/forecast?current=weather_code` | Thời tiết thật theo toạ độ khu vực | không cần | Mặc định "quang" |
| jsDelivr | three, TalkingHead, BVH mocap của Bandai Namco | không | Không cử chỉ mocap; cảnh vẫn chạy |

## Gemini Live
`setup`: model, `responseModalities: [AUDIO]`, giọng, `systemInstruction = livePrompt()`, bật `inputAudioTranscription` + `outputAudioTranscription`, hai hàm:
- `save_profile(band, weak[], note)` — cập nhật hồ sơ người học.
- `save_speaking_result(...)` — ghi kết quả thi thử Speaking.
Âm vào: PCM 16 kHz. Âm ra: PCM 24 kHz phát qua Web Audio và cấp cho HeadAudio (viseme).
**Luật ngôn ngữ** nằm ở đầu và cuối `livePrompt()`; thêm bộ chặn `FOREIGN` (regex chữ Hán/Nhật/Hàn/Thái/Nga/Ả Rập/Hindi): gặp trong lời Sam → cắt tiếng + gửi nhắc "nói lại bằng tiếng Anh".

## Dữ liệu trên máy (`localStorage`)
| Khoá | Nội dung |
|---|---|
| `gs_key` | Khoá Gemini của người dùng (không bao giờ vào repo) |
| `gs_model`, `gs_about` | Model; mô tả người dùng cho Sam (chỉ trên máy) |
| `ie_profile`, `ie_hist`, `ie_mode`, `ie_unit`, `ie_scores`, `ie_tests` | Hồ sơ band, lịch sử chat, chế độ, bài đang học, điểm, bài thi |
| `dn`, `wx`, `kv` | Buổi, thời tiết, khu vực (`auto` hoặc giá trị chọn tay) |
| `dh` | Đã hiện gợi ý "kéo để xoay" |
Mỗi lần đọc/ghi bọc `try/catch` (chế độ riêng tư có thể chặn).

## Khu vực (`REGIONS`)
Hà Nội, Sa Pa, Hải Phòng (Bắc) · Huế, Đà Nẵng, Nha Trang (Trung) · Đà Lạt, TP.HCM, Cần Thơ, Phú Quốc (Nam). Mã WMO → kiểu: ≥95 giông; 51–67 & 80–82 mưa; 71–77, 85, 86 tuyết; 45, 48 sương; còn lại quang.
