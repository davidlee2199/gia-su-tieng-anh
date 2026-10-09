// Tiên cảnh kiểu anime / tranh thủy mặc, dựng hoàn toàn bằng code (không ảnh, không tải thêm).
// Tô màu phẳng (MeshBasic, không ăn đèn) cho hợp nhân vật VRoid tô kiểu toon.
// Gồm: trời hoàng hôn, trăng, sao · 5 lớp núi nhạt dần vào sương · biển mây · đảo bay + thác nước + lầu các
// · đài ngọc có lan can + cây hoa đào · hạc bay · đèn lồng · cánh hoa rơi. Xoay 360° chỗ nào cũng có cảnh.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const C = (h) => new THREE.Color(h);
const basic = (o) => new THREE.MeshBasicMaterial({ fog: true, ...o });

// Chuyển cảnh mượt: mỗi khoá một tween (gọi lại cùng khoá thì thay tween cũ), chạy trong vòng tick của cảnh
const tweens = new Map();
function tween(key, sec, f) { tweens.set(key, { t0: performance.now(), sec, f }); }
function runTweens(now) {
  for (const [k, w] of tweens) { const x = Math.min(1, (now - w.t0) / (w.sec * 1000)); w.f(x * x * (3 - 2 * x)); if (x >= 1) tweens.delete(k); }
}
// Hoa đào trên tranh đổi màu theo mùa: bg/hoa.png = mặt nạ tán hoa (dựng từ tranh chiều, cùng bố cục với ngày/đêm)
const BLOOM = { uHoa: { value: null }, uDark: { value: new THREE.Color() }, uLight: { value: new THREE.Color() }, uMix: { value: 0 } };

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

  // Bục ngọc sen (Magnific: concept → 3D, bg/buc.glb ~19k mặt, texture 1024). Chưa tải xong thì tạm dùng đĩa ngọc trơn.
  const jade = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.75, .25, 48), basic({ color: 0xdfeee8 })); jade.position.y = -.125; env.add(jade);
  new GLTFLoader().load('bg/buc.glb', g => {
    const m = g.scene; m.scale.setScalar(1.5); m.rotation.y = -1.76; // mô hình quay mặt +X: xoay để bậc thang ra phía máy quay, lan can + 2 đèn lồng sau lưng Sam
    m.position.y = .063 * 1.5; // mặt bục (y -0.063 trong mô hình) = chỗ Sam đứng
    m.traverse(o => { if (o.isMesh) { const map = o.material.map; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
      o.material = new THREE.MeshBasicMaterial({ map, toneMapped: false, side: THREE.DoubleSide }); PLAT.push(o.material);
      o.material.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, LAMPU);
        sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
        sh.fragmentShader = 'varying vec3 vWP; uniform float uLamp; uniform vec3 uL1, uL2;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          { float d = min(distance(vWP, uL1), distance(vWP, uL2)); float e = smoothstep(.26, .13, d) * uLamp;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1., .66, .3) * (.75 + .35 * diffuseColor.r), e); }`);
      };
    } });
    env.add(m); jade.visible = false; env.userData.retint?.(); env.userData.addLamps?.(m);
  }, undefined, e => console.warn('bục', e));
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
  const petals = new THREE.Points(pg, new THREE.PointsMaterial({ map: glow('rgba(255,255,255,1)', 32), size: .09, transparent: true, depthWrite: false, color: 0xffb8cc }));
  env.add(petals);
  env.userData.seasonTint = new THREE.Color(1, 1, 1);
  BLOOM.uHoa.value = new THREE.TextureLoader().load('bg/hoa.png');
  env.userData.setSeason = k => { // mùa: thứ rơi quanh Sam + màu hoa trên tranh + ám màu tranh, đổi từ từ
    const S = SEASONS[k], pm = petals.material, o0 = petals.visible ? pm.opacity : 0, o1 = S.petal != null ? 1 : 0;
    env.userData.setVideo?.(S.video);
    const c1 = S.petal != null ? new THREE.Color(S.petal) : pm.color.clone();
    if (o0 < .01) pm.color.copy(c1); // đang ẩn: đổi màu ngay rồi hiện dần
    const c0 = pm.color.clone();
    tween('petal', 2.5, x => { pm.color.lerpColors(c0, c1, x); pm.opacity = o0 + (o1 - o0) * x; petals.visible = pm.opacity > .01; });
    const B = BLOOM, m0 = B.uMix.value;
    if (S.bloom) {
      if (m0 < .01) { B.uDark.value.set(S.bloom[0]); B.uLight.value.set(S.bloom[1]); }
      const d0 = B.uDark.value.clone(), l0 = B.uLight.value.clone(), d1 = C(S.bloom[0]), l1 = C(S.bloom[1]);
      tween('bloom', 3, x => { B.uDark.value.lerpColors(d0, d1, x); B.uLight.value.lerpColors(l0, l1, x); B.uMix.value = m0 + (1 - m0) * x; });
    } else tween('bloom', 3, x => { B.uMix.value = m0 * (1 - x); });
    env.userData.seasonTint.setRGB(...S.tint); env.userData.retint?.();
  };

  env.traverse(o => { if (o.material) o.material.toneMapped = false; });
  painting(scene, env, far);
  env.userData.setPhase(phaseByClock());
  setupWeather(scene, env);
  setupFx(scene, env);

  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
    runTweens(now);
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
// Vòm nhận cả ảnh lẫn video (VideoTexture) — xem painting() bên dưới.
const TINT = new THREE.Color(1, 1, 1); // ám màu thời tiết × mùa đang áp lên vòm
// Thân đèn lồng trên bục tự sáng (shader của bục): uLamp 0..1 theo buổi, uL1/uL2 = tâm 2 đèn (thế giới)
const LAMPU = { uLamp: { value: 0 }, uL1: { value: new THREE.Vector3(0, -9, 0) }, uL2: { value: new THREE.Vector3(0, -9, 0) } };
const PLAT = [], WHITE = new THREE.Color(1, 1, 1); // vật liệu bục: ám theo vòm nhưng nhẹ hơn (đèn lồng vẫn sáng)
function dome(env, tex, w, h) {
  // 4 bản × 90° (trước đây 2 × 180°): mỗi điểm ảnh tranh/video trải hẹp lại một nửa → nét gấp đôi.
  // Bản sau lưng Sam đọc đúng chiều (flip), bản kề lật gương xen kẽ nên mép nào cũng nối liền.
  const R = 600, ARC = Math.PI / 2, H = ARC * R * h / w; // giữ đúng tỉ lệ khung trên mỗi cung 90°
  const half = (start, flip) => {
    let t = tex;
    if (flip) { t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; }
    const mat = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, fog: false, toneMapped: false, depthWrite: false,
      transparent: true, opacity: env.userData.op ?? 0, forceSinglePass: true });
    mat.color.copy(TINT);
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, BLOOM);
      sh.fragmentShader = 'uniform sampler2D uHoa; uniform vec3 uDark, uLight; uniform float uMix;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { float hm = texture2D(uHoa, vMapUv).r * uMix;
          if (hm > .001) { const vec3 W = vec3(.2126, .7152, .0722); float L = dot(diffuseColor.rgb, W);
            vec3 c = mix(uDark, uLight, smoothstep(.02, .7, L));  // đậm nhạt theo bóng của tranh
            c *= L / max(dot(c, W), .02);                          // giữ độ sáng gốc
            diffuseColor.rgb = mix(diffuseColor.rgb, min(c, vec3(1.)), hm); } }`);
    };
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32, 1, true, start, ARC), mat);
    m.position.y = 1.1 - 30; m.renderOrder = -1; // tâm tranh hơi dưới tầm mắt: phủ khoảng -29°..+23° (camera bị giới hạn nghiêng trong khoảng đó)
    return m;
  };
  const g = new THREE.Group(); [0, 1, 2, 3].forEach(i => g.add(half(Math.PI * .75 + i * ARC, i % 2 === 0))); env.add(g);
  return g;
}

// Ngày / chiều / đêm: mỗi buổi một tranh tĩnh bg/<buổi>.jpg (dự phòng khi chưa có video mùa).
// Ánh sáng chiếu lên Sam đổi theo buổi để hợp cảnh.
export const PHASES = {
  ngay: { label: '☀️ Ngày', amb: 1.0, dir: 3.4, color: 0xffffff },
  chieu: { label: '🌇 Chiều', amb: 0.9, dir: 3.0, color: 0xffeedd },
  dem: { label: '🌙 Đêm', amb: 0.55, dir: 1.6, color: 0xa8b8ff },
};
export const phaseByClock = (h = new Date().getHours()) => h >= 6 && h < 16 ? 'ngay' : h >= 16 && h < 19 ? 'chieu' : 'dem';

// Video động theo mùa (bg/v-<mùa>.mp4, cắt từ video David làm bằng Gemini, quay ban ngày) phủ lên tranh;
// chưa tải xong hoặc mùa không có video thì dùng tranh tĩnh theo buổi (bg/<buổi>.jpg). Video gặp chiều/đêm thì ám màu theo buổi.
const PHASE_MUL = { ngay: [1, 1, 1], chieu: [1, .88, .78], dem: [.32, .38, .62] };
function painting(scene, env, far) {
  const domes = {}; let cur = null, phase = null, vname = null;
  const hideFar = () => { far.forEach(o => { if (o.geometry?.type === 'SphereGeometry') o.renderOrder = -2; else o.visible = false; }); scene.fog = null; };
  const setOp = (g, a) => { g.userData.op = a; g.traverse(o => { if (o.isMesh) o.material.opacity = a; }); };
  const show = key => { // cảnh mới hiện dần đè lên cảnh cũ, xong mới ẩn cảnh cũ
    const g = domes[key].group, from = g.userData.op ?? 0; g.visible = true;
    for (const k in domes) domes[k].group.traverse(o => { if (o.isMesh) o.renderOrder = k === key ? -1 : -1.5; });
    tween('phase', 2.5, x => {
      setOp(g, from + (1 - from) * x);
      if (x >= 1) for (const k in domes) if (k !== key) { domes[k].group.visible = false; setOp(domes[k].group, 0); }
    });
  };
  const play = v => v.play().catch(() => document.addEventListener('pointerdown', () => v.play().catch(() => {}), { once: true }));
  const pick = () => {
    const k = vname && domes['v:' + vname]?.ready ? 'v:' + vname : 'p:' + phase;
    if (!phase || k === cur) return;
    cur = k; if (domes[k]?.ready) show(k);
    for (const j in domes) { const v = domes[j].video; if (v) j === k ? play(v) : v.pause(); }
    env.userData.videoOn = k[0] === 'v'; env.userData.retint?.();
  };
  const slot = key => { const d = domes[key] = { group: new THREE.Group() }; env.add(d.group); return d; };
  function loadImg(name) {
    const key = 'p:' + name; if (domes[key]) return; const d = slot(key);
    new THREE.TextureLoader().load(`bg/${name}.jpg`, tex => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      dome(d.group, tex, tex.image.width, tex.image.height); d.ready = true; hideFar(); if (cur === key) show(key);
    }, undefined, e => console.warn('tranh nền', name, e));
  }
  function loadVid(name) {
    // ?v= trong đường dẫn: đổi mỗi lần thay video để điện thoại không giữ bản cũ
    const key = 'v:' + name; if (domes[key]) return; const d = slot(key), v = document.createElement('video');
    Object.assign(v, { src: `bg/v-${name}.mp4?v=1080`, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous', preload: 'auto' });
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.addEventListener('loadeddata', () => {
      const tex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace;
      dome(d.group, tex, v.videoWidth, v.videoHeight); d.video = v; d.ready = true; hideFar(); pick();
    }, { once: true });
    v.addEventListener('error', e => console.warn('video nền', name, e), { once: true }); // lỗi thì cứ dùng tranh tĩnh
  }
  env.userData.setVideo = name => { vname = name; if (name) loadVid(name); pick(); };
  env.userData.setPhase = name => {
    phase = env.userData.phase = name; loadImg(name); pick(); env.userData.retint?.(); env.userData.refx?.();
    const P = PHASES[name], to = new THREE.Color(P.color), ls = [];
    scene.traverse(o => { if (o.isAmbientLight) ls.push([o, o.intensity, P.amb]); if (o.isDirectionalLight) ls.push([o, o.intensity, P.dir, o.color.clone()]); });
    tween('light', 2.5, x => ls.forEach(([o, a, b, c]) => { o.intensity = a + (b - a) * x; if (c) o.color.lerpColors(c, to, x); }));
  };
}

// ===== Thời tiết: mưa, giông (sấm chớp), tuyết, sương mù. Hạt bao quanh nhân vật, rẻ cho điện thoại. =====
export const WEATHERS = {
  quang: '☀️ Quang', mua: '🌧️ Mưa', bao: '⛈️ Giông', tuyet: '❄️ Tuyết', suong: '🌫️ Sương mù',
};
// Khu vực (Việt Nam) + kiểu khí hậu: bắc = 4 mùa, trung/nam = mùa khô / mùa mưa
export const REGIONS = {
  hn: ['Hà Nội', 21.03, 105.85, 'bac'], sapa: ['Sa Pa', 22.34, 103.84, 'bac'], hp: ['Hải Phòng', 20.86, 106.68, 'bac'],
  hue: ['Huế', 16.46, 107.59, 'trung'], dng: ['Đà Nẵng', 16.05, 108.2, 'trung'], nt: ['Nha Trang', 12.24, 109.19, 'trung'],
  dl: ['Đà Lạt', 11.94, 108.44, 'nam'], hcm: ['TP.HCM', 10.78, 106.7, 'nam'], ct: ['Cần Thơ', 10.03, 105.78, 'nam'], pq: ['Phú Quốc', 10.22, 103.96, 'nam'],
};
// petal = màu thứ rơi quanh Sam (null = không rơi), tint = ám màu tranh nền, bloom = màu tán hoa trên tranh (tối, sáng), video = bg/v-<video>.mp4
export const SEASONS = {
  xuan: { label: '🌸 Xuân', petal: 0xffb8cc, tint: [1, .97, .98], bloom: null, video: 'xuan' },
  ha: { label: '🌺 Hạ', petal: 0xff4a30, tint: [1, 1, .94], bloom: [0x8a1408, 0xff7a4a], video: 'ha' },      // hoa phượng
  thu: { label: '🍂 Thu', petal: 0xffa040, tint: [1, .9, .78], bloom: [0x8a3a05, 0xffc060], video: 'thu' },     // lá vàng
  dong: { label: '🧣 Đông', petal: null, tint: [.86, .91, 1], bloom: [0x7c8798, 0xffffff], video: 'dong' }, // tán phủ sương trắng
  kho: { label: '🌼 Mùa khô', petal: 0xffd84a, tint: [1, .96, .88], bloom: [0x9a6a00, 0xfff07a], video: 'xuan' }, // hoa mai vàng
  mua: { label: '🌿 Mùa mưa', petal: 0x7fd07a, tint: [.93, 1, .95], bloom: [0x1f5a1a, 0x9ee07a], video: 'ha' },  // lá xanh
};
export function seasonOf(region, m = new Date().getMonth() + 1) {
  const z = REGIONS[region]?.[3] || 'nam';
  if (z === 'bac') return m >= 2 && m <= 4 ? 'xuan' : m >= 5 && m <= 7 ? 'ha' : m >= 8 && m <= 10 ? 'thu' : 'dong';
  if (z === 'trung') return m >= 9 && m <= 12 ? 'mua' : 'kho';
  return m >= 5 && m <= 11 ? 'mua' : 'kho';
}
// Mã thời tiết WMO (Open-Meteo) → kiểu của mình
export function wmoToWeather(code) {
  if (code >= 95) return 'bao';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'mua';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'tuyet';
  if (code === 45 || code === 48) return 'suong';
  return 'quang';
}
// Thời tiết thật theo dự báo của khu vực đã chọn (Open-Meteo: không cần khoá, không xin quyền vị trí)
export async function realWeather(region = 'hcm') {
  const [, lat, lon] = REGIONS[region] || REGIONS.hcm;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=Asia%2FBangkok`);
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
    const k = rnd(3, 9) * (1 + d / 15); s.scale.set(k * 1.8, k, 1); s.userData.v = rnd(.1, .4); s.userData.o = s.material.opacity; mist.add(s);
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
  env.userData.retint = () => {
    const dim = { quang: 1, mua: .72, bao: .55, tuyet: .9, suong: .8 }[kind];
    const tint = { quang: 0xffffff, mua: 0xc8d2e6, bao: 0xa9b3cc, tuyet: 0xe6eeff, suong: 0xe8e6ee }[kind];
    // tranh tĩnh: ám màu mùa · video: đã đúng mùa, chỉ ám màu theo buổi (video quay ban ngày)
    const by = env.userData.videoOn ? new THREE.Color(...PHASE_MUL[env.userData.phase || 'ngay']) : env.userData.seasonTint;
    const to = new THREE.Color(tint).multiplyScalar(dim).multiply(by), from = TINT.clone();
    tween('tint', 2.5, x => { TINT.lerpColors(from, to, x); domes().forEach(m => m.material.color.copy(TINT)); PLAT.forEach(m => m.color.copy(TINT).lerp(WHITE, .25)); });
  };
  let mistO = 0;
  const fade = (key, from, to, set, sec = 1.8) => tween(key, sec, x => set(from + (to - from) * x));
  env.userData.setWeather = k => {
    kind = env.userData.weather = k; env.userData.refx?.();
    fade('rain', rain.visible ? rain.material.opacity : 0, k === 'bao' ? .85 : k === 'mua' ? .7 : 0, a => { rain.material.opacity = a; rain.visible = a > .01; });
    fade('snow', snow.visible ? snow.material.opacity : 0, k === 'tuyet' ? 1 : 0, a => { snow.material.opacity = a; snow.visible = a > .01; });
    fade('mist', mistO, k === 'suong' ? 1 : 0, a => { mistO = a; mist.visible = a > .01; mist.children.forEach(s => s.material.opacity = s.userData.o * a); }, 3);
    env.userData.retint();
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

// ===== Hiệu ứng theo buổi: đèn lồng trên bục (ngày tắt · chiều hửng · đêm sáng lung linh, hắt ánh ấm lên Sam),
// mạn-đà-la trên sàn phát sáng như trận pháp về đêm, đom đóm ban đêm, bụi nắng ban ngày. Mưa/tuyết thì tắt đom đóm + bụi nắng.
const FX = {
  ngay: { lamp: 0, mandala: 0, fire: 0, motes: 1 },
  chieu: { lamp: .45, mandala: .15, fire: 0, motes: .7 },
  dem: { lamp: 1, mandala: .42, fire: 1, motes: 0 },
};
function setupFx(scene, env) {
  const L = { lamp: 0, mandala: 0, fire: 0, motes: 0 }, add = THREE.AdditiveBlending;
  // Đèn lồng: quầng sáng đè lên thân đèn + 1 đèn điểm ấm sau lưng Sam (rọi tóc/vai)
  const lampTex = glow('rgba(255,200,120,1)', 64), lamps = [];
  const light = new THREE.PointLight(0xffa860, 0, 4.5, 1.6); light.position.set(0, 1.0, -1.0); env.add(light);
  env.userData.addLamps = m => {
    for (const p of [[-0.67, .33, -0.63], [-0.35, .33, .77]]) { // tâm thân đèn trong toạ độ mô hình (đo từ bg/buc.glb)
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampTex, color: 0xffa850, transparent: true, opacity: 0, depthWrite: false, blending: add, toneMapped: false }));
      s.position.set(...p); s.scale.setScalar(.75); m.add(s); lamps.push(s);
    }
    m.updateMatrixWorld(true); lamps[0].getWorldPosition(LAMPU.uL1.value); lamps[1].getWorldPosition(LAMPU.uL2.value); LAMPU.uL1.value.y -= .08; LAMPU.uL2.value.y -= .08; // tâm thân giấy thấp hơn tâm cả cụm (có nắp)
  };
  // Mạn-đà-la phát sáng: vẽ vòng tròn + cánh sen bằng canvas, cộng sáng lên sàn bục
  const mt = canvasTex(512, 512, (g, w) => {
    const c = w / 2; g.translate(c, c); g.strokeStyle = 'rgba(255,225,150,1)'; g.shadowColor = 'rgba(255,210,120,1)'; g.shadowBlur = 12;
    for (const [r, lw] of [[230, 5], [200, 3], [120, 4], [60, 3]]) { g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 3;
    for (let i = 0; i < 16; i++) { g.save(); g.rotate(i / 16 * Math.PI * 2); g.beginPath(); g.moveTo(0, -120); g.quadraticCurveTo(38, -165, 0, -200); g.quadraticCurveTo(-38, -165, 0, -120); g.stroke(); g.restore(); }
    for (let i = 0; i < 8; i++) { g.save(); g.rotate(i / 8 * Math.PI * 2 + Math.PI / 8); g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(26, -90, 0, -120); g.quadraticCurveTo(-26, -90, 0, -60); g.stroke(); g.restore(); }
  });
  const mandala = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), new THREE.MeshBasicMaterial({ map: mt, transparent: true, opacity: 0, depthWrite: false, blending: add, toneMapped: false, color: 0xffd9a0 }));
  mandala.rotation.x = -Math.PI / 2; mandala.position.y = .006; mandala.renderOrder = 1; mandala.visible = false; env.add(mandala);
  // Hạt bay: đom đóm (đêm, nhấp nháy, lượn) và bụi nắng (ngày, lấp lánh, trôi lên chậm) — dùng chung một kiểu
  function motes(n, rgb, size, rMin, rMax, yMin, yMax) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ph = new Float32Array(n), base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin);
      base.set([Math.cos(a) * r, yMin + Math.random() * (yMax - yMin), Math.sin(a) * r], i * 3); ph[i] = Math.random() * 100;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: glow('rgba(255,255,255,1)', 32), size, vertexColors: true, transparent: true, depthWrite: false, blending: add, toneMapped: false }));
    pts.frustumCulled = false; pts.visible = false; env.add(pts);
    return { pts, update(t, level, wander, blink) {
      pts.visible = level > .01; if (!pts.visible) return;
      for (let i = 0; i < n; i++) {
        const k = ph[i], o = i * 3;
        pos[o] = base[o] + Math.sin(t * .3 * wander + k) * .6 * wander; pos[o + 2] = base[o + 2] + Math.cos(t * .25 * wander + k * 1.3) * .6 * wander;
        pos[o + 1] = base[o + 1] + Math.sin(t * .5 + k) * .25 + (wander < 1 ? ((t * .05 + k) % 1) * .8 : 0);
        const b = level * (blink ? Math.max(0, Math.sin(t * 1.7 + k * 3)) ** 3 : .55 + .45 * Math.sin(t * 2.3 + k * 5));
        col[o] = rgb[0] * b; col[o + 1] = rgb[1] * b; col[o + 2] = rgb[2] * b;
      }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    } };
  }
  const fire = motes(70, [.85, 1, .45], .09, 1.6, 7, .1, 2.6);
  const sun = motes(90, [1, .93, .7], .05, .8, 5, .2, 3.2);
  env.userData.refx = () => {
    const P = FX[env.userData.phase] || FX.ngay, w = env.userData.weather || 'quang', wet = w === 'mua' || w === 'bao' || w === 'tuyet';
    const to = { lamp: P.lamp * (w === 'bao' ? .8 : 1), mandala: P.mandala, fire: wet ? 0 : P.fire * (w === 'suong' ? .5 : 1), motes: wet ? 0 : P.motes * (w === 'suong' ? .3 : 1) };
    const from = { ...L };
    tween('fx', 3, x => { for (const k in L) L[k] = from[k] + (to[k] - from[k]) * x; });
  };
  let t0 = performance.now();
  (function tick(now) {
    const t = (now - t0) / 1000;
    lamps.forEach((s, i) => { s.material.opacity = L.lamp * .6 * (.82 + .1 * Math.sin(t * 7.3 + i * 2) + .08 * Math.sin(t * 13.1 + i)); s.visible = L.lamp > .01; });
    light.intensity = L.lamp * 1.4 * (.92 + .08 * Math.sin(t * 7.3)); LAMPU.uLamp.value = L.lamp * (.9 + .1 * Math.sin(t * 7.3));
    mandala.visible = L.mandala > .01; mandala.material.opacity = L.mandala * (.75 + .25 * Math.sin(t * .8)); mandala.rotation.z = t * .03;
    fire.update(t, L.fire, 1, true); sun.update(t, L.motes, .4, false);
    requestAnimationFrame(tick);
  })(t0);
  env.userData.refx();
}
