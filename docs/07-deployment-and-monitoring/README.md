# 07 · Triển khai và theo dõi

## Đẩy bản
1. Sửa đặc tả (nếu đổi hành vi) → sửa mã.
2. **Tăng `gia-su-vNN` trong `sw.js`** (không thì điện thoại giữ bản cũ).
3. Thay tài nguyên (video/ảnh/glb) → đổi `?v=` trong đường dẫn nạp để phá cache điện thoại.
4. `node tools/qa.mjs` phải xanh.
5. `git push` lên `main` → GitHub Pages tự dựng (≈ 1 phút). Địa chỉ: `https://davidlee2199.github.io/gia-su-tieng-anh/`.

## Xác nhận sau khi đẩy
- `curl .../sw.js` thấy đúng số `gia-su-vNN`.
- Trên điện thoại: kéo xuống tải lại; nếu vẫn bản cũ → `registration.update()` rồi tải lại (hoặc xoá cache trang trong Chrome).
- Cài đặt như ứng dụng đã cài: Chrome cập nhật nền, có thể chậm đến một ngày.

## Theo dõi
Không có máy chủ nên không có log trung tâm. Dấu hiệu hỏng đo bằng: `tools/qa.mjs` (trước khi đẩy), thăm dò điện thoại qua CDP (`adb forward tcp:9555 localabstract:chrome_devtools_remote`), báo cáo của người dùng.
