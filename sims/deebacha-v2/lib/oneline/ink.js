// 墨线渲染：路径 + 笔压（快细慢粗）+ 边缘微毛 + 慢处积墨 + 老年颤抖/飞白 + 唯一一段红线
import { vnoise, clamp, lerp } from '/core/lib.js';

export const PAPER = [244, 239, 228];
export const INK = [29, 26, 23];
export const RED = [179, 51, 43];

export const GOLD = [178, 132, 46];
const STY = {
  main: { w: 2.9, a: .95 },
  fine: { w: 2.3, a: .9 },
  light: { w: 1.7, a: .42 },
  gold: { w: 3.3, a: .98 },
};

// per-point style, fixed once on paper. segs[i].style picks width/alpha; 'gold' is the one accent.
export function prepare(P) {
  const { N, S, SEG, segs } = P;
  const W0 = new Float64Array(N), A0 = new Float64Array(N), G0 = new Float64Array(N);
  for (let i = 0; i < N; i++) { const sg = segs[SEG[i]], st = STY[sg.style] || STY.main; W0[i] = st.w; A0[i] = st.a; G0[i] = sg.style === 'gold' ? 1 : 0; }
  const smooth = (arr, R) => { const out = new Float64Array(N); let acc = 0, lo = 0, hi = -1; for (let i = 0; i < N; i++) { while (hi < N - 1 && S[hi + 1] <= S[i] + R) acc += arr[++hi]; while (S[lo] < S[i] - R) acc -= arr[lo++]; out[i] = acc / (hi - lo + 1); } return out; };
  const W = smooth(W0, 16), A = smooth(A0, 16), G = smooth(G0, 14);
  P.DX = P.X; P.DY = P.Y;
  const WID = new Float64Array(N), DRY = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const v = P.V[i], pr = 0.66 + 0.8 * Math.exp(-v / 300);
    WID[i] = W[i] * pr * (1 + 0.16 * (vnoise(S[i] / 3.1 + 7) - .5));
  }
  const COL = new Array(N);
  for (let i = 0; i < N; i++) {
    const g = G[i], base = [lerp(INK[0], GOLD[0], g), lerp(INK[1], GOLD[1], g), lerp(INK[2], GOLD[2], g)];
    const a = A[i]; COL[i] = [lerp(PAPER[0], base[0], a), lerp(PAPER[1], base[1], a), lerp(PAPER[2], base[2], a)];
  }
  Object.assign(P, { WID, COL, DRY, A, ACC: G });
  P.blots = P.blots || [];
  return P;
}

const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

// 在 ctx 上画出 [0, head] 的线。M = 世界 → 屏幕的变换函数，k = 每单位像素
export function drawLine(ctx0, P, head, M, k, opts = {}) {
  let ctx = ctx0;
  const n = Math.min(P.N - 1, Math.floor(head)); if (n < 1) return;
  const X = P.DX, Y = P.DY, WID = P.WID, COL = P.COL, DRY = P.DRY;
  const f = head - n;
  const kw = Math.max(k, 1.3);   // 线宽用的缩放：拉远时不再变细
  // 屏幕坐标
  let sx = new Float32Array(n + 2), sy = new Float32Array(n + 2);
  let F0 = Math.max(0, opts.from || 0);
  for (let i = 0; i <= n; i++) { if (i < F0) { sx[i] = -1e5; sy[i] = -1e5; continue; } const p = M(X[i], Y[i]); sx[i] = p[0]; sy[i] = p[1]; }
  let m = n;
  if (f > 0 && n + 1 < P.N) { const p = M(lerp(X[n], X[n + 1], f), lerp(Y[n], Y[n + 1], f)); sx[n + 1] = p[0]; sy[n + 1] = p[1]; m = n + 1; }
  // keep only points ≥ 1.3 px apart on screen (the polygon fill is the cost); j → original index K[j]
  const osx = sx, osy = sy, K = [];
  for (let i = F0; i <= m; i++) { if (!K.length || i === m) { K.push(i); continue; } const q = K[K.length - 1]; if (Math.abs(sx[i] - sx[q]) + Math.abs(sy[i] - sy[q]) >= 1.3) K.push(i); }
  if (K.length < 2) return;
  sx = Float32Array.from(K, i => osx[i]); sy = Float32Array.from(K, i => osy[i]);
  const mOrig = m; m = K.length - 1; const FO = F0; F0 = 0;
  const idx = j => Math.min(K[j], n);
  // 法线
  const nx = new Float32Array(m + 1), ny = new Float32Array(m + 1);
  for (let i = 0; i <= m; i++) {
    const a = Math.max(F0, i - 1), b = Math.min(m, Math.max(i + 1, F0)); let dx = sx[b] - sx[a], dy = sy[b] - sy[a]; const l = Math.hypot(dx, dy) || 1; nx[i] = -dy / l; ny[i] = dx / l;
  }
  // 屏幕外裁剪：只画可见附近的点段
  const Wd = ctx.canvas.width, Ht = ctx.canvas.height, mg = 60;
  const vis = new Uint8Array(m + 1);
  for (let i = 0; i <= m; i++) vis[i] = i >= F0 && (sx[i] > -mg && sx[i] < Wd + mg && sy[i] > -mg && sy[i] < Ht + mg) ? 1 : 0;
  // 头部笔尖处线宽略收（笔刚到）
  const wAt = (i, scale) => {
    let w = WID[idx(i)] * kw * scale;
    const back = (mOrig - K[i]) * 0.6; if (back < 3) w *= 0.75 + 0.25 * back / 3;
    return Math.max(w, 0.6);
  };
  // 按颜色/可见性/飞白断墨切成若干 run，每个 run 填一个多边形
  function runs(pass) {
    const out = []; let cur = null;
    for (let i = 0; i <= m; i++) {
      const ii = idx(i);
      let on = i >= F0 && (vis[i] || (i > 0 && vis[i - 1]) || (i < m && vis[i + 1]));
      if (on && DRY[ii] > 0 && pass.strand == null) {
        // 老年断墨：长尺度噪声决定断点
        const g = vnoise(P.S[ii] / 23 + 3.7) * .7 + vnoise(P.S[ii] / 7 + 9) * .3;
        if (g < DRY[ii] * 0.36) on = false;
      }
      if (on && pass.strand != null) {
        const g = vnoise(P.S[ii] / (9 + pass.strand * 3) + pass.strand * 17.3);
        if (g < 0.2 + DRY[ii] * 0.35) on = false;
      }
      const ck = COL[ii]; const key = ((ck[0] / 6) | 0) * 10000 + ((ck[1] / 6) | 0) * 100 + ((ck[2] / 6) | 0);
      if (!on) { if (cur) { out.push(cur); cur = null; } continue; }
      if (!cur) cur = { a: i, b: i, key };
      else if (key !== cur.key) { cur.b = i; out.push(cur); cur = { a: i, b: i, key }; }
      else cur.b = i;
    }
    if (cur) out.push(cur);
    return out;
  }
  function fillRun(r, scale, offset, colorFn) {
    if (r.b <= r.a) return;
    ctx.beginPath();
    for (let i = r.a; i <= r.b; i++) { const w = wAt(i, scale) / 2, o = offset ? offset * wAt(i, 1) : 0; ctx.lineTo(sx[i] + nx[i] * (w + o), sy[i] + ny[i] * (w + o)); }
    for (let i = r.b; i >= r.a; i--) { const w = wAt(i, scale) / 2, o = offset ? offset * wAt(i, 1) : 0; ctx.lineTo(sx[i] - nx[i] * (w - o), sy[i] - ny[i] * (w - o)); }
    ctx.closePath(); ctx.fillStyle = colorFn(COL[idx(r.a)]); ctx.fill();
    // 圆头
    for (const i of [r.a, r.b]) { const w = wAt(i, scale) / 2; ctx.beginPath(); ctx.arc(sx[i] + nx[i] * (offset ? offset * wAt(i, 1) : 0), sy[i] + ny[i] * (offset ? offset * wAt(i, 1) : 0), w, 0, Math.PI * 2); ctx.fill(); }
  }
  const core = c => rgb(c);
  // 1 晕边（墨渗进纸纤维）：离屏画一遍加宽的线，整体模糊后低透明度叠回
  const PR = window.OLPROF, qq = () => { if (PR) ctx0.getImageData(0, 0, 1, 1); return performance.now(); }; let tq = qq();
  const R0 = runs({});
  // (half-resolution layer: upscaling it is the blur, far cheaper than a blur filter)
  if (!drawLine.halo) { drawLine.halo = document.createElement('canvas'); drawLine.halo.width = Wd / 2; drawLine.halo.height = Ht / 2; }
  const hc = drawLine.halo, hx = hc.getContext('2d'); hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, Wd / 2, Ht / 2); hx.setTransform(.5, 0, 0, .5, 0, 0);
  const main = ctx; ctx = hx;
  for (const r of R0) fillRun(r, 1.0 + 2.4 / Math.max(1, WID[idx(r.a)]), 0, core);
  ctx = main; if (PR) { hx.getImageData(0,0,1,1); PR.hfill = (PR.hfill || 0) + qq() - tq; tq = qq(); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .24; ctx.imageSmoothingQuality = 'low';
  { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let j = 0; j <= m; j++) if (vis[j]) { if (sx[j] < x0) x0 = sx[j]; if (sx[j] > x1) x1 = sx[j]; if (sy[j] < y0) y0 = sy[j]; if (sy[j] > y1) y1 = sy[j]; }
    x0 = Math.max(0, Math.floor((x0 - 24) / 2)); y0 = Math.max(0, Math.floor((y0 - 24) / 2)); x1 = Math.min(Wd / 2, Math.ceil((x1 + 24) / 2)); y1 = Math.min(Ht / 2, Math.ceil((y1 + 24) / 2));
    if (x1 > x0 && y1 > y0) ctx.drawImage(hc, x0, y0, x1 - x0, y1 - y0, x0 * 2, y0 * 2, (x1 - x0) * 2, (y1 - y0) * 2); }
  ctx.restore();
  if (PR) { PR.hcomp = (PR.hcomp || 0) + qq() - tq; tq = qq(); }
  // 2 主体
  for (const r of R0) fillRun(r, 1.0, 0, core);
  if (PR) { PR.main = (PR.main || 0) + qq() - tq; tq = qq(); PR.runs = R0.length; PR.m = m; }
  // 3 老年飞白：几根笔毫轨迹穿过断墨处
  if (P.DRY[idx(m)] > 0 || opts.allDry) for (let s = 0; s < 3; s++) {
    const R = runs({ strand: s }).filter(r => DRY[idx(r.a)] > 0);
    const off = [-0.32, 0.05, 0.36][s];
    for (const r of R) fillRun(r, 0.28, off, core);
  }
  // 慢处积墨：速度很低的点加圆墨点
  ctx.fillStyle = rgb(INK);
  for (let i = FO; i <= n; i += 2) {
    if (P.R[i]) continue; const v = P.V[i]; if (v > 45) continue;
    const x = osx[i], y = osy[i]; if (x < -mg || x > Wd + mg || y < -mg || y > Ht + mg) continue;
    const w = WID[i] * kw * (0.62 + 0.3 * (1 - v / 45)); ctx.fillStyle = core(COL[i]); ctx.beginPath(); ctx.arc(x, y, w, 0, Math.PI * 2); ctx.fill();
  }
  return { tip: [sx[m], sy[m]], dir: [sx[m] - sx[Math.max(0, m - 6)], sy[m] - sy[Math.max(0, m - 6)]] };
}

// 失去：停笔处墨点慢慢洇开（泪滴形：尖朝上贴着停笔点，圆肚往下坠；带深色水线和不规则边）
export function drawBlots(ctx, P, t, M, k) {
  for (const b of P.blots) {
    if (t < b.t0) continue;
    const u = clamp((t - b.t0) / b.dur), g = 1 - Math.pow(1 - u, 2.2);
    const R = (P.WID[b.k] * 0.7 + b.r * g) * k, c0 = M(P.DX[b.k], P.DY[b.k]);
    const drop = g * 0.9;                       // 越洇越往下坠
    const c = [c0[0], c0[1] + R * (0.25 + drop)];
    const pts = []; const n = 90;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2; let x = Math.cos(a), y = Math.sin(a);
      const up = Math.pow(Math.max(0, -y), 1.6) * drop;       // 上半部拉成尖
      x *= 1 - 0.72 * up; y *= 1 + 0.95 * up;
      const rr = R * (0.9 + 0.16 * vnoise(i * 0.37 + 5) + 0.08 * vnoise(i * 1.3 + 20) * g);
      pts.push([c[0] + x * rr, c[1] + y * rr]);
    }
    ctx.beginPath(); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
    const gr = ctx.createRadialGradient(c[0], c[1] + R * .2, 0, c[0], c[1], R * 1.25);
    gr.addColorStop(0, 'rgba(29,26,23,0.82)'); gr.addColorStop(0.7, 'rgba(29,26,23,0.66)'); gr.addColorStop(0.9, 'rgba(22,19,17,0.95)'); gr.addColorStop(1, 'rgba(22,19,17,0.7)');
    ctx.fillStyle = gr; ctx.fill();
  }
}
