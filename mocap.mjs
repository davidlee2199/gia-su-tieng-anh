// Motion capture thật của Bandai Namco Research (Nhật) gắn lên Sam.
// Giấy phép bộ dữ liệu: CC BY-NC-ND 4.0 — phi thương mại, không phát tán bản chỉnh sửa. Vì vậy app KHÔNG lưu file nào:
// tải thẳng .bvh từ kho gốc lúc chạy và ghép vào khung xương ngay trên máy người dùng.
// Nguồn: https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset (© Bandai Namco Research Inc.)
//
// Cách ghép (retarget theo hướng xương): mỗi đoạn xương của Sam được xoay ngắn nhất để chỉ cùng hướng với đoạn xương
// tương ứng trong mocap. Không phụ thuộc trục riêng của từng khớp BVH (bộ Bandai mỗi khớp một trục).
import * as THREE from 'three';
import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';

const SRC = 'https://cdn.jsdelivr.net/gh/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset@master/dataset/Bandai-Namco-Research-Motiondataset-1/data/dataset-1_';

// Xương Sam → [khớp gốc, khớp ngọn] trong mocap. Thứ tự cha trước con.
const MAP = {
  Spine: ['Spine', 'Chest'], Spine2: ['Chest', 'Neck'], Neck: ['Neck', 'Head'],
  LeftShoulder: ['Shoulder_L', 'UpperArm_L'], LeftArm: ['UpperArm_L', 'LowerArm_L'], LeftForeArm: ['LowerArm_L', 'Hand_L'],
  RightShoulder: ['Shoulder_R', 'UpperArm_R'], RightArm: ['UpperArm_R', 'LowerArm_R'], RightForeArm: ['LowerArm_R', 'Hand_R'],
  LeftUpLeg: ['UpperLeg_L', 'LowerLeg_L'], LeftLeg: ['LowerLeg_L', 'Foot_L'], LeftFoot: ['Foot_L', 'Toes_L'],
  RightUpLeg: ['UpperLeg_R', 'LowerLeg_R'], RightLeg: ['LowerLeg_R', 'Foot_R'], RightFoot: ['Foot_R', 'Toes_R'],
};
const ORDER = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'];

// Xương con dùng để đo hướng (đùi/hông VRoid còn có xương váy, không lấy con đầu tiên được).
const CHILD = { Spine: 'Spine1', Spine2: 'Neck', Neck: 'Head', LeftShoulder: 'LeftArm', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand',
  RightShoulder: 'RightArm', RightArm: 'RightForeArm', RightForeArm: 'RightHand', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', LeftFoot: 'LeftToeBase',
  RightUpLeg: 'RightLeg', RightLeg: 'RightFoot', RightFoot: 'RightToeBase' };

const cache = new Map();

// Tư thế gốc (bind) của Sam, tính trong hệ toạ độ của armature.
function bindInfo(head) {
  let skel = null;
  head.armature.traverse(o => { if (!skel && o.isSkinnedMesh) skel = o.skeleton; });
  const saved = skel.bones.map(b => b.quaternion.clone());
  skel.pose(); head.armature.updateMatrixWorld(true);
  const inv = head.armature.getWorldQuaternion(new THREE.Quaternion()).invert();
  const invM = new THREE.Matrix4().copy(head.armature.matrixWorld).invert();
  const info = {};
  for (const n of ORDER) {
    const b = skel.getBoneByName(n); if (!b) continue;
    const child = CHILD[n] ? skel.getBoneByName(CHILD[n]) : null;
    const p = b.getWorldPosition(new THREE.Vector3()).applyMatrix4(invM);
    const c = child ? child.getWorldPosition(new THREE.Vector3()).applyMatrix4(invM) : null;
    info[n] = {
      world: inv.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion())),
      local: b.quaternion.clone(),
      dir: c ? c.sub(p).normalize() : null,
      parent: b.parent?.isBone ? b.parent.name : null,
      parentWorld: inv.clone().multiply(b.parent.getWorldQuaternion(new THREE.Quaternion())), // cha có thể là xương Root ngoài danh sách
    };
  }
  skel.bones.forEach((b, i) => b.quaternion.copy(saved[i]));
  return info;
}

const LEGS = /Leg|Foot/;
async function buildClip(head, name, legs = false) {
  const txt = await (await fetch(SRC + name + '.bvh')).text();
  const { skeleton, clip } = new BVHLoader().parse(txt);
  const root = new THREE.Group(); root.add(skeleton.bones[0]);
  const J = Object.fromEntries(skeleton.bones.map(b => [b.name, b]));
  const mixer = new THREE.AnimationMixer(root); mixer.clipAction(clip).play();
  const bind = bindInfo(head);
  const fps = 30, n = Math.floor(clip.duration * fps), times = [], vals = {};
  // Chỉ ghi khớp có trong mocap (đầu, mắt, bàn tay để TalkingHead tự điều khiển). Chân khoá trừ khi nhảy.
  for (const k of ORDER) if (bind[k] && ((k === 'Hips' && legs) || MAP[k]) && (legs || !LEGS.test(k))) vals[k] = [];
  const pos = {}, q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  let yaw = null;
  for (let i = 0; i < n; i++) {
    mixer.setTime(i / fps); root.updateMatrixWorld(true);
    for (const k in J) pos[k] = J[k].getWorldPosition(pos[k] || new THREE.Vector3());
    // Quay mocap cho mặt nhìn +Z, tay trái về +X như Sam (tính một lần ở khung đầu).
    if (yaw === null) { const lat = pos.UpperArm_L.clone().sub(pos.UpperArm_R); yaw = -Math.atan2(-lat.z, lat.x); }
    const Y = new THREE.Quaternion().setFromAxisAngle(up, yaw);
    const P = k => pos[k].clone().applyQuaternion(Y);
    const world = {};
    // Hông: dựng hệ trục từ (hông phải→trái) và (hông→ngực).
    {
      const x = P('UpperLeg_L').sub(P('UpperLeg_R')).normalize(), yv = P('Chest').sub(P('Hips')).normalize();
      const z = new THREE.Vector3().crossVectors(x, yv).normalize(), y2 = new THREE.Vector3().crossVectors(z, x);
      const m = new THREE.Matrix4().makeBasis(x, y2, z), qs = new THREE.Quaternion().setFromRotationMatrix(m);
      world.Hips = qs.multiply(bind.Hips.world.clone()); // bind của Sam đã là thẳng đứng nhìn +Z
    }
    // Không nhảy: giữ hông đứng yên (TalkingHead tự dời hông để giữ chân chạm đất — xoay hông là người trượt tới trước).
    if (!legs) world.Hips = bind.Hips.world.clone();
    for (const k of ORDER) {
      if (k === 'Hips' || !bind[k]) continue;
      const pw = world[bind[k].parent] || bind[k].parentWorld;
      if (MAP[k] && bind[k].dir) {
        // hướng xương lúc bind, xoay theo cha hiện tại, rồi xoay ngắn nhất cho khớp hướng mocap
        const parentDelta = pw.clone().multiply(bind[k].parentWorld.clone().invert());
        const restW = parentDelta.clone().multiply(bind[k].world);
        const curDir = bind[k].dir.clone().applyQuaternion(parentDelta);
        const want = P(MAP[k][1]).sub(P(MAP[k][0])).normalize();
        world[k] = q.setFromUnitVectors(curDir, want).clone().multiply(restW);
      } else {
        world[k] = pw.clone().multiply(bind[k].local); // không có trong mocap: đi theo cha
      }
    }
    times.push(i / fps);
    for (const k in vals) {
      const pw = world[bind[k].parent] || bind[k].parentWorld;
      const local = pw.clone().invert().multiply(world[k]);
      vals[k].push(local.x, local.y, local.z, local.w);
    }
  }
  const tracks = Object.entries(vals).map(([k, v]) => new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, v));
  const out = new THREE.AnimationClip('mocap-' + name, n / fps, tracks);
  const props = {}; tracks.forEach(t => { props[t.name] = new THREE.Quaternion().fromArray(t.values, 0); });
  return { clip: out, pose: { props, standing: true } };
}

// Phát một động tác mocap. name ví dụ 'bye_feminine_001'. Trả về false nếu lỗi (mạng, trình duyệt) để dùng cử chỉ thường.
export async function playMocap(head, name, repeat = 1, legs = /dance/.test(name)) {
  try {
    const key = 'mocap:' + name;
    if (!cache.has(key)) cache.set(key, buildClip(head, name, legs));
    const item = await cache.get(key);
    if (!head.animClips.find(x => x.url === key + '-0')) head.animClips.push({ url: key + '-0', clip: item.clip, pose: item.pose });
    await head.playAnimation(key, null, item.clip.duration * repeat);
    return true;
  } catch (e) { console.warn('mocap', name, e); return false; }
}
export const preloadMocap = (head, names) => names.forEach(n => { const k = 'mocap:' + n; if (!cache.has(k)) cache.set(k, buildClip(head, n)); });
