# 02 · Yêu cầu sản phẩm

Mỗi yêu cầu có mã để dẫn chiếu từ mã và bài kiểm. Cột "Kiểm" trỏ tới mục trong `docs/05-test-specification`.

| Mã | Yêu cầu | Tiêu chí nghiệm thu | Kiểm |
|---|---|---|---|
| REQ-01 | Gọi thoại trực tiếp với Sam (Gemini Live), chen ngang được | Bấm Gọi có tiếng ≤ 3 s; nói chen thì Sam dừng | M-01 |
| REQ-02 | Sam chỉ nói tiếng Anh, hiểu tiếng Việt | Hỏi bằng tiếng Việt → trả lời tiếng Anh + 1 dòng "người bản xứ nói…"; không bao giờ chữ Trung/Thái/Nhật/Hàn/Nga | A-lang, M-02 |
| REQ-03 | Nhân vật 3D: lip-sync, chớp mắt, biểu cảm, cử chỉ, mocap | Môi khớp giọng; có vẫy tay lúc bắt máy | M-03 |
| REQ-04 | Nhắn tin chữ với Sam; 💡 cách nói bản xứ, ✏️ sửa 1 dòng, 🗣 câu đọc to | Ba loại dòng hiển thị khác kiểu | A-chat |
| REQ-05 | Thi thử IELTS Speaking (P1-2-3), chấm Writing, lộ trình 40 bài band 5→8 | Có band từng tiêu chí + 3 việc cần sửa; lưu kết quả | M-04 |
| REQ-06 | Nhớ hồ sơ người học (band, điểm yếu) | Mở lại app vẫn còn; Sam tự ghi qua hàm `save_profile` | M-04 |
| REQ-07 | Cảnh 360° kéo xoay, không lộ mép vòm | Mọi góc nghiêng cho phép đều kín tranh | A-scene, M-05 |
| REQ-08 | Buổi (ngày/chiều/đêm) tự theo giờ máy, đổi tay được | Chip cảnh → bảng chọn; chuyển mờ dần 2–3 s | A-scene |
| REQ-09 | Thời tiết thật theo dự báo của khu vực đã chọn (10 khu VN) | Mưa/giông/tuyết/sương hiện đúng mã WMO; offline thì quang | A-weather |
| REQ-10 | Mùa theo khí hậu vùng: Bắc 4 mùa, Trung/Nam khô–mưa; video + cây hoa + lá rơi đổi theo | Bảng mùa trong `docs/03` đúng cho mọi vùng/tháng | A-season |
| REQ-11 | Đèn lồng trên bục sáng đêm, tắt ngày; đom đóm đêm, bụi nắng ngày; mưa/tuyết tắt hạt | Đèn đêm > 1.1, ngày < 0.05 | A-fx |
| REQ-12 | Giao diện dùng được bằng ngón tay trên 360–412 px | Không tràn ngang; nút ≥ 40 px | A-layout |
| REQ-13 | Cài được như ứng dụng, mở được khi mạng yếu | Manifest + service worker; vỏ app có trong cache | M-06 |
| REQ-15 | Khung toàn thân: thấy cả chân và bục, không bị hàng nút che | Chân Sam nằm trên hàng nút ở 393×873 | A-frame |
| REQ-16 | Mưa/giông/tuyết: Sam cầm dù giấy dầu (mô hình 3D `bg/du.glb`); mưa và tuyết CHẠM tán dù chứ không xuyên qua: mưa văng nước + nhỏ giọt từ mép, tuyết tan thành bụi rồi đọng dày dần trên tán; hết mưa tuyết thì tan; hết thì dù đóng | Dù mở khi mưa/giông/tuyết, đóng khi quang/sương; cả tán dù nằm trong màn; hạt trúng tán, ít lọt dưới | A-umbrella, A-physics, M-09 |
| REQ-14 | Chạy 60 fps trên máy chuẩn, kể cả lúc chuyển cảnh | Đo trên Redmi (xem 05) | M-07 |
