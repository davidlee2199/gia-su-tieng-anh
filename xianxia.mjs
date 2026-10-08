// Cảnh tiên hiệp dựng hoàn toàn bằng code (không ảnh, không tải thêm): trời hoàng hôn, núi đá dựng đứng mờ sương,
// biển mây, lầu các trên đỉnh núi, đèn lồng bay lên, hoa đào rơi, đài ngọc dưới chân nhân vật.
// Vật liệu Basic (không ăn đèn) để không làm đổi màu nhân vật; ít đa giác cho điện thoại.
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);

// Ảnh tròn mờ vẽ bằng canvas: dùng cho mây, ánh sáng đèn lồng, mặt trăng.
function glowTex(inner, outer = 'rgba(255,255,255,0)', size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function cloudTex() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = rnd(60, 196), y = rnd(100, 160), r = rnd(30, 70), gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function sky() {
  return new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 p; void main(){
      float h = p.y;
      vec3 top = vec3(.16,.10,.34), mid = vec3(.93,.62,.66), low = vec3(1.,.86,.66);
      vec3 c = h > 0. ? mix(mid, top, smoothstep(0., .55, h)) : mix(mid, low, smoothstep(0., -.3, h));
      gl_FragColor = vec4(c, 1.); }`,
  }));
}

// Cột đá kiểu Trương Gia Giới: trụ nhiều cạnh, mép gồ ghề, đỉnh có cụm cây xanh.
function pillar(h, r) {
  const geo = new THREE.CylinderGeometry(r * rnd(.55, .8), r, h, 7, 6);
  const pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), k = 1 + rnd(-.18, .18);
    pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k);
    const t = (y + h / 2) / h; // 0 chân, 1 đỉnh: chân nhạt vào sương, đỉnh đậm
    col.push(.20 - .10 * t, .26 - .10 * t, .30 - .08 * t);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const g = new THREE.Group(), m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  m.position.y = h / 2; g.add(m);
  const tree = new THREE.Mesh(new THREE.ConeGeometry(r * .7, r * .9, 6), new THREE.MeshBasicMaterial({ color: 0x2f5d4a }));
  tree.position.y = h + r * .35; g.add(tree);
  return g;
}

// Lầu các 3 tầng mái cong đỏ son.
function pagoda(s) {
  const g = new THREE.Group(), wall = new THREE.MeshBasicMaterial({ color: 0x8a2a2a }), roof = new THREE.MeshBasicMaterial({ color: 0x2b1b24 });
  for (let i = 0; i < 3; i++) {
    const w = s * (1 - i * .22), y = i * s * .55;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * .7, s * .35, w * .7), wall); b.position.y = y + s * .17; g.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(w * .75, s * .28, 4), roof); r.rotation.y = Math.PI / 4; r.position.y = y + s * .48; g.add(r);
  }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(s * .05, s * .3, 6), new THREE.MeshBasicMaterial({ color: 0xd8b25a })); tip.position.y = s * 1.75; g.add(tip);
  return g;
}

export function buildXianxia(scene) {
  const env = new THREE.Group(); env.name = 'xianxia'; scene.add(env);
  scene.fog = new THREE.Fog(0xf0c3c4, 220, 900);
  env.add(sky());

  // Trăng lớn mờ ở chân trời
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,244,220,1)', 'rgba(255,200,170,0)'), fog: false, depthWrite: false }));
  moon.scale.set(160, 160, 1); moon.position.set(-200, 90, -520); env.add(moon);

  // Vòng núi đá quanh nhân vật (xoay 360 độ chỗ nào cũng thấy)
  const tops = [];
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + rnd(-.06, .06), d = rnd(70, 300), h = rnd(30, 95) * (d / 160), p = pillar(h, rnd(5, 13) * (d / 160));
    p.position.set(Math.cos(a) * d, -30, Math.sin(a) * d); env.add(p); tops.push({ p, h, d });
  }
  // Lầu các trên 3 đỉnh gần nhất
  tops.sort((a, b) => a.d - b.d).slice(0, 3).forEach(({ p, h, d }) => { const q = pagoda(5.5 * d / 90); q.position.set(p.position.x, -30 + h + .2, p.position.z); env.add(q); });

  // Biển mây dưới chân
  const ct = cloudTex(), clouds = [];
  for (let i = 0; i < 90; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: rnd(.45, .75), depthWrite: false, color: 0xfff1f0 }));
    const a = rnd(0, Math.PI * 2), d = rnd(40, 320); s.position.set(Math.cos(a) * d, rnd(-28, -10), Math.sin(a) * d);
    const k = rnd(40, 110); s.scale.set(k * 1.6, k, 1); s.userData.v = rnd(.05, .18); env.add(s); clouds.push(s);
  }

  const procCount = env.children.length; // trời, trăng, núi, lầu, mây vẽ tay: ẩn khi dùng ảnh chụp 360°
  // Đài ngọc dưới chân nhân vật + vầng sáng
  const jade = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, .18, 48), new THREE.MeshBasicMaterial({ color: 0x9fd6c2 }));
  jade.position.y = -.09; env.add(jade);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, .03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xe9cf7a }));
  rim.rotation.x = Math.PI / 2; rim.position.y = .005; env.add(rim);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ map: glowTex('rgba(170,255,225,0.55)'), transparent: true, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = -.2; env.add(halo);

  // Đèn lồng bay lên
  const lt = glowTex('rgba(255,200,110,1)', 'rgba(255,120,40,0)'), lanterns = [];
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const a = rnd(0, Math.PI * 2), d = rnd(8, 90); s.position.set(Math.cos(a) * d, rnd(-6, 30), Math.sin(a) * d);
    const k = rnd(.3, .9) * (1 + d / 30); s.scale.set(k, k * 1.3, 1); s.userData.v = rnd(.4, 1.2); env.add(s); lanterns.push(s);
  }

  // Hoa đào rơi quanh nhân vật
  const N = 260, pp = new Float32Array(N * 3), drift = [];
  for (let i = 0; i < N; i++) { pp[i * 3] = rnd(-6, 6); pp[i * 3 + 1] = rnd(-1, 5); pp[i * 3 + 2] = rnd(-6, 6); drift.push(rnd(0, 6.28)); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const petals = new THREE.Points(pg, new THREE.PointsMaterial({ map: glowTex('rgba(255,170,200,1)', 'rgba(255,170,200,0)', 32), size: .09, transparent: true, depthWrite: false, color: 0xffd0e0 }));
  env.add(petals);

  env.traverse(o => { if (o.material) o.material.toneMapped = false; });
  env.userData.proc = env.children.slice(0, procCount); env.userData.fog = scene.fog;
  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 320) c.position.x = -320; }
    for (const l of lanterns) { l.position.y += l.userData.v * dt; if (l.position.y > 34) l.position.y = -6; }
    for (let i = 0; i < N; i++) {
      drift[i] += dt; pp[i * 3] += Math.sin(drift[i]) * .004; pp[i * 3 + 1] -= .25 * dt; pp[i * 3 + 2] += Math.cos(drift[i] * .7) * .003;
      if (pp[i * 3 + 1] < -.2) pp[i * 3 + 1] = 5;
    }
    pg.attributes.position.needsUpdate = true;
    requestAnimationFrame(tick);
  })(last);
  return env;
}

// Ảnh chụp toàn cảnh 360° thật (Poly Haven, CC0). name = null thì quay về cảnh vẽ tay.
// yaw: xoay ảnh để phần đẹp nhất nằm sau lưng nhân vật lúc nhìn chính diện.
export const PANOS = [
  { name: 'neurathen_rock_castle', label: 'Vách đá', yaw: 0.15 },
  { name: 'misty_pines', label: 'Rừng sương', yaw: 0 },
  { name: 'qwantani_dusk_2', label: 'Hoàng hôn', yaw: 2.6 },
];
const loaded = {};
export async function setPanorama(scene, env, pano, base = '') {
  if (!pano) {
    scene.background = null; scene.fog = env.userData.fog;
    env.userData.proc.forEach(o => o.visible = true); return;
  }
  const tex = loaded[pano.name] ||= await new THREE.TextureLoader().loadAsync(base + 'bg/' + pano.name + '.jpg');
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex; scene.backgroundRotation?.set(0, pano.yaw, 0); scene.backgroundIntensity = 1;
  scene.fog = null; env.userData.proc.forEach(o => o.visible = false);
}
