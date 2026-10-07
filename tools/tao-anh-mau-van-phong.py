# Chỉnh ảnh màu nhân vật VRoid "Sendagaya Shino" sang kiểu nhân viên văn phòng: mắt hổ phách,
# gile đen + sơ mi trắng, váy đen, son hồng đỏ. Vào: tex/<tên>.png (ảnh gốc trích từ .vrm). Ra: tex2/<tên>.png
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
def arr(n): return np.asarray(Image.open(f'tex/{n}.png').convert('RGBA')).astype(np.float32) / 255
def save(a, n): Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'tex2/{n}.png')
lum = lambda a: 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
a = arr('F00_000_EyeIris_00'); L = lum(a); L = (L - L.min()) / (np.ptp(L) + 1e-6); t = np.clip(L * 1.6, 0, 1)[..., None]
a[..., :3] = np.array([0.24, 0.11, 0.04]) * (1 - t) + np.array([0.98, 0.72, 0.32]) * t; save(a, 'F00_000_EyeIris_00')
a = arr('F00_001_Tops_01'); L = lum(a); s = np.clip((L - 0.30) / 0.32, 0, 1); s = s * s * (3 - 2 * s)  # tối → gile đen, sáng → sơ mi trắng
a[..., :3] = np.repeat(((0.05 + 0.10 * L) * (1 - s) + (0.70 + 0.30 * np.clip((L - 0.45) / 0.55, 0, 1)) * s)[..., None], 3, -1); save(a, 'F00_001_Tops_01')
a = arr('F00_001_Bottoms_01'); a[..., :3] = np.repeat((0.05 + 0.12 * lum(a))[..., None], 3, -1); save(a, 'F00_001_Bottoms_01')
f = Image.open('tex/F00_000_Face_00.png').convert('RGBA'); W, H = f.size; g = np.asarray(f.convert('L')).astype(np.float32)
y0, y1, x0, x1 = int(H * .70), int(H * .80), int(W * .38), int(W * .62); sub = g[y0:y1, x0:x1]
ys, xs = np.where(sub < sub.min() + 0.35 * (np.median(sub) - sub.min())); cy, cx = int(y0 + ys.mean()), int(x0 + xs.mean()); half = int(np.ptp(xs) / 2)
m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).ellipse((cx - half - 4, cy - 8, cx + half + 4, cy + 12), fill=140); m = m.filter(ImageFilter.GaussianBlur(5))
Image.composite(Image.new('RGBA', (W, H), (176, 62, 78, 255)), f, m).save('tex2/F00_000_Face_00.png')
