# 05 · Đặc tả kiểm thử

## Tự động: `node tools/qa.mjs` (≈ 2 phút, mã thoát 1 nếu có ❌)
**QA (mã & kho):** cú pháp mọi `.mjs` + script trong `index.html` · file tham chiếu có thật · dung lượng `bg/` ≤ 22 MB, `sam.glb` ≤ 14 MB · không lộ khoá/email nội bộ · `sw.js` đã tăng phiên bản khi đổi nội dung · commit đã đẩy.
**QC (chạy thật Chrome headless):**
| Mã | Kiểm |
|---|---|
| A-layout | 360, 393, 412, 1280: không tràn ngang; nút ≥ 40 px |
| A-scene | Nhân vật, bục, đèn nạp được; video ≥ 720p chạy thật, tiến khung hình; bảng cảnh mở, gọn trong màn, tự đóng |
| A-fx | 90 tổ hợp buổi×thời tiết×mùa không lỗi; đèn đêm sáng, ngày tắt |
| A-season | Mùa theo vùng/tháng; mỗi mùa có video; toạ độ 10 khu vực nằm trong Việt Nam |
| A-weather | Mã WMO → kiểu đúng; Open-Meteo trả số |
| A-frame | Chân Sam nằm trên hàng nút (khổ 393×873) |
| A-umbrella | Mưa/giông/tuyết: dù (mô hình) đã nạp, mở hết cỡ, tán + chân nằm trong màn; quang/sương: dù đóng |
| A-physics | Mưa: ≥ 20 va chạm tán trong 5 s và lọt dưới < 30%; tuyết: độ đọng tăng dần |
| A-chat | Chế độ Tâm sự: prompt có luật chỉ nói tiếng Anh + không dạy, không còn nội dung IELTS, nạp ghi chú trí nhớ; có 2 nút chọn chế độ |
| A-hsk | Chế độ HSK3: prompt gọi + chat có HSK 3, nạp ghi chú tiến độ, chat chữ có dòng 🗣, bộ lọc cho chữ Hán nhưng vẫn chặn Nhật/Hàn |
| A-drill | Prompt chế độ Học (gọi + chat chữ) chứa PHRASE DRILL: phản ứng hài, câu đúng theo ngữ cảnh, bắt nói lại |
| A-lang | Luật "chỉ nói tiếng Anh" có trong lời dặn; `FOREIGN` bắt đúng; |
| A-chat | Dòng 💡 ✏️ 🗣 có kiểu riêng; tab IELTS và Cài đặt mở được |
| A-console | Không lỗi console/exception cả phiên |
Giới hạn: headless vẽ chậm → KHÔNG đo được fps máy thật. Điều kiện chờ dùng vòng lặp thăm dò, không `sleep` cố định.

## Tay trên điện thoại thật (trước mỗi bản lớn) — chi tiết ở `tests/may-that.md`
M-01 Gọi · M-02 Hỏi tiếng Việt · M-03 Môi/cử chỉ · M-04 Thi thử + nhớ hồ sơ · M-05 Xoay 360° · M-06 Cài đặt như ứng dụng, mở khi mạng yếu · **M-07 fps 60** (cắm máy, đo bằng CDP: `adb forward tcp:9555 localabstract:chrome_devtools_remote`).

## Quy tắc
Sửa giao diện → xem ảnh chụp ở đúng khổ máy (393×873) trước khi đẩy. Đừng tin "không tràn ngang" thay cho nhìn ảnh.
