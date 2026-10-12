# Đặc tả của Sam (làm theo đặc tả)

Đặc tả là **nguồn sự thật**; mã chạy theo đặc tả, không ngược lại. Đổi hành vi → sửa đặc tả TRƯỚC, rồi mới sửa mã, rồi chạy `node tools/qa.mjs`.

| Thư mục | Trả lời câu hỏi |
|---|---|
| `docs/01-engineering-intent/` | Làm để làm gì, KHÔNG làm gì, ràng buộc cứng |
| `docs/02-product-requirements/` | Sản phẩm phải làm được gì (REQ-xx + tiêu chí nghiệm thu) |
| `docs/03-technical-spec/` | Mã chia thế nào, chạy ra sao |
| `docs/04-api-and-data-design/` | Gọi dịch vụ nào, lưu dữ liệu gì ở đâu |
| `docs/05-test-specification/` | Kiểm bằng cách nào (tự động + tay trên điện thoại) |
| `docs/06-security-and-reliability/` | Bảo mật, giấy phép, hỏng thì lùi về đâu |
| `docs/07-deployment-and-monitoring/` | Đẩy lên và theo dõi ra sao |
| `docs/08-maintenance-and-spec-drift/` | Giữ đặc tả khớp mã; bẫy đã gặp; tái tạo tài nguyên |
| `tasks/` | Việc đang chờ (`agent-task-list.md`) + ghi chú duyệt (`review-notes.md`) |
| `tests/` | Bộ kiểm tra tay trên máy thật (bộ tự động nằm ở `tools/qa.mjs`) |
| `changelog/` | Lịch sử bản phát hành |

Mã nguồn giữ ở GỐC repo (index.html, xianxia.mjs, mocap.mjs, sw.js, bg/, sam.glb, tools/) vì GitHub Pages phục vụ từ gốc; không chuyển vào `app/`.
Repo này **công khai** → không đưa khoá API, thông tin cá nhân, email nội bộ vào bất kỳ tệp nào (`tools/qa.mjs` có mục kiểm).
