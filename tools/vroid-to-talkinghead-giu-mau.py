# Bản giữ nguyên màu/đồ của nhân vật tự nặn trong VRoid: bù da/tóc cho đèn PBR, da mặt tools/texd/face-son.png (son + lỗ mũi), sống mũi nâng MUI mét (mặc định 0.005).
# Chạy: blender -b --python convert.py -- <thư mục> <file.vrm> <out.glb>
import bpy, sys, runpy, os, importlib.util, addon_utils
D, VRM, OUT = sys.argv[sys.argv.index('--') + 1:][:3]
bpy.ops.wm.read_factory_settings(use_empty=True)
for m in addon_utils.modules():
    if m.__name__.endswith('.vrm') or m.__name__ == 'vrm':
        addon_utils.enable(m.__name__, default_set=True); print('enabled', m.__name__)
spec = importlib.util.spec_from_file_location('talkinghead_addon', os.path.join(D, 'talkinghead-addon.py'))
th = importlib.util.module_from_spec(spec); spec.loader.exec_module(th); th.register()
bpy.ops.import_scene.vrm(filepath=VRM)
print('OBJECTS:', [(o.name, o.type) for o in bpy.data.objects][:40])
# Sống mũi cao hơn: đẩy đoạn sống mũi (giữa 2 mắt -> sát đầu mũi) ra trước, giảm dần về 2 đầu và 2 bên.
# Toạ độ đo trên nhân vật David (Z lên, mặt nhìn -Y): đầu mũi z~1.471, giữa 2 mắt z~1.505.
import math
MUI = float(os.environ.get('MUI', '0.005'))
fo = bpy.data.objects.get('Face')
if fo and MUI > 0:
    print('FACE matrix identity', fo.matrix_world.is_identity)
    def w(co):
        if abs(co.x) > 0.02 or co.y > -0.055 or not (1.468 < co.z < 1.508): return 0.0
        t = (co.z - 1.471) / (1.508 - 1.471)              # 0 ở đầu mũi, 1 ở giữa 2 mắt
        prof = math.sin(math.pi * min(1, max(0, t))) ** 0.8  # nhô nhất ở giữa sống mũi
        return prof * math.exp(-(co.x / 0.006) ** 2)
    base = fo.data.shape_keys.key_blocks[0] if fo.data.shape_keys else None
    from mathutils import Vector
    mw = fo.matrix_world; dl = mw.inverted().to_3x3() @ Vector((0, -MUI, 0))  # đẩy ra trước theo hướng thật
    ws = [w(mw @ v.co) for v in fo.data.vertices]
    n = sum(1 for x in ws if x > 0.05); print('NOSE verts', n)
    for kb in (fo.data.shape_keys.key_blocks if fo.data.shape_keys else []):
        for i, x in enumerate(ws):
            if x: kb.data[i].co += dl * x
    for i, x in enumerate(ws):
        if x: fo.data.vertices[i].co += dl * x
col = bpy.data.collections.get('Colliders')
if col:
    def kill(c):
        for ch in list(c.children): kill(ch)
        for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.collections.remove(c)
    kill(col); print('colliders removed')
for o in bpy.data.objects:
    if o.type == 'ARMATURE' and o.name != 'Armature': print('rename armature', o.name); o.name = 'Armature'
for o in bpy.data.objects:  # VRM0: 'Face.M_F00_000_00_Fcl_MTH_A' -> 'Fcl_MTH_A' (script TalkingHead tìm tên ngắn)
    if o.type == 'MESH' and o.data.shape_keys:
        for k in o.data.shape_keys.key_blocks:
            if 'Fcl_' in k.name and not k.name.startswith('Fcl_'): k.name = k.name[k.name.index('Fcl_'):]
for s in ['rename-vroid-bones.py', 'build-vroid-eyes.py', 'build-vroid-shapekeys.py']:
    print('RUN', s); runpy.run_path(os.path.join(D, s), run_name='__main__')
arm = bpy.data.objects['Armature']
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
print('fix axes', bpy.ops.talkinghead.fix_bone_axes_t())
def to_principled(mat):
    nt = mat.node_tree
    img = next((n.image for n in nt.nodes if n.type == 'TEX_IMAGE' and n.name.startswith('Mtoon1BaseColorTexture') and n.image), None)
    ext = getattr(mat, 'vrm_addon_extension', None)
    m1 = ext.mtoon1 if ext else None
    fac = list(m1.pbr_metallic_roughness.base_color_factor) if m1 else [1, 1, 1, 1]
    mode = m1.alpha_mode if m1 else 'OPAQUE'
    cutoff = m1.alpha_cutoff if m1 else 0.5
    hide = False
    if img and 'Face_00_SKIN' in mat.name and os.path.exists(os.path.join(D, 'texd', 'face-son.png')):  # môi tô son
        img = bpy.data.images.load(os.path.join(D, 'texd', 'face-son.png'), check_existing=True); print('SON OK')
    # Bù cho đèn PBR (VRoid dùng toon + màu bóng): da ấm lên, tóc trầm lại. Hệ số là màu tuyến tính.
    if 'SKIN' in mat.name: fac = [1.0, 0.78, 0.68, 1]
    if 'HAIR' in mat.name: fac = [0.6, 0.6, 0.6, 1]
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value = 0.0; bsdf.inputs['Roughness'].default_value = 0.85
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    if img:
        tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
        nt.links.new(tex.outputs['Color'], mul.inputs['A']); mul.inputs['B'].default_value = fac
        nt.links.new(mul.outputs['Result'], bsdf.inputs['Base Color'])
        if mode == 'BLEND':
            nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha']); mat.surface_render_method = 'BLENDED'
        elif mode == 'MASK':
            gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = cutoff
            nt.links.new(tex.outputs['Alpha'], gt.inputs[0]); nt.links.new(gt.outputs['Value'], bsdf.inputs['Alpha'])
    else:
        bsdf.inputs['Base Color'].default_value = fac
    if hide:
        for l in list(bsdf.inputs['Alpha'].links): nt.links.remove(l)
        bsdf.inputs['Alpha'].default_value = 0.0; mat.surface_render_method = 'BLENDED'
    return mode
modes = {}
for mat in list(bpy.data.materials):
    if mat.use_nodes and mat.users: modes[mat.name] = to_principled(mat)
print('MATERIALS', len(modes), sorted(set(modes.values())))
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
face = bpy.data.objects.get('Face')
keys = [k.name for k in face.data.shape_keys.key_blocks] if face and face.data.shape_keys else []
print('FACE KEYS', len(keys), [k for k in keys if k.startswith('viseme_')][:15], 'eyeBlinkLeft' in keys, 'mouthSmileLeft' in keys)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=False, export_morph=True, export_skins=True)
print('EXPORTED', OUT, os.path.getsize(OUT))
