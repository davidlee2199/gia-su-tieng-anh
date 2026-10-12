# 01 · Ý định kỹ thuật

## Làm để làm gì
Một ứng dụng web (PWA) **miễn phí** để một người luyện nói tiếng Anh/IELTS với **Sam**: người bạn bản xứ nói chuyện bằng giọng, kiểu gọi video, có nhân vật 3D kiểu anime biết mấp máy môi, biểu cảm, cử chỉ, đứng trong một cảnh tiên hiệp xoay 360° đổi theo giờ, thời tiết, mùa ở Việt Nam.

## Ràng buộc cứng (vi phạm = lỗi)
1. **Miễn phí:** chỉ dùng gói free của Gemini (khoá do người dùng tự dán) và GitHub Pages. Không dùng dịch vụ tính tiền.
2. **Repo công khai:** không khoá API, không dữ liệu cá nhân, không email nội bộ trong repo.
3. **Một người dùng, một máy:** mọi dữ liệu người dùng ở `localStorage` trên máy; không có máy chủ riêng.
4. **Điện thoại tầm trung (Redmi Note 12 Pro) là máy chuẩn:** mục tiêu 60 fps; không phụ thuộc máy tính mở sẵn.
5. **Sam chỉ NÓI tiếng Anh** (nghe được tiếng Việt, trả lời bằng tiếng Anh dễ hiểu); tiếng Việt chỉ khi được bảo rõ hoặc trong giải thích bài học.
6. **Giấy phép tài nguyên:** chuyển động Bandai Namco Research là CC BY-NC-ND (phi thương mại, cấm phát tán bản chỉnh) → tải lúc chạy từ CDN, KHÔNG lưu bản dẫn xuất trong repo.

## Không làm (non-goals)
- Chạy mô hình ngôn ngữ ngay trên điện thoại (đã thử: sập/quá chậm trên máy này).
- Tài khoản, đồng bộ nhiều máy, thanh toán.
- Nhân vật hay nội dung khêu gợi.
- Dùng ảnh chụp thật làm nền (đã thử, bị loại: không hợp phong cách).

## Thành công là gì
Mở app → bấm Gọi → nói chuyện trôi chảy với Sam trong ≤ 3 giây có tiếng; cảnh đẹp, nét, mượt; ghi nhớ band IELTS và điểm yếu giữa các buổi.
