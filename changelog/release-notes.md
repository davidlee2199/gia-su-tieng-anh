# Lịch sử phát hành

Tóm tắt từ `git log` (mới → cũ). Phiên bản service worker `gia-su-vNN` tăng mỗi lần đẩy.

## 2026-10-12

- QA
- Thêm bộ QA/QC tự động (tools/qa.mjs

## 2026-10-09

- Nền hết nhòe
- Đèn lồng trên bục tự sáng theo buổi (ngày tắt · chiều hửng · đêm sáng ấm lung linh, hắt ánh lên Sam); mạn-đà-la trên sàn phát sáng về đêm; đom đóm đêm, bụi nắng
- Bục đứng mới
- Giao diện mới
- Sam nghe được tiếng Việt nhưng luôn trả lời bằng tiếng Anh dễ hiểu (gọi thoại + nhắn tin), kèm cách nói câu đó bằng tiếng Anh; chỉ đổi sang tiếng Việt khi được 

## 2026-10-08

- Mùa đông dùng video mới (mua dong 2): đoạn đông dài gấp đôi, sương sáng
- Gọi thoại
- Sam chỉ nói tiếng Anh/tiếng Việt
- Cảnh động theo mùa
- Sam để mái ngang: cắt phẳng tóc mái ở chân mày (MAI=1.53 trong script chuyển VRoid)
- Cây hoa trên tranh đổi màu theo mùa (mặt nạ bg/hoa.png + shader); chuyển buổi/thời tiết/mùa mờ dần mượt thay vì bật tắt
- Chọn khu vực Việt Nam
- Ngày/chiều/đêm tự theo giờ máy (+ đổi tay) và thời tiết
- Nền phát được video lặp vòng (bg/tien-canh.mp4) trên vòm 360°, không có thì dùng tranh tĩnh
- Nền = tranh tiên cảnh anime David vẽ bằng Gemini Pro, dán lên vòm 360° (nửa sau lật gương); ẩn núi/đảo/cây dựng bằng khối
- Tiên cảnh kiểu anime thay ảnh chụp thật
- Nền ảnh chụp 360° thật (Poly Haven CC0): vách đá, rừng sương, hoàng hôn + nút đổi cảnh
- Sam: motion capture thật của Bandai Namco Research (cúi chào, vẫy tay, chỉ dẫn, đáp lời, nhảy)
- Sam: cảnh tiên hiệp 3D xoay 360 độ, cử chỉ dễ thương theo lời nói và lúc nghe
- Sam: da trắng hồng, thêm má hồng
- Màn gọi: nền tối cho dòng trạng thái để đọc được trên váy trắng
- Sam: sống mũi cao hơn; khung chân dung nửa người thấy tay, vẫy tay chào khi bắt máy

## 2026-10-07

- Sam: tô son hồng đỏ có bóng, môi đầy hơn, thêm lỗ mũi
- Sam = nhân vật David tự nặn trong VRoid (tóc đỏ rượu, váy fantasy); hạ đèn để da/tóc đúng màu
- Sam kiểu nhân viên văn phòng: tóc đỏ rượu vang, mắt hổ phách lim dim, son, gile đen sơ mi trắng
- Sam thành cô gái anime châu Á tóc đen (VRoid mẫu CC0), nhìn thẳng, đồ thường thay đồng phục
- Sửa lỗi cú pháp module mặt 3D (chú thích nuốt mất cuối dòng)
- Mặt 3D: vẽ ở độ nét 1.5 để điện thoại chạy 60 fps (trước 14 fps)
- Gọi kiểu FaceTime: mặt Sam 3D cử động, mấp máy miệng theo giọng, chớp mắt, đổi biểu cảm
- Ô 'Sam nên biết gì về bạn' (chỉ lưu trên máy) để Sam chọn chủ đề và cách nói hợp người dùng
- Gọi thoại trực tiếp với Sam (Gemini Live): giọng có cảm xúc, chen ngang, song ngữ Anh–Việt giọng miền Nam
- Icon mới làm bằng Magnific (cô gái nháy mắt, son đỏ), bỏ bản SVG tự vẽ
- Icon mới: cô gái tóc dài nháy mắt, son đỏ (tự vẽ SVG), ảnh đại diện trên đầu app
- Sam chuyên IELTS, nói như người bản xứ
- Không đoán level từ trò chuyện trước 8 câu (Lite từng phán B2 sau 1 câu)
- Chọn đúng giọng en-US trên Chrome Android (mã giọng dạng en_US)
- Gộp tất cả vào Sam: nói chuyện là chính, thêm tab Lộ trình & Điểm
- Đổi thành Sam: bạn nói chuyện tiếng Anh, tự đoán level, mặc định Flash-Lite
- Tự gọi lại khi Gemini báo 503 quá tải
- Gia sư tiếng Anh: app PWA đo trình độ, học bài, nói chuyện (Gemini free)

