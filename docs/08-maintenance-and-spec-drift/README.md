# 08 · Bảo trì và lệch đặc tả

## Lệch đặc tả là gì
Mã làm một đằng, đặc tả nói một nẻo. Phát hiện: `tools/qa.mjs` kiểm các con số/bảng có thể kiểm tự động (mùa theo vùng, mỗi mùa có video, mã WMO, nút ≥ 40 px, luật ngôn ngữ). Phần còn lại soát tay khi mở PR/commit: **mỗi commit đổi hành vi phải có dòng cập nhật ở `docs/` hoặc ghi rõ "không đổi đặc tả"**.

## Điểm neo đặc tả ↔ mã
| Đặc tả | Mã |
|---|---|
| Mùa theo vùng (03) | `seasonOf`, `SEASONS`, `REGIONS` trong `xianxia.mjs` |
| Hiệu ứng theo buổi (03) | `FX`, `setupFx` |
| Luật ngôn ngữ (02/04) | `livePrompt()`, `FOREIGN`, `onLive()` |
| Hạn mức camera (03) | `minPolarAngle/maxPolarAngle` trong `index.html` |

## Tái tạo tài nguyên (đều có script trong `tools/`)
| Việc | Lệnh / script |
|---|---|
| Chuyển nhân vật VRoid → GLB (+ mái ngang) | `MAI=1.53 blender -b --python tools/vroid-to-talkinghead-giu-mau.py -- <thư mục công cụ TalkingHead, đường dẫn tuyệt đối> sam-david.vrm sam.glb` |
| Nén texture GLB | `tools/nen-glb-texture.py` |
| Mặt nạ cây hoa (chạy lại khi đổi tranh nền) | `tools/mat-na-hoa-theo-mua.py` |
| Cắt video mùa thành vòng lặp | `tools/cat-video-mua-lap-vong.py` |
| Làm nét video bằng Real-ESRGAN | `tools/lam-net-video-nen.py` |
| Chuẩn hoá mô hình dù (xoay thẳng, kéo cán, đo hồ sơ mặt tán `PROF`) | `tools/chuan-hoa-du.py` rồi `D: - Cá nhân\_tmp-sam\cat_can.py` (cắt cán, tua) rồi `tools/nen-glb-texture.py` — chạy lại thì phải dán `PROF` mới vào `xianxia.mjs` |

## Bẫy đã trả giá
- Heredoc Bash + Python làm `\b` thành ký tự backspace trong regex → viết script ra tệp rồi chạy.
- Chèn chú thích bằng `sed` giữa dòng làm nuốt phần code sau nó → luôn `node --check`.
- Hệ số màu glTF là **tuyến tính**; nhập sRGB thì tóc ra hồng.
- Mô hình 3D tạo bằng AI hay quay mặt +X, không phải +Z.
- Xoay hông bằng mocap làm người trượt tới máy quay → chỉ thân trên, trừ điệu nhảy.
- Chrome Android ghi giọng `en_US` (gạch dưới).
- Veo (video từ ảnh) lấy ảnh tải lên làm khung đầu → muốn đổi cảnh phải sửa ảnh tĩnh trước.
- Tab điện thoại bị ẩn thì `requestAnimationFrame` dừng → lệnh đo fps treo.
- Chrome headless tải qua mạng: dùng đồng hồ thật + vòng lặp thăm dò.
