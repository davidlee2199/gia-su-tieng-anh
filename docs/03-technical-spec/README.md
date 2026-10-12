# 03 · Đặc tả kỹ thuật

## Thành phần
| Tệp | Vai trò |
|---|---|
| `index.html` | Toàn bộ giao diện + logic chat/gọi/IELTS (script thường) + khối `module` cho nhân vật 3D (`window.Avatar`) |
| `xianxia.mjs` | Cảnh 3D: vòm nền, bục, thời tiết, mùa, hiệu ứng theo buổi, tween |
| `mocap.mjs` | Tải chuyển động BVH từ CDN, ánh xạ vào xương nhân vật |
| `sw.js` | Service worker (cache vỏ app); tên cache `gia-su-vNN` |
| `sam.glb` | Nhân vật (chuyển từ VRoid bằng Blender) |
| `bg/` | `v-<mùa>.mp4` (video nền), `<buổi>.jpg` (tranh dự phòng), `hoa.png` (mặt nạ cây hoa), `buc.glb` (bục) |
| `tools/` | Script dựng/tái tạo tài nguyên + `qa.mjs` |

## Nhân vật & máy quay
TalkingHead 1.7 + HeadAudio (visemes) trên three@0.180 (importmap). Máy quay: view `mid`, fov 35, `cameraDistance -6.08`. `modelPixelRatio = min(1, 1.5/devicePixelRatio)` (đây là thứ giữ 60 fps). Đèn: ambient 0.9, directional 3 (đổi theo buổi). Camera nghiêng giới hạn polar 1.25–1.62 để không lộ mép vòm.

## Vòm nền
4 bản trụ R = 600, mỗi bản 90°, lật gương xen kẽ (nối liền mép); bản phía sau lưng Sam đọc đúng chiều. Mỗi bản dùng video (VideoTexture) nếu có, không thì tranh tĩnh theo buổi. Cảnh mới hiện dần đè lên cảnh cũ (2,5 s). Video quay ban ngày → chiều/đêm ám màu (`PHASE_MUL`).

## Mùa → video
| Mùa | Điều kiện | Video | Cây hoa trên tranh | Hạt rơi |
|---|---|---|---|---|
| Xuân | Bắc: tháng 2–4 | v-xuan | hồng (gốc) | cánh hồng |
| Hạ | Bắc: 5–7 | v-ha | đỏ phượng | đỏ cam |
| Thu | Bắc: 8–10 | v-thu | vàng cam | lá cam |
| Đông | Bắc: 11–1 | v-dong | trắng | không |
| Mùa mưa | Trung: 9–12 · Nam: 5–11 | v-ha | lá xanh | lá xanh |
| Mùa khô | còn lại (Trung/Nam) | v-xuan | mai vàng | vàng |

Đổi màu cây = shader trên vòm + mặt nạ `bg/hoa.png` (giữ độ sáng gốc nên đêm vẫn tối).

## Hiệu ứng theo buổi (`FX` trong `setupFx`)
| Buổi | Đèn lồng | Mạn-đà-la sàn | Đom đóm | Bụi nắng |
|---|---|---|---|---|
| Ngày | 0 | 0 | 0 | 1 |
| Chiều | .45 | .15 | 0 | .7 |
| Đêm | 1 | .42 | 1 | 0 |
Mưa/giông/tuyết: đom đóm + bụi nắng = 0; sương mù: nhân 0.5 / 0.3. Mọi thay đổi chuyển dần qua `tween()` (2–3 s).

## Khung máy toàn thân + dù
Khung đặt bằng `head.setView('full', {cameraDistance, cameraY, cameraRotateX})` (TalkingHead tự chuyển dần; chỉnh `camera.position` bằng tay sẽ bị nó đè lại): trời quang máy cách 4,2 m nhìn tâm cao 0,7 m; có dù lùi ra 4,95 m, tâm 0,87 m. Mưa/giông/tuyết → `setUmbrella(true)`: dù (`setupUmbrella` trong `xianxia.mjs`) bám theo xương `LeftHand`, nghiêng cho tán nằm trên đầu (`Head`), cán nằm phía trước người; mở dần ~1 s; giọt nước nhỏ từ mép khi mưa; giọt mưa/hạt tuyết nào lọt vào vùng tán thì rơi lại từ trên (`umbC/umbR/umbTop`). Đang cầm dù thì không làm cử chỉ tay và mocap (`umbUp()` trong `index.html`).

## Nguyên tắc chung
- Thêm gì vào cảnh thì phải có hành vi theo buổi/thời tiết/mùa (không để vật tĩnh).
- Mọi giá trị thời gian đổi dần bằng `tween`, không bật tắt cái rụp.
- Mất tài nguyên (video, mạng thời tiết, bục) → lùi về bản đơn giản, không làm hỏng app.
