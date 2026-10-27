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
Khung đặt bằng `head.setView('full', {cameraDistance, cameraY, cameraRotateX})` (TalkingHead tự chuyển dần; chỉnh `camera.position` bằng tay sẽ bị nó đè lại): trời quang máy cách 4,2 m nhìn tâm cao 0,7 m; có dù lùi ra 4,95 m, tâm 0,87 m. Mưa/giông/tuyết → `setUmbrella(true)`: dù (`setupUmbrella` trong `xianxia.mjs`, mô hình Magnific `bg/du.glb`, gốc toạ độ = chỗ nắm tay, mép tán cao 0,9 m, bán kính 0,55 m) bám theo xương `Head`, lơ lửng trên đầu, nhấp nhô và xoay chậm, không cán, không tay cầm; mở dần ~1 s.

**Vật lý hạt** (`u.collide` gọi từ vòng mưa/tuyết trong `setupWeather`): đổi vị trí hạt về hệ toạ độ dù, so với hồ sơ mặt tán `PROF` (độ cao mặt tán theo bán kính, đo từ mô hình) — hạt vừa đi từ trên xuống qua mặt tán là CHẠM: mưa sinh 3 hạt văng theo pháp tuyến mặt tán rồi rơi theo trọng lực; tuyết tan thành bụi trắng. Hạt đang ở dưới tán thì bị chặn (khô ráo). Nước trượt xuống mép rồi nhỏ giọt từ vành tán (khi mưa). Tuyết đọng: mặt tròn xoay theo `PROF` phủ trắng, dày dần ~25 s, hết tuyết thì tan (4 s dưới mưa, 9 s trời khác). Mưa/tuyết dày gấp đôi trong vùng 1,5 m quanh Sam để thấy được va chạm.

## Nguyên tắc chung
- Thêm gì vào cảnh thì phải có hành vi theo buổi/thời tiết/mùa (không để vật tĩnh).
- Mọi giá trị thời gian đổi dần bằng `tween`, không bật tắt cái rụp.
- Mất tài nguyên (video, mạng thời tiết, bục) → lùi về bản đơn giản, không làm hỏng app.


## Chế độ gọi: Học / Tâm sự

`callMode` (`gs_mode` trong localStorage) chọn prompt Gemini Live: `livePrompt()` (gia sư IELTS) hoặc `chatPrompt()` (bạn tâm sự: không dạy, tán tỉnh tinh tế, tập dượt cuộc nói chuyện khó, rào an toàn — ý tưởng từ `03 - Agent-Workspace`/UOS "tập dượt + góc nhìn"). Trí nhớ kiểu biên bản (ý tưởng từ `04 - Agent-Cuoc-Hop`): tool `save_memory` lưu tối đa 30 ghi chú ngắn tiếng Việt vào `gs_mem` (chỉ trên máy, bị xoá khi "Xoá hết dữ liệu"), nạp lại vào prompt buổi sau. Ở chế độ Tâm sự `save_profile` bị bỏ qua nên không đổi band IELTS. Chat chữ: `chatTextPrompt()` (chọn trong `systemPrompt()`), có mục WORK REPLIES (đọc ý đồ tin nhắn, 2 bản nháp A/B theo ngôn ngữ tin gốc, chỗ chưa biết để [ngoặc vuông]); trí nhớ qua thẻ `<memory>[...]</memory>` (bị `takeTags` gỡ khỏi chữ hiển thị); không đọc to; gõ lệnh [SPEAKING]/[LESSON]… tự chuyển về chế độ Học.

### Chế độ HSK3 (`callMode = 'zh'`)

`zhPrompt()` (gọi) và `zhTextPrompt()` (chat chữ) dùng chung `HSK_BODY` (giáo trình HSK 1–3, âm Hán Việt, lỗi thanh điệu/âm của người Việt). Gọi: nói tiếng Trung chậm + giải thích tiếng Việt ngắn; `FOREIGN_ZH` không chặn chữ Hán nhưng vẫn chặn Nhật/Hàn/Thái/Nga. Chat chữ: mỗi lượt có dòng `🗣` (đọc to giọng zh-CN, chậm 0,85), pinyin, nghĩa Việt, một câu hỏi; mic nhận giọng `zh-CN`. Tiến độ: `gs_hsk` (tối đa 30 ghi chú, qua tool `save_memory` hoặc thẻ `<memory>`), xoá cùng "Xoá hết dữ liệu". Không đổi band IELTS.

### Chế độ Cục súc (`callMode = 'roast'`)

`roastPrompt()` (gọi) và `roastTextPrompt()` (chat chữ) = prompt chế độ Học nguyên vẹn + lớp `OVER` + `ROAST_BODY` (vẫn lưu band qua `save_profile`; thi thử/chấm điểm thì bỏ chửi thề); người Mỹ bản xứ đường phố (tiếng lóng, nuốt âm, flap T, từ vựng Mỹ so với Anh); phần giọng: phản ứng bằng tiếng Việt tao/mày, được chửi thề gây cười, dạy câu tiếng Anh bản xứ rồi bắt "Nói lại coi!" (ngoại lệ có chủ ý so với luật Sam chỉ nói tiếng Anh, giống video Hala Rabbit). Câu hay sai lưu ở `gs_phr` (tối đa 30 dòng, qua `addNotes` dùng chung với Tâm sự và HSK3), nhắc lại như quiz bất ngờ. Giới hạn an toàn nằm trong `ROAST_BODY` (LIMITS).

### Lộ trình Ngữ pháp & Từ vựng

`GRAMMAR` (G1–G4) và `VOCAB` (V1–V4) = 40 bài mỗi mảng, gộp vào `EXTRA`; `unitById` tìm cả `UNITS` (IELTS) lẫn `EXTRA`. `lessonText(u)` chọn nội dung bài theo `u.track`. Điểm bài lưu chung `ie_scores`. Sổ từ `gs_vocab` (tối đa 600 từ, `addVocab`/`reviewVocab`/`dueWords`, Leitner hộp 0–4 → 1·3·7·14·30 ngày): Sam thêm từ bằng thẻ `<words>` cuối bài từ vựng; lệnh `[WORDS] a = nghĩa; b = nghĩa` ôn tối đa 10 từ đến hạn và trả `<review>{ok,miss}</review>`. `renderRoad` có 3 tab (`roadTab`, lưu `gs_road`).
