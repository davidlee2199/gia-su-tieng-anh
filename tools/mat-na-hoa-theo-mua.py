# Dựng mặt nạ "hoa đào" từ tranh chiều (tranh gốc; ngày/đêm là bản chỉnh màu cùng bố cục) → bg/hoa.png
# rồi xem thử đổi màu theo mùa trên cả 3 buổi bằng đúng công thức shader sẽ dùng.
import numpy as np
from PIL import Image, ImageFilter

BG = r"D:\06 - Cá nhân\gia-su-tieng-anh\bg"
OUT = r"D:\06 - Cá nhân\_tmp-sam"
W, H = 1376, 768

def hsv(path):
    im = np.asarray(Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mx, mn = im.max(-1), im.min(-1); d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return im, h, s, mx

im, h, s, v = hsv(BG + r"\chieu.jpg")
yy = np.linspace(1, 0, H)[:, None] * np.ones((1, W))
hp = np.minimum(np.abs(h - .93), 1 - np.abs(h - .93))
strict = (hp < .07) & (s > .2) & (v > .5) & (yy < .62)
F = lambda a, f: np.asarray(Image.fromarray(a).filter(f))
x = (strict * 255).astype(np.uint8)
x = F(F(x, ImageFilter.MaxFilter(5)), ImageFilter.MinFilter(5))    # đóng: liền tán hoa
x = F(F(x, ImageFilter.MinFilter(9)), ImageFilter.MaxFilter(9))    # mở: bỏ đốm lẻ (mây, mái)
region = F(x, ImageFilter.MaxFilter(21)) > 0                       # nới ra ôm cả cánh nhạt
soft = np.clip(1 - hp / .12, 0, 1) * np.clip((s - .04) / .1, 0, 1) * np.clip((v - .3) / .2, 0, 1)
m = region * np.clip(soft * 1.7, 0, 1)  # cánh nhạt/bóng râm trong tán cũng đổi hẳn màu
m[:318, :200] = 0; m[300:370, 430:510] = 0  # vách đá ửng hồng trên cây trái + đốm giữa tranh: không phải hoa
m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
Image.fromarray((m * 255).astype(np.uint8)).save(BG + r"\hoa.png", optimize=True)
print("cover", round(float(m.mean()), 4))

SEASONS = {  # (tối, sáng) — giống SEASONS.bloom trong xianxia.mjs
    "ha": (0x8a1408, 0xff7a4a), "thu": (0x8a3a05, 0xffc060), "dong": (0x7c8798, 0xffffff),
    "kho": (0x9a6a00, 0xfff07a), "mua": (0x1f5a1a, 0x9ee07a),
}
hexrgb = lambda x: np.array([(x >> 16) & 255, (x >> 8) & 255, x & 255], np.float32) / 255
for ph in ["chieu", "ngay", "dem"]:
    im = hsv(rf"{BG}\{ph}.jpg")[0]
    L = (im @ np.array([.299, .587, .114], np.float32))[..., None]
    for k, (a, b) in SEASONS.items():
        t = np.clip((L - .15) / .85, 0, 1); t = t * t * (3 - 2 * t)
        tgt = hexrgb(a) * (1 - t) + hexrgb(b) * t
        out = im * (1 - m[..., None]) + tgt * m[..., None]
        if ph == "chieu" or k == "thu":
            Image.fromarray((out[:, ::-1][:, ::-1] * 255).astype(np.uint8)).resize((1100, 614)).save(rf"{OUT}\rc-{ph}-{k}.jpg", quality=80)
