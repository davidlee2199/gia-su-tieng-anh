# Đóng gói lại GLB bục Magnific: texture 4096 → 1024 JPEG (nhẹ cho điện thoại), giữ nguyên hình.
import json, struct, io, sys
from PIL import Image
src, out, size = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1024
b = open(src, "rb").read()
jl = struct.unpack_from("<I", b, 12)[0]
j = json.loads(b[20:20 + jl])
bin0 = b[20 + jl + 8:]
img_views = {im["bufferView"] for im in j.get("images", [])}
parts, off = [], 0
for i, bv in enumerate(j["bufferViews"]):
    data = bin0[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
    if i in img_views:
        im = Image.open(io.BytesIO(data)).convert("RGB").resize((size, size), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=85, optimize=True); data = buf.getvalue()
    pad = (-off) % 4
    parts.append(b"\0" * pad); off += pad
    bv["byteOffset"] = off; bv["byteLength"] = len(data)
    parts.append(data); off += len(data)
binb = b"".join(parts); binb += b"\0" * ((-len(binb)) % 4)
j["buffers"] = [{"byteLength": len(binb)}]
js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4)
glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(binb), 0x004E4942) + binb
open(out, "wb").write(glb)
print(out, len(glb) // 1024, "KB")
