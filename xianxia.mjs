// Tiên cảnh kiểu anime / tranh thủy mặc, dựng hoàn toàn bằng code (không ảnh, không tải thêm).
// Tô màu phẳng (MeshBasic, không ăn đèn) cho hợp nhân vật VRoid tô kiểu toon.
// Gồm: trời hoàng hôn, trăng, sao · 5 lớp núi nhạt dần vào sương · biển mây · đảo bay + thác nước + lầu các
// · đài ngọc có lan can + cây hoa đào · hạc bay · đèn lồng · cánh hoa rơi. Xoay 360° chỗ nào cũng có cảnh.
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);
const C = (h) => new THREE.Color(h);
const basic = (o) => new THREE.MeshBasicMaterial({ fog: true, ...o });

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glow = (inner, size = 128) => canvasTex(size, size, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});

// Trời: gradient anime + sao (shader, luôn phía sau)
function sky() {
  return new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 p;
      float hash(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){
        float h = p.y;
        vec3 top = vec3(.10,.10,.32), mid = vec3(.55,.42,.78), hor = vec3(1.0,.70,.62), low = vec3(.98,.82,.80);
        vec3 c = h > .0 ? mix(hor, mid, smoothstep(.0,.22,h)) : mix(hor, low, smoothstep(.0,-.25,h));
        c = h > .22 ? mix(mid, top, smoothstep(.22,.75,h)) : c;
        vec3 q = floor(p * 260.);
        c += step(.9965, hash(q)) * smoothstep(.25,.6,h) * vec3(1.,.95,.9);
        gl_FragColor = vec4(c, 1.); }`,
  }));
}

// Một vòng núi răng cưa quanh tâm: mép trên nhấp nhô, đậm ở đỉnh nhạt dần xuống chân (như tranh thủy mặc).
function ridgeRing(radius, base, height, jag, topColor, footColor, seed) {
  const N = 220, pos = [], col = [], idx = [];
  const tc = C(topColor), fc = C(footColor);
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2;
    let n = 0; for (let k = 1; k <= 5; k++) n += Math.sin(a * (k * 3 + seed) + seed * k * 1.7) / k;
    n = Math.pow(Math.abs(n) / 1.6, 1.4);
    const peak = Math.pow(Math.abs(Math.sin(a * (9 + seed) + seed)), 6) * jag;
    const top = base + height * (0.35 + n) + peak;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    pos.push(x, base - 40, z, x, top, z);
    col.push(fc.r, fc.g, fc.b, tc.r, tc.g, tc.b);
    if (i < N) { const j = i * 2; idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, basic({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
}

// Lầu các: 3 tầng, cột đỏ son, mái ngói chàm, viền + chóp vàng
function pavilion(s) {
  const g = new THREE.Group(), red = basic({ color: 0xb8323a }), roof = basic({ color: 0x23283b, side: THREE.DoubleSide }), gold = basic({ color: 0xe6c260 }), stone = basic({ color: 0xd9d2c4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(s * .95, s * 1.05, s * .18, 8), stone); base.position.y = s * .09; g.add(base);
  for (let t = 0; t < 3; t++) {
    const w = s * (0.8 - t * 0.18), y = s * (0.18 + t * 0.62);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(s * .035, s * .035, s * .42, 6), red); p.position.set(Math.cos(a) * w * .8, y + s * .21, Math.sin(a) * w * .8); g.add(p); }
    const r1 = new THREE.Mesh(new THREE.ConeGeometry(w * 1.35, s * .32, 8, 1, true), roof); r1.position.y = y + s * .56; g.add(r1);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(w * 1.3, s * .03, 4, 8), gold); lip.rotation.x = Math.PI / 2; lip.position.y = y + s * .41; g.add(lip);
  }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(s * .06, s * .45, 6), gold); tip.position.y = s * 2.3; g.add(tip);
  return g;
}

// Đảo bay: khối đá ngược + mặt cỏ + cây + thác nước rơi xuống mây
function island(r, waterTex) {
  const g = new THREE.Group();
  const rock = new THREE.ConeGeometry(r, r * 1.8, 9, 3); rock.rotateX(Math.PI);
  const p = rock.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) < r * .85) { p.setX(i, p.getX(i) * rnd(.8, 1.2)); p.setZ(i, p.getZ(i) * rnd(.8, 1.2)); } }
  const rm = new THREE.Mesh(rock, basic({ color: 0x6b6478 })); rm.position.y = -r * .9; g.add(rm);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * .98, r * .18, 9), basic({ color: 0x7fb88a })));
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(r * .16, r * .5, 6), basic({ color: 0x3f7a5c })); const a = rnd(0, 6.28), d = rnd(.3, .8) * r; t.position.set(Math.cos(a) * d, r * .3, Math.sin(a) * d); g.add(t); }
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(r * .35, r * 4), basic({ map: waterTex, transparent: true, depthWrite: false, opacity: .85, side: THREE.DoubleSide }));
  fall.position.set(r * .7, -r * 2, 0); fall.rotation.y = Math.PI / 2; g.add(fall);
  return g;
}

// Cây hoa đào: thân cong + 4 cành, tán gồm nhiều chùm hoa nhỏ (nhìn gần không bị thô)
function sakura() {
  const g = new THREE.Group(), bark = basic({ color: 0x4a3036 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .1, 1.3, 7), bark); trunk.position.y = .65; trunk.rotation.z = .1; g.add(trunk);
  const tips = [];
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + .4, len = rnd(.55, .8);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(.018, .04, len, 5), bark);
    const dir = new THREE.Vector3(Math.cos(a) * .8, 1, Math.sin(a) * .8).normalize();
    br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const base = new THREE.Vector3(.06, 1.2, 0); br.position.copy(base).addScaledVector(dir, len / 2); g.add(br);
    tips.push(base.clone().addScaledVector(dir, len));
  }
  const pinks = [0xffc7da, 0xffaecb, 0xffdbe7, 0xff98bd].map(c => basic({ color: c }));
  for (let i = 0; i < 46; i++) {
    const t = tips[i % tips.length];
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.07, .16), 1), pinks[i % 4]);
    b.position.set(t.x + rnd(-.32, .32), t.y + rnd(-.18, .28), t.z + rnd(-.32, .32)); g.add(b);
  }
  return g;
}

// Hạc: hai cánh vỗ + thân
function crane() {
  const g = new THREE.Group(), m = basic({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1.6, .15, -.3, 0, 0, -.6], 3));
  const L = new THREE.Mesh(wing, m), R = new THREE.Mesh(wing, m); R.scale.x = -1; g.add(L, R);
  const body = new THREE.Mesh(new THREE.ConeGeometry(.12, 1, 5), m); body.rotation.x = Math.PI / 2; body.position.z = -.2; g.add(body);
  g.userData = { L, R };
  return g;
}

export function buildXianxia(scene) {
  const env = new THREE.Group(); env.name = 'xianxia'; scene.add(env);
  scene.fog = new THREE.Fog(0xf2c7c4, 60, 420);
  const far = []; const addFar = o => { env.add(o); far.push(o); return o; };
  addFar(sky());

  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('rgba(255,248,230,1)'), fog: false, depthWrite: false }));
  moon.scale.set(150, 150, 1); moon.position.set(-160, 120, -560); addFar(moon);
  const moonCore = new THREE.Mesh(new THREE.CircleGeometry(30, 48), basic({ color: 0xfff6e2, fog: false })); moonCore.position.set(-160, 120, -555); moonCore.lookAt(0, 0, 0); addFar(moonCore);

  // 5 lớp núi: xa nhạt (tím hồng), gần đậm (chàm)
  [[700, -20, 120, 90, 0xb9a6cf, 0xf3cdc8], [560, -25, 100, 80, 0x9c87bd, 0xedc2c4], [430, -28, 85, 70, 0x7b6ba6, 0xe6b7c0],
   [320, -30, 70, 55, 0x5a5488, 0xdcaabb], [230, -32, 55, 42, 0x3d3f6b, 0xcf9fb6]]
    .forEach(([r, b, h, j, t, f], i) => addFar(ridgeRing(r, b, h, j, t, f, i * 2 + 1)));

  // Biển mây phẳng kiểu anime
  const cloudTex = canvasTex(256, 128, (g, w) => {
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(rnd(40, w - 40), rnd(60, 95), rnd(25, 45), 0, Math.PI * 2); g.fill(); }
    g.fillRect(20, 85, w - 40, 40);
  });
  const clouds = [];
  for (let i = 0; i < 70; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: rnd(.75, 1), color: C(i % 3 ? 0xfff3f3 : 0xffe1e6) }));
    const a = rnd(0, Math.PI * 2), d = rnd(45, 260); s.position.set(Math.cos(a) * d, rnd(-30, -14), Math.sin(a) * d);
    const k = rnd(30, 80); s.scale.set(k * 2, k, 1); s.userData.v = rnd(.3, 1.2); addFar(s); clouds.push(s);
  }

  // Thác nước: sọc trắng xanh trượt xuống
  const water = canvasTex(32, 256, (g, w, h) => { for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(${200 + Math.random() * 55 | 0},240,255,${rnd(.3, .9)})`; g.fillRect(rnd(0, 8), y, rnd(14, 28), 4); } });
  water.wrapT = THREE.RepeatWrapping;

  // Đảo bay + lầu các
  const isl = [];
  [[-38, 6, -60, 7, true], [46, 14, -95, 9, true], [70, -2, 30, 6, false], [-65, 10, 45, 8, true], [10, 22, -150, 12, true]].forEach(([x, y, z, r, pav]) => {
    const g = island(r, water); g.position.set(x, y, z); g.userData.y = y; addFar(g); isl.push(g);
    if (pav) { const p = pavilion(r * .55); p.position.y = r * .09; g.add(p); }
  });

  // Đài ngọc + lan can đỏ + cây hoa đào cạnh Sam
  const jade = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.75, .25, 48), basic({ color: 0xa8dcc8 })); jade.position.y = -.125; env.add(jade);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.62, .035, 6, 64), basic({ color: 0xe9cf7a })); rim.rotation.x = Math.PI / 2; rim.position.y = .005; env.add(rim);
  const rail = basic({ color: 0xb8323a });
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.sin(a) > .35) continue; // chừa lối phía trước (phía máy quay, +Z)
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .45, 6), rail); p.position.set(Math.cos(a) * 1.55, .22, Math.sin(a) * 1.55); env.add(p); }
  const tree = sakura(); tree.position.set(-2.2, -.1, -3.0); tree.scale.setScalar(1.5); addFar(tree);
  const tree2 = sakura(); tree2.position.set(2.6, -.1, -3.6); tree2.scale.setScalar(1.3); tree2.rotation.y = 2; addFar(tree2); // có tranh thì ẩn (tranh đã có hoa đào)
  const halo = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), basic({ map: glow('rgba(170,255,225,0.5)'), transparent: true, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = -.3; env.add(halo);

  // Hạc bay vòng
  const cranes = [];
  for (let i = 0; i < 6; i++) { const c = crane(); c.scale.setScalar(rnd(1.2, 2.2)); Object.assign(c.userData, { r: rnd(40, 110), h: rnd(12, 40), a: rnd(0, 6.28), v: rnd(.05, .12) }); addFar(c); cranes.push(c); }

  // Đèn lồng bay lên
  const lt = glow('rgba(255,190,100,1)'), lanterns = [];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false, fog: false, color: 0xffb060 }));
    const a = rnd(0, Math.PI * 2), d = rnd(14, 80); s.position.set(Math.cos(a) * d, rnd(-6, 30), Math.sin(a) * d);
    const k = rnd(.3, .8) * (1 + d / 25); s.scale.set(k, k * 1.3, 1); s.userData.v = rnd(.4, 1.1); env.add(s); lanterns.push(s);
  }

  // Cánh hoa đào rơi
  const N = 240, pp = new Float32Array(N * 3), drift = [];
  for (let i = 0; i < N; i++) { pp[i * 3] = rnd(-6, 6); pp[i * 3 + 1] = rnd(-1, 5); pp[i * 3 + 2] = rnd(-6, 6); drift.push(rnd(0, 6.28)); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  env.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: glow('rgba(255,170,200,1)', 32), size: .09, transparent: true, depthWrite: false, color: 0xffd0e0 })));

  env.traverse(o => { if (o.material) o.material.toneMapped = false; });
  painting(scene, env, far);
  env.userData.setPhase(phaseByClock());
  setupWeather(scene, env);

  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
    for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 260) c.position.x = -260; }
    for (const l of lanterns) { l.position.y += l.userData.v * dt; if (l.position.y > 32) l.position.y = -6; }
    isl.forEach((g, i) => { g.position.y = g.userData.y + Math.sin(t * .5 + i) * .8; });
    water.offset.y = -t * .6;
    for (const c of cranes) {
      const u = c.userData; u.a += u.v * dt;
      c.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(t + u.r) * 2, Math.sin(u.a) * u.r);
      c.rotation.y = -u.a; const f = Math.sin(t * 4 + u.r) * .5; u.L.rotation.z = f; u.R.rotation.z = -f;
    }
    for (let i = 0; i < N; i++) {
      drift[i] += dt; pp[i * 3] += Math.sin(drift[i]) * .004; pp[i * 3 + 1] -= .25 * dt; pp[i * 3 + 2] += Math.cos(drift[i] * .7) * .003;
      if (pp[i * 3 + 1] < -.2) pp[i * 3 + 1] = 5;
    }
    pg.attributes.position.needsUpdate = true;
    requestAnimationFrame(tick);
  })(last);
  return env;
}

// Tranh tiên cảnh anime (David vẽ bằng Gemini Pro) dán lên vòm trụ quanh nhân vật để xoay 360°:
// nửa sau lưng Sam là bản lật (nhìn từ trong vòm ảnh bị ngược), nửa kia là bản gốc → hai mép nối liền.
// Có bg/tien-canh.mp4 (video lặp vòng làm từ chính tranh đó) thì phát video cho cảnh động; không có thì dùng ảnh.
function dome(env, tex, w, h) {
  const R = 600, H = Math.PI * R * h / w; // giữ đúng tỉ lệ khung trên nửa vòng
  const half = (start, flip) => {
    let t = tex;
    if (flip) { t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; }
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true, start, Math.PI),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, fog: false, toneMapped: false, depthWrite: false }));
    m.position.y = 1.1 + H * .12; m.renderOrder = -1; // nâng: lộ đảo bay, thác, biển mây sau lưng Sam
    return m;
  };
  const g = new THREE.Group(); g.add(half(Math.PI * .5, true), half(Math.PI * 1.5, false)); env.add(g);
  return g;
}

// Ngày / chiều / đêm: mỗi buổi một tranh (bg/<buổi>.jpg), có video bg/<buổi>.mp4 thì phát video cho cảnh động.
// Ánh sáng chiếu lên Sam đổi theo buổi để hợp cảnh.
export const PHASES = {
  ngay: { label: '☀️ Ngày', amb: 1.0, dir: 3.4, color: 0xffffff },
  chieu: { label: '🌇 Chiều', amb: 0.9, dir: 3.0, color: 0xffeedd },
  dem: { label: '🌙 Đêm', amb: 0.55, dir: 1.6, color: 0xa8b8ff },
};
export const phaseByClock = (h = new Date().getHours()) => h >= 6 && h < 16 ? 'ngay' : h >= 16 && h < 19 ? 'chieu' : 'dem';

function painting(scene, env, far) {
  const domes = {}; let cur = null;
  const hideFar = () => { far.forEach(o => { if (o.geometry?.type === 'SphereGeometry') o.renderOrder = -2; else o.visible = false; }); scene.fog = null; };
  const show = name => { for (const k in domes) domes[k].group.visible = k === name; };
  function load(name) {
    if (domes[name]) return;
    const d = domes[name] = { group: new THREE.Group() }; env.add(d.group);
    new THREE.TextureLoader().load(`bg/${name}.jpg`, tex => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      d.img = dome(d.group, tex, tex.image.width, tex.image.height); hideFar(); show(cur);
    }, undefined, e => console.warn('tranh nền', name, e));
    const v = document.createElement('video');
    Object.assign(v, { src: `bg/${name}.mp4`, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous', preload: 'auto' });
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.addEventListener('loadeddata', () => {
      const tex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace;
      dome(d.group, tex, v.videoWidth, v.videoHeight); if (d.img) d.img.visible = false; hideFar();
      d.video = v; if (cur === name) v.play().catch(() => document.addEventListener('pointerdown', () => v.play().catch(() => {}), { once: true }));
    }, { once: true });
    v.addEventListener('error', () => {}, { once: true }); // chưa có video buổi này: dùng ảnh
  }
  env.userData.setPhase = name => {
    cur = name; load(name); show(name);
    for (const k in domes) { const v = domes[k].video; if (v) k === name ? v.play().catch(() => {}) : v.pause(); }
    const P = PHASES[name];
    scene.traverse(o => { if (o.isAmbientLight) o.intensity = P.amb; if (o.isDirectionalLight) { o.intensity = P.dir; o.color.set(P.color); } });
  };
}

// ===== Thời tiết: mưa, giông (sấm chớp), tuyết, sương mù. Hạt bao quanh nhân vật, rẻ cho điện thoại. =====
export const WEATHERS = {
  quang: '☀️ Quang', mua: '🌧️ Mưa', bao: '⛈️ Giông', tuyet: '❄️ Tuyết', suong: '🌫️ Sương mù',
};
// Mã thời tiết WMO (Open-Meteo) → kiểu của mình
export function wmoToWeather(code) {
  if (code >= 95) return 'bao';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'mua';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'tuyet';
  if (code === 45 || code === 48) return 'suong';
  return 'quang';
}
// Thời tiết thật tại TP.HCM (không cần khoá, không xin quyền vị trí)
export async function realWeather(lat = 10.78, lon = 106.7) {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`);
  return wmoToWeather((await r.json()).current.weather_code);
}

export function setupWeather(scene, env) {
  const R = 7, TOP = 7, rnd = (a, b) => a + Math.random() * (b - a);
  // Mưa: các vệt ngắn rơi chéo
  const NR = 1400, rp = new Float32Array(NR * 6), rv = new Float32Array(NR);
  for (let i = 0; i < NR; i++) {
    const x = rnd(-R, R), y = rnd(-1, TOP), z = rnd(-R, R); rv[i] = rnd(14, 20);
    rp.set([x, y, z, x + .04, y - .32, z], i * 6);
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xe6efff, transparent: true, opacity: .7, depthWrite: false, toneMapped: false }));
  rain.frustumCulled = false; rain.visible = false; env.add(rain);
  // Tuyết: hạt trắng lả lướt
  const NS = 900, sp = new Float32Array(NS * 3), sd = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { sp.set([rnd(-R, R), rnd(-1, TOP), rnd(-R, R)], i * 3); sd[i] = rnd(0, 6.28); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ map: glow('rgba(255,255,255,1)', 32), size: .1, transparent: true, depthWrite: false, toneMapped: false }));
  snow.frustumCulled = false; snow.visible = false; env.add(snow);
  // Sương mù: mây mờ trôi quanh, gần lẫn xa
  const fogTex = glow('rgba(255,255,255,0.7)', 128), mist = new THREE.Group(); mist.visible = false; env.add(mist);
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, opacity: rnd(.25, .5), depthWrite: false, toneMapped: false, color: 0xf2f0f7 }));
    const a = rnd(0, 6.28), d = rnd(4.5, 40); s.position.set(Math.cos(a) * d, rnd(-.5, 2.5), Math.sin(a) * d); // không che giữa máy quay và Sam
    const k = rnd(3, 9) * (1 + d / 15); s.scale.set(k * 1.8, k, 1); s.userData.v = rnd(.1, .4); mist.add(s);
  }
  // Chớp: vệt sáng trắng phủ toàn cảnh trong tích tắc
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#e8eeff;opacity:0;pointer-events:none;transition:opacity .08s;z-index:0';
  document.getElementById('avatar')?.appendChild(flash);

  let kind = 'quang', nextBolt = 0, lightBase = null;
  const domes = () => { const out = []; env.traverse(o => { if (o.geometry?.parameters?.radiusTop === 600) out.push(o); }); return out; };
  function bolt() {
    const lights = []; scene.traverse(o => { if (o.isAmbientLight || o.isDirectionalLight) lights.push([o, o.intensity]); });
    const hit = (k) => { flash.style.opacity = k; lights.forEach(([o, i]) => o.intensity = i * (1 + k * 4)); };
    hit(.75); setTimeout(() => hit(0), 90); setTimeout(() => hit(.5), 180); setTimeout(() => { hit(0); }, 300);
  }
  env.userData.setWeather = k => {
    kind = k;
    rain.visible = k === 'mua' || k === 'bao'; rain.material.opacity = k === 'bao' ? .85 : .7;
    snow.visible = k === 'tuyet'; mist.visible = k === 'suong';
    const dim = { quang: 1, mua: .72, bao: .55, tuyet: .9, suong: .8 }[k];
    const tint = { quang: 0xffffff, mua: 0xc8d2e6, bao: 0xa9b3cc, tuyet: 0xe6eeff, suong: 0xe8e6ee }[k];
    domes().forEach(m => m.material.color.set(tint).multiplyScalar(dim));
    nextBolt = performance.now() + 2500;
  };

  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (rain.visible) {
      for (let i = 0; i < NR; i++) {
        const o = i * 6, d = rv[i] * dt * (kind === 'bao' ? 1.3 : 1);
        rp[o + 1] -= d; rp[o + 4] -= d; rp[o] += d * .12; rp[o + 3] += d * .12;
        if (rp[o + 4] < -1) { const x = rnd(-R, R), z = rnd(-R, R), y = TOP; rp.set([x, y, z, x + .04, y - .32, z], o); }
      }
      rg.attributes.position.needsUpdate = true;
    }
    if (snow.visible) {
      for (let i = 0; i < NS; i++) {
        sd[i] += dt; sp[i * 3] += Math.sin(sd[i]) * .006; sp[i * 3 + 1] -= .45 * dt; sp[i * 3 + 2] += Math.cos(sd[i] * .8) * .005;
        if (sp[i * 3 + 1] < -1) sp[i * 3 + 1] = TOP;
      }
      sg.attributes.position.needsUpdate = true;
    }
    if (mist.visible) mist.children.forEach(s => { s.position.x += s.userData.v * dt; if (s.position.x > 40) s.position.x = -40; });
    if (kind === 'bao' && now > nextBolt) { bolt(); nextBolt = now + rnd(4000, 10000); }
    requestAnimationFrame(tick);
  })(last);
}
