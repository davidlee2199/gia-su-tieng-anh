# Chuẩn hoá GLB dù Magnific: xoay thẳng đứng (đỉnh dù lên), bán kính tán 0,55 m, kéo dài cán dưới tán để tán nằm trên đầu,
# gốc toạ độ = chỗ nắm tay (RIM_ABOVE m dưới mép tán), nướng hết vào đỉnh (node matrix = đơn vị). In ra hồ sơ mặt tán.
import json, struct, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
RC, RIM_ABOVE, BELOW = 0.55, 0.90, 0.22
b = open(src, "rb").read(); jl = struct.unpack_from("<I", b, 12)[0]; j = json.loads(b[20:20 + jl]); bin0 = bytearray(b[20 + jl + 8:])
prim = j["meshes"][0]["primitives"][0]
def acc(i):
    a = j["accessors"][i]; bv = j["bufferViews"][a["bufferView"]]; off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    n = {"VEC3": 3, "VEC2": 2}[a["type"]]; return a, np.frombuffer(bin0, np.float32, a["count"] * n, off).reshape(-1, n)
a_p, P = acc(prim["attributes"]["POSITION"]); a_n, N = acc(prim["attributes"]["NORMAL"])
M = np.array(j["nodes"][0]["matrix"], np.float64).reshape(4, 4).T; P = P.astype(np.float64) @ M[:3, :3].T
# trục tán = hướng phương sai nhỏ nhất
C = P - P.mean(0); w, v = np.linalg.eigh(C.T @ C); ax = v[:, 0]
# TRỤC DÙ = đường thẳng của cán: chiếu mô hình dọc đúng trục thì cả cán dồn về MỘT điểm → chọn hướng gom nhiều đỉnh vào một ô nhất
def basis(a):
    h = np.array([1.0, 0, 0]) if abs(a[0]) < .9 else np.array([0, 1.0, 0]); u_ = np.cross(a, h); u_ /= np.linalg.norm(u_); return u_, np.cross(a, u_)
def peak(a, bins=56):
    u_, v_ = basis(a); H, ex, ey = np.histogram2d(C @ u_, C @ v_, bins=bins); i = np.unravel_index(H.argmax(), H.shape); return H.max(), (ex[i[0]], ey[i[1]])
n = 2500; k_ = np.arange(n) + .5; phi = np.arccos(1 - k_ / n); th = np.pi * (1 + 5 ** .5) * k_
cand = np.stack([np.cos(th) * np.sin(phi), np.sin(th) * np.sin(phi), np.cos(phi)], 1)
best = max(cand, key=lambda a: peak(a)[0])
for sc in (.06, .02, .008, .003):  # tinh chỉnh quanh hướng tốt nhất
    pool = best + np.random.default_rng(1).normal(0, sc, (300, 3)); pool = pool / np.linalg.norm(pool, axis=1, keepdims=True); best = max(list(pool) + [best], key=lambda a: peak(a, 80)[0])
u_, v_ = basis(best); X2 = np.stack([C @ u_, C @ v_], 1)
H, ex, ey = np.histogram2d(X2[:, 0], X2[:, 1], bins=80); i = np.unravel_index(H.argmax(), H.shape); c0 = np.array([(ex[i[0]] + ex[i[0] + 1]) / 2, (ey[i[1]] + ey[i[1] + 1]) / 2])
near = np.linalg.norm(X2 - c0, axis=1) < 0.03 * np.ptp(X2); t_s = (C @ best)[near]; c2 = X2[near].mean(0)
rad = np.linalg.norm(X2 - c2, axis=1); canopy_t = np.median((C @ best)[rad > 0.6 * rad.max()])  # độ cao mép tán dọc trục
up = best if (t_s.max() - canopy_t) < (canopy_t - t_s.min()) else -best  # cán thò ra phía đáy → đáy ngược hướng 'up'
print("peak", peak(best, 80)[0], "up", np.round(up, 2), "t cán", round(t_s.min(), 2), round(t_s.max(), 2), "t tán", round(canopy_t, 2))
# dựng hệ: Y = up
y = up / np.linalg.norm(up); x = np.cross([0, 0, 1.0], y); x = x / np.linalg.norm(x) if np.linalg.norm(x) > 1e-6 else np.array([1.0, 0, 0]); z = np.cross(x, y)
R = np.stack([x, y, z])  # hàng = trục mới
Q = C @ R.T
cx, cz = np.median(Q[:, 0][np.abs(Q[:, 1] - np.median(Q[:, 1])) < 0.1]), 0
r = np.hypot(Q[:, 0] - Q[:, 0].mean(), Q[:, 2] - Q[:, 2].mean()); Rm = r.max()
axis_x, axis_z = Q[near, 0].mean(), Q[near, 2].mean()  # tâm = trục cán
Q[:, 0] -= axis_x; Q[:, 2] -= axis_z; r = np.hypot(Q[:, 0], Q[:, 2]); Rm = r.max()
yrim = Q[r > 0.93 * Rm, 1].mean(); ytop = Q[:, 1].max(); ybot = Q[:, 1].min()
print("Rm", round(Rm, 3), "rim y", round(yrim, 3), "top", round(ytop, 3), "bot", round(ybot, 3), "up", np.round(y, 2))
s = RC / Rm; Q *= s; yrim *= s; ytop *= s; ybot *= s
below = yrim - ybot; k = (RIM_ABOVE + BELOW) / below
Q[:, 1] = np.where(Q[:, 1] < yrim, yrim + (Q[:, 1] - yrim) * k, Q[:, 1])
yrim2 = yrim; yg = yrim2 - RIM_ABOVE; Q[:, 1] -= yg
r = np.hypot(Q[:, 0], Q[:, 2]); top = Q[:, 1].max(); print("k", round(k, 2), "đỉnh dù y", round(top, 3), "mép y", round(RIM_ABOVE, 3), "đáy y", round(Q[:, 1].min(), 3))
# hồ sơ mặt tán (bề mặt trên): max y theo bán kính
bins = np.linspace(0, RC * 1.02, 15); prof = []
for i in range(len(bins) - 1):
    m = (r >= bins[i]) & (r < bins[i + 1]) & (Q[:, 1] > RIM_ABOVE - 0.2)
    prof.append(round(float(Q[m, 1].max()), 3) if m.any() else None)
print("PROFILE", json.dumps({"dr": round(float(bins[1]), 4), "h": prof}))
# pháp tuyến xoay theo
Nn = N.astype(np.float64) @ M[:3, :3].T @ R.T; Nn /= np.linalg.norm(Nn, axis=1, keepdims=True) + 1e-9
# ghi lại
def put(acc_i, arr):
    a = j["accessors"][acc_i]; bv = j["bufferViews"][a["bufferView"]]; off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    d = arr.astype(np.float32).tobytes(); bin0[off:off + len(d)] = d
put(prim["attributes"]["POSITION"], Q); put(prim["attributes"]["NORMAL"], Nn)
a_p["min"], a_p["max"] = Q.min(0).tolist(), Q.max(0).tolist(); j["nodes"][0].pop("matrix", None)
js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4); bb = bytes(bin0); bb += b"\0" * ((-len(bb)) % 4)
open(out, "wb").write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bb)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(bb), 0x004E4942) + bb)
print("ok", out, len(bb) // 1024, "KB")
