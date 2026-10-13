// QA/QC trước khi đẩy:  node tools/qa.mjs   (thoát mã 1 nếu có mục ❌)
// QA = mã & kho (cú pháp, file tham chiếu, dung lượng, lộ khoá, sw.js). QC = thành phẩm chạy thật trong Chrome headless
// (4 cỡ màn không tràn ngang · nút đủ to · không lỗi console · nhân vật + video chạy · bảng cảnh · mọi tổ hợp
// buổi×thời tiết×mùa · đèn sáng đêm tắt ngày · luật ngôn ngữ). Không cần điện thoại; fps trên máy thật vẫn phải đo riêng.
import fs from 'fs'; import path from 'path'; import http from 'http'; import { spawn, execSync } from 'child_process';
const ROOT = path.resolve(import.meta.dirname, '..'), CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = process.env.QA_PROFILE || path.resolve(ROOT, '..', '_tmp-sam', 'chrome-qa-' + Date.now()), PORT = 8771, DBG = 9571;
const res = []; const ok = (n, d = '') => res.push(['✅', n, d]), bad = (n, d = '') => res.push(['❌', n, d]), warn = (n, d = '') => res.push(['⚠️', n, d]);
const check = (c, n, d = '') => c ? ok(n) : bad(n, d);
const sh = c => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd(); } catch { return ''; } }; // trimEnd (không trim): dòng đầu của git status bắt đầu bằng khoảng trắng
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8'), size = f => fs.statSync(path.join(ROOT, f)).size;

// ───────── QA: mã & kho ─────────
const html = read('index.html'), mjs = fs.readdirSync(ROOT).filter(f => f.endsWith('.mjs'));
const tmp = path.join(path.dirname(PROFILE), 'qa-tmp'); fs.mkdirSync(tmp, { recursive: true });
let n = 0; for (const f of mjs) { try { execSync(`node --check "${path.join(ROOT, f)}"`, { stdio: 'pipe' }); } catch (e) { n++; bad('cú pháp ' + f, String(e.stderr).split('\n').slice(0, 3).join(' ')); } }
[...html.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  if (/importmap/.test(m[1])) { try { JSON.parse(m[2]); } catch { n++; bad('importmap JSON hỏng'); } return; }
  const f = path.join(tmp, `inline${i}.mjs`); fs.writeFileSync(f, m[2]);
  try { execSync(`node --check "${f}"`, { stdio: 'pipe' }); } catch (e) { n++; bad(`cú pháp script #${i} trong index.html`, String(e.stderr).split('\n').slice(0, 3).join(' ')); }
});
if (!n) ok('cú pháp: ' + mjs.join(', ') + ' + script trong index.html');

const refs = new Set(); for (const src of [html, ...mjs.map(read), read('sw.js'), read('manifest.json')])
  for (const m of src.matchAll(/['"`(]((?:\.\/)?(?:bg\/[\w\-.${}]+|[\w\-]+\.(?:glb|png|jpg|mp4|mjs|json|js)))(?:\?[^'"`)]*)?['"`)]/g)) refs.add(m[1].replace(/^\.\//, ''));
const miss = [...refs].filter(r => !r.includes('${') && !r.includes('<') && !fs.existsSync(path.join(ROOT, r)) && !/^(bg\/[\w-]+\.(jpg|mp4))$/.test(r));
check(!miss.length, `file tham chiếu đều có (${refs.size})`, miss.join(', '));
for (const p of ['ngay', 'chieu', 'dem']) check(fs.existsSync(path.join(ROOT, `bg/${p}.jpg`)), `tranh tĩnh dự phòng bg/${p}.jpg`);
const bg = fs.readdirSync(path.join(ROOT, 'bg')), tot = bg.reduce((s, f) => s + size('bg/' + f), 0), big = bg.filter(f => size('bg/' + f) > 6e6);
check(tot < 22e6 && !big.length, `dung lượng bg/ ${(tot / 1e6).toFixed(1)} MB (trần 22, mỗi file ≤ 6)`, big.join(', '));
check(size('sam.glb') < 14e6, `sam.glb ${(size('sam.glb') / 1e6).toFixed(1)} MB (trần 14)`);
const files = sh('git ls-files').split('\n').filter(f => f && !/\.(png|jpg|mp4|glb|vrm)$/.test(f));
const leak = files.filter(f => /AIza[0-9A-Za-z_\-]{35}|sk-[A-Za-z0-9]{32,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(read(f)));
check(!leak.length, 'repo công khai: không lộ khoá API/khoá riêng', leak.join(', '));
const mails = files.filter(f => /[\w.]+@(pli|m2w)\.(com\.)?vn/.test(read(f))); check(!mails.length, 'repo công khai: không có email nội bộ', mails.join(', '));
// đặc tả (docs/) không được lệch: đủ 8 phần + mọi tệp `tools/...`/`bg/...` mà đặc tả nhắc phải còn tồn tại
const specDirs = ['01-engineering-intent', '02-product-requirements', '03-technical-spec', '04-api-and-data-design', '05-test-specification', '06-security-and-reliability', '07-deployment-and-monitoring', '08-maintenance-and-spec-drift'];
const noSpec = specDirs.filter(d => !fs.existsSync(path.join(ROOT, 'docs', d, 'README.md')));
const docTxt = [...specDirs.map(d => 'docs/' + d + '/README.md'), 'tasks/agent-task-list.md', 'tests/may-that.md'].filter(f => fs.existsSync(path.join(ROOT, f))).map(read).join('\n');
const ghost = [...new Set([...docTxt.matchAll(/`((?:tools|bg)\/[\w\-.]+\.\w+)`/g)].map(m => m[1]))].filter(f => !fs.existsSync(path.join(ROOT, f)));
check(!noSpec.length && !ghost.length, 'đặc tả docs/ đủ 8 phần, không nhắc tệp không tồn tại', [...noSpec, ...ghost].join(', '));
const dirty = sh('git status --porcelain').split('\n').filter(Boolean).map(l => l.slice(3)), core = dirty.filter(f => /^(index\.html|xianxia\.mjs|mocap\.mjs|sam\.glb|bg\/)/.test(f));
check(!core.length || dirty.includes('sw.js'), 'sw.js đã tăng phiên bản khi đổi mã/nội dung', 'đổi ' + core.slice(0, 3).join(', ') + ' mà chưa tăng gia-su-vNN');
const ahead = sh('git log origin/main..HEAD --oneline'); ahead ? warn('có commit chưa đẩy', ahead.split('\n').length + ' commit') : ok('mọi commit đã đẩy');
const sw = read('sw.js').match(/gia-su-v(\d+)/)?.[1]; const sw0 = sh('git show HEAD:sw.js').match(/gia-su-v(\d+)/)?.[1]; if (sw && sw0 && +sw < +sw0) bad('sw.js lùi phiên bản', `${sw0} → ${sw}`);

// ───────── QC: chạy thật ─────────
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404).end(); return; }
  const s = fs.statSync(p), m = /bytes=(\d+)-(\d*)/.exec(q.headers.range || ''), h = { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'no-store' };
  if (m) { const a = +m[1], b = m[2] ? +m[2] : s.size - 1; r.writeHead(206, { ...h, 'content-range': `bytes ${a}-${b}/${s.size}`, 'content-length': b - a + 1 }); fs.createReadStream(p, { start: a, end: b }).pipe(r); }
  else { r.writeHead(200, { ...h, 'content-length': s.size }); fs.createReadStream(p).pipe(r); }
}).listen(PORT);
for (const d of fs.readdirSync(path.dirname(PROFILE)).filter(d => /^chrome-qa-\d+$/.test(d))) try { fs.rmSync(path.join(path.dirname(PROFILE), d), { recursive: true, force: true }); } catch {} // dọn hồ sơ các lần chạy trước (hồ sơ mỗi lần một thư mục riêng để khỏi vướng khoá)
const chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${DBG}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let page; for (let i = 0; i < 40 && !page; i++) { await sleep(500); try { page = (await (await fetch(`http://localhost:${DBG}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
const finish = async () => {
  try { const v = await (await fetch(`http://localhost:${DBG}/json/version`)).json(); const w = new WebSocket(v.webSocketDebuggerUrl); w.onopen = () => w.send('{"id":1,"method":"Browser.close"}'); await sleep(800); } catch {}
  srv.close(); try { execSync(`taskkill /F /T /PID ${chrome.pid}`, { stdio: 'ignore' }); } catch {} chrome.kill(); // Chrome headless hay sót tiến trình con
  const w = Math.max(...res.map(r => r[1].length)); for (const [i, nme, d] of res) console.log(`${i} ${nme}${d ? '  — ' + d : ''}`);
  const f = res.filter(r => r[0] === '❌').length; console.log(`\n${f ? '❌ ' + f + ' mục hỏng' : '✅ QA/QC đạt'} · ${res.filter(r => r[0] === '⚠️').length} cảnh báo · ${res.length} mục`); process.exit(f ? 1 : 0);
};
if (!page) { bad('khởi động Chrome headless'); await finish(); }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data);
  if (pend[m.id]) { pend[m.id](m.result ?? m.error); delete pend[m.id]; }
  else if (m.method === 'Runtime.exceptionThrown') errs.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|the server responded with a status of 404/.test(m.params.entry.text + m.params.entry.url)) errs.push('console: ' + m.params.entry.text.slice(0, 140) + ' ' + (m.params.entry.url || '').split('/').pop());
};
const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr, t = 60000) => { const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), sleep(t).then(() => ({ result: { value: { timeout: true } } }))]); return r?.exceptionDetails ? { error: r.exceptionDetails.exception?.description?.split('\n')[0] } : r?.result?.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const open = async (w, h) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 600 }); await send('Page.navigate', { url: `http://localhost:${PORT}/` }); await sleep(1500);
  for (let i = 0; i < 60 && await ev("typeof window.Avatar") !== 'object'; i++) await sleep(500); }; // chờ module + thư viện CDN nạp xong
await send('Page.navigate', { url: `http://localhost:${PORT}/` }); await sleep(1500);
await ev(`localStorage.setItem('gs_key', JSON.stringify('qa')); localStorage.setItem('wx','quang'); localStorage.setItem('dn','ngay'); localStorage.setItem('dh','1'); localStorage.removeItem('kv'); 1`);

// bố cục + nút ở 4 cỡ màn
const LAYOUT = `(()=>{const cw=document.documentElement.clientWidth,ch=document.documentElement.clientHeight,out=[];
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
  document.querySelectorAll('header *, nav *, footer *, #call *, #chat *').forEach(e=>{if(!vis(e)||e.closest('canvas')||e.tagName==='CANVAS')return;const r=e.getBoundingClientRect();
    if(r.right>cw+1||r.left<-1)out.push('tràn ngang: '+(e.id||e.className||e.tagName)+' '+Math.round(r.left)+'..'+Math.round(r.right))});
  const small=[...document.querySelectorAll('button')].filter(b=>vis(b)&&!b.closest('dialog')&&!b.closest('#scenePanel')).filter(b=>{const r=b.getBoundingClientRect();return Math.min(r.width,r.height)<40}).map(b=>(b.id||b.textContent.trim().slice(0,12))+' '+Math.round(b.getBoundingClientRect().width)+'x'+Math.round(b.getBoundingClientRect().height));
  return {sw:document.documentElement.scrollWidth,cw,over:out.slice(0,4),small}})()`;
for (const [w, h] of [[360, 740], [393, 873], [412, 915], [1280, 800]]) {
  await open(w, h); const r = await ev(LAYOUT);
  check(r && r.sw <= r.cw && !r.over?.length, `${w}×${h}: không tràn ngang`, r ? `scrollWidth ${r.sw}>${r.cw} ${r.over?.join('; ')}` : 'không đo được');
  check(r && !r.small?.length, `${w}×${h}: nút đủ to cho ngón tay (≥40px)`, r?.small?.join('; '));
}

// nhân vật + cảnh (khổ Redmi)
await open(393, 873);
const init = await ev(`(async()=>{try{const t0=performance.now();const ok=await window.Avatar.init();return {ok,ms:Math.round(performance.now()-t0)}}catch(e){return {err:e.message}}})()`, 120000);
check(init?.ok === true, 'nhân vật 3D nạp được', JSON.stringify(init)); if (init?.ms > 25000) warn('nạp nhân vật chậm trên máy này', init.ms + ' ms');
const vw = await ev(`(async()=>{const h=window.Avatar.head,t=performance.now(),has=()=>{let c=0;h.scene.traverse(o=>{if(o.material?.map?.isVideoTexture)c++});return c};
  while(performance.now()-t<40000&&!has())await new Promise(r=>setTimeout(r,500));await new Promise(r=>setTimeout(r,1500));return +((performance.now()-t)/1000).toFixed(1)})()`, 60000);  // chờ video nền tải xong
if (vw > 15) warn('video nền tải chậm trong Chrome ngầm', vw + ' s');
const scene = await ev(`(()=>{const h=window.Avatar.head,env=h.scene.getObjectByName('xianxia'),vids=new Set();h.scene.traverse(o=>{const m=o.material?.map;if(m?.isVideoTexture)vids.add(m.image)});
  const v=[...vids].map(x=>({src:x.src.split('/').pop(),w:x.videoWidth,paused:x.paused,t:x.currentTime}));
  let plat=0,lights=0;h.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.position.count>15000)plat++;if(o.isPointLight)lights++});
  return {env:!!env,v,plat,lights,fov:h.camera.fov,btn:document.getElementById('sceneBtn')?.textContent}})()`);
check(scene?.env, 'cảnh tiên hiệp dựng được'); check(scene?.plat >= 1, 'bục 3D (bg/buc.glb) đã nạp'); check(scene?.lights >= 1, 'đèn điểm của đèn lồng có mặt');
check(scene?.v?.length >= 1 && scene.v.every(x => !x.paused && x.w >= 1280), 'video nền chạy, ≥ 720p', JSON.stringify(scene?.v));
const t1 = await ev(`(async()=>{const h=window.Avatar.head;const s=new Set();h.scene.traverse(o=>{const m=o.material?.map;if(m?.isVideoTexture)s.add(m.image)});const v=[...s][0];if(!v)return null;const a=v.currentTime;await new Promise(r=>setTimeout(r,1500));return +(v.currentTime-a).toFixed(2)})()`);
check(t1 > 0.3, 'video thực sự tiến khung hình (không đứng hình)', 'tiến ' + t1 + ' s / 1,5 s');

// bảng cảnh
const panel = await ev(`(async()=>{const b=document.getElementById('sceneBtn'),p=document.getElementById('scenePanel');b.click();await new Promise(r=>setTimeout(r,200));const r=p.getBoundingClientRect(),cw=innerWidth,ch=innerHeight;
  const ok=!p.hidden&&r.left>=0&&r.right<=cw&&r.bottom<=ch;const seg=document.querySelectorAll('#segDn button,#segWx button').length,kv=document.getElementById('kvSel').options.length;
  document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await new Promise(r=>setTimeout(r,200));return {ok,seg,kv,closed:p.hidden,note:document.getElementById('seasonNote').textContent}})()`);
check(panel?.ok, 'bảng chọn cảnh mở được, nằm gọn trong màn'); check(panel?.seg === 10 && panel?.kv === 10, 'bảng cảnh đủ nút (4 buổi + 6 thời tiết) và 10 khu vực', JSON.stringify(panel)); check(panel?.closed, 'bấm ra ngoài thì bảng tự đóng');

// mọi tổ hợp buổi × thời tiết × mùa, và đèn sáng đêm / tắt ngày
const combo = await ev(`(async()=>{const x=await import('./xianxia.mjs'),env=window.Avatar.head.scene.getObjectByName('xianxia'),u=env.userData,bad=[];let n=0;
  for(const p of Object.keys(x.PHASES))for(const w of Object.keys(x.WEATHERS))for(const s of Object.keys(x.SEASONS)){try{u.setPhase(p);u.setWeather(w);u.setSeason(s);n++}catch(e){bad.push(p+'/'+w+'/'+s+': '+e.message)}}
  const lamp=()=>{let v=-1;window.Avatar.head.scene.traverse(o=>{if(o.isPointLight)v=o.intensity});return +v.toFixed(2)};
  const until=async(f,ms=20000)=>{const t=performance.now();while(performance.now()-t<ms&&!f())await new Promise(r=>setTimeout(r,250));return +((performance.now()-t)/1000).toFixed(1)};  // chờ tween xong (Chrome ngầm vẽ chậm nên không chờ cố định)
  u.setWeather('quang');u.setPhase('dem');const tn=await until(()=>lamp()>1.15);const night=lamp();
  u.setPhase('ngay');const td=await until(()=>lamp()<.05);const day=lamp();
  u.setWeather('mua');u.setPhase('dem');await new Promise(r=>setTimeout(r,500));
  return {n,bad,night,day,tn,td}})()`, 90000);
check(combo?.n === 4 * 0 + 3 * 5 * 6 && !combo?.bad?.length, `mọi tổ hợp buổi×thời tiết×mùa chạy không lỗi (${combo?.n})`, combo?.bad?.slice(0, 2).join('; '));
check(combo?.night > 1.1 && combo?.day < 0.05, 'đèn lồng: đêm sáng, ngày tắt', `đêm ${combo?.night} (${combo?.tn}s) · ngày ${combo?.day} (${combo?.td}s)`);
// toàn thân + dù: chân Sam nằm trên hàng nút; mưa/tuyết thì dù mở, nằm gọn trong màn; hết mưa thì dù đóng
const FRAME = `(async()=>{const h=window.Avatar.head,u=window.samEnv.userData,{Vector3}=await import('three');
  const until=async(f,ms=25000)=>{const t=performance.now();while(performance.now()-t<ms&&!f())await new Promise(r=>setTimeout(r,250));return f()};
  const px=(v)=>{const p=v.clone().project(h.camera);return {x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight}};
  const foot=()=>{let y=0;for(const n of ['LeftToeBase','RightToeBase','LeftFoot','RightFoot']){const b=h.armature.getObjectByName(n),v=new Vector3();b.getWorldPosition(v);y=Math.max(y,px(v).y)}return y};
  const btn=document.getElementById('callIdle').getBoundingClientRect(), r={};
  u.setWeather('quang');u.setPhase('ngay');await until(()=>u.umb<.02&&h.camera.position.z<4.4);await new Promise(r=>setTimeout(r,1500));
  r.camClear=+h.camera.position.z.toFixed(1);r.footY=Math.round(foot());r.btnTop=Math.round(btn.top);r.umbClear=+u.umb.toFixed(2);
  u.setWeather('mua');r.opened=await until(()=>u.umb>.95&&h.camera.position.z>4.6);await new Promise(r=>setTimeout(r,1500));
  r.ready=u.umbReady();const P=u.umbPts();r.apexY=Math.round(px(P[0]).y);r.footRainY=Math.round(foot());r.rimL=Math.round(px(P[1]).x);r.rimR=Math.round(px(P[2]).x);r.umbRain=+u.umb.toFixed(2);
  u.hits=0;u.leak=0;await new Promise(r=>setTimeout(r,5000));r.hits=u.hits;r.leak=u.leak;  // mưa phải CHẠM tán dù, ít lọt xuống dưới
  u.setWeather('tuyet');const s0=u.snowAmt||0;await new Promise(r=>setTimeout(r,8000));r.umbSnow=+u.umb.toFixed(2);r.snowGain=+((u.snowAmt||0)-s0).toFixed(3);  // tuyết phải đọng lên tán
  u.setWeather('suong');r.closed=await until(()=>u.umb<.02);r.umbFog=+u.umb.toFixed(2);u.setWeather('quang');
  r.w=innerWidth;return r})()`;
const fr = await ev(FRAME, 120000);
check(fr && fr.footY < fr.btnTop - 4 && fr.footY > 0, 'toàn thân: thấy chân Sam (trời quang), nằm trên hàng nút', `chân y=${fr?.footY} · nút y=${fr?.btnTop}`);
check(fr?.opened && fr.ready && fr.umbRain > .95 && fr.umbSnow > .95, 'mưa/giông/tuyết: Sam cầm dù Magnific (đã nạp, mở hết cỡ)', JSON.stringify(fr));
check(fr?.hits > 20 && fr.leak < fr.hits * .3, 'vật lý hạt: giọt mưa chạm tán dù (không xuyên qua)', `chạm ${fr?.hits} · lọt ${fr?.leak}`);
check(fr?.snowGain > .01, 'vật lý hạt: tuyết đọng dần lên tán dù', 'tăng ' + fr?.snowGain);
check(fr?.apexY > 0 && fr.rimL > -20 && fr.rimR < fr.w + 20 && fr.footRainY < fr.btnTop - 4, 'có dù: cả tán dù + chân vẫn nằm trong màn', `đỉnh dù y=${fr?.apexY} · mép ${fr?.rimL}..${fr?.rimR}/${fr?.w} · chân ${fr?.footRainY}`);
check(fr?.umbClear < .05 && fr?.closed, 'trời quang/sương mù: dù đóng', `quang ${fr?.umbClear} · sương ${fr?.umbFog}`);
const seasons = await ev(`(async()=>{const x=await import('./xianxia.mjs'),r=[];const so=x.seasonOf;
  const exp=[['hn',3,'xuan'],['hn',6,'ha'],['hn',10,'thu'],['hn',12,'dong'],['sapa',1,'dong'],['hcm',1,'kho'],['hcm',6,'mua'],['hue',10,'mua'],['dng',5,'kho']];
  for(const [k,m,e] of exp)if(so(k,m)!==e)r.push(k+' tháng '+m+': '+so(k,m)+' ≠ '+e);
  for(const [k,s] of Object.entries(x.SEASONS)){const h=await fetch('bg/v-'+s.video+'.mp4',{method:'HEAD'});if(!h.ok||+h.headers.get('content-length')<1e5)r.push('thiếu video '+k)}
  for(const [k,[,la,lo]] of Object.entries(x.REGIONS))if(!(la>8&&la<24&&lo>102&&lo<110))r.push('toạ độ '+k+' ngoài Việt Nam');
  const w=[[0,'quang'],[3,'quang'],[45,'suong'],[61,'mua'],[81,'mua'],[75,'tuyet'],[95,'bao']];for(const [c,e] of w)if(x.wmoToWeather(c)!==e)r.push('WMO '+c);
  return r})()`);
check(!seasons?.length, 'mùa theo vùng + video mỗi mùa + toạ độ + mã thời tiết WMO đúng', seasons?.join('; '));
const api = await ev(`fetch('https://api.open-meteo.com/v1/forecast?latitude=21.03&longitude=105.85&current=weather_code').then(r=>r.json()).then(j=>typeof j.current?.weather_code,()=>'offline')`);
api === 'number' ? ok('Open-Meteo trả thời tiết thật') : warn('không gọi được Open-Meteo', String(api));

// luật ngôn ngữ + hiển thị chat
const lang = await ev(`(()=>{const p=livePrompt(),r=[];if(!/SPEAK ONLY ENGLISH/.test(p))r.push('thiếu luật chỉ nói tiếng Anh');if(!/UNDERSTAND Vietnamese/.test(p))r.push('thiếu luật hiểu tiếng Việt');if(/speak like a young person from Saigon/.test(p))r.push('còn luật nói tiếng Việt miền Nam');
  for(const [t,e] of [['你好',true],['สวัสดี',true],['こんにちは',true],['안녕',true],['Привет',true],['Hello bạn ơi, khỏe hông?',false],['I am wiped out — nha!',false]])if(FOREIGN.test(t)!==e)r.push('FOREIGN '+t);
  render({role:'model',text:'💡 Người bản xứ sẽ nói: I am beat.\\nOh no!\\n✏️ Tự nhiên hơn: I went.\\n🗣 Say this'});const c=document.getElementById('chat').lastChild;
  if(!c.querySelector('.fix.tip'))r.push('dòng 💡 không có kiểu .fix.tip');if(!c.querySelector('.fix:not(.tip)'))r.push('dòng ✏️ không có kiểu .fix');if(!c.querySelector('.say'))r.push('dòng 🗣 không có kiểu .say');
  return r})()`);
check(!lang?.length, 'Sam chỉ nói tiếng Anh · bộ lọc chữ lạ · hiển thị 💡 ✏️ 🗣', lang?.join('; ') || JSON.stringify(lang));
const ci = await ev(`(()=>{document.querySelector('nav button[data-view=vRoad]').click();const k=document.getElementById('road').children.length;document.querySelector('nav button[data-view=vChat]').click();document.getElementById('openSet').click();const d=document.getElementById('set').open;document.getElementById('set').close();return {k,d}})()`);
check(ci?.k > 2 && ci?.d, 'tab IELTS dựng được, hộp Cài đặt mở được', JSON.stringify(ci));

const e2 = [...new Set(errs)]; check(!e2.length, 'không lỗi console / exception trong cả phiên', e2.slice(0, 4).join(' | '));
await finish();
