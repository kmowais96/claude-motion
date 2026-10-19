// Life for the ivory scenes. A breeze comes in gusts through an unseen window: two branches throw swaying shadows,
// leaves fall and settle on the paper and slide when the next gust comes, clouds pass over the light, dust glints in
// the beam, birds cross, the silk bookmark stirs, the gold catches the light. All pure in time.
const TAU = Math.PI * 2, cl = x => Math.max(0, Math.min(1, x)), io = x => { x = cl(x); return x * x * (3 - 2 * x); };

export function makeLife(W, H, rnd) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const LEAF = mk(), BIRD = mk(), CLOUD = mk();

  // the breeze: a steady stir plus gusts that swell and die away
  const GUSTS = [7, 17, 27, 38, 49, 60];
  const gust = t => GUSTS.reduce((s, g) => { const k = (t - g) / 4.5; return s + (k > 0 && k < 1 ? Math.sin(Math.PI * k) ** 2 : 0); }, 0);
  const breeze = t => .35 + .25 * Math.sin(t * .6) * Math.sin(t * 1.7 + 2) + gust(t);

  // branches: a bough from the top-right corner and a smaller one from the bottom-left
  function bough(ax, ay, ex, ey, n, scale) {
    const twigs = [];
    for (let i = 0; i < n; i++) {
      const s = .18 + i * (.75 / n), bx = ax + (ex - ax) * s, by = ay + (ey - ay) * s + 30 * scale * Math.sin(s * 5);
      const side = i % 2 ? 1 : -1, a = Math.atan2(ey - ay, ex - ax) + side * (.6 + rnd() * .4), len = (70 + rnd() * 70) * scale;
      const leaves = Array.from({ length: 3 + (rnd() * 3 | 0) }, (_, j) => ({ f: .35 + j * .2, side: j % 2 ? 1 : -1, l: (26 + rnd() * 16) * scale, ph: rnd() * TAU }));
      twigs.push({ bx, by, a, len, leaves, ph: rnd() * TAU });
    }
    return { ax, ay, ex, ey, twigs, scale };
  }
  const BOUGHS = [bough(W + 80, -60, W - 760, 450, 11, 1.1), bough(-80, H + 60, 520, H - 330, 7, .9)];
  function leaves(X, t, alpha) {
    const g = LEAF.getContext('2d'); g.clearRect(0, 0, W, H); g.strokeStyle = g.fillStyle = '#000'; g.lineCap = 'round';
    const b = breeze(t);
    BOUGHS.forEach((B, bi) => {
      const sway = (.02 + .03 * b) * Math.sin(t * .45 + bi * 2) + .015 * b * Math.sin(t * 2.3 + bi);
      g.save(); g.translate(B.ax, B.ay); g.rotate(sway); g.translate(-B.ax, -B.ay);
      g.lineWidth = 14 * B.scale; g.beginPath(); g.moveTo(B.ax, B.ay); g.quadraticCurveTo((B.ax + B.ex) / 2 + 160, (B.ay + B.ey) / 2 - 100, B.ex, B.ey); g.stroke();
      for (const w of B.twigs) {
        const a = w.a + (.05 + .1 * b) * Math.sin(t * (1 + .4 * b) + w.ph), ex = w.bx + Math.cos(a) * w.len, ey = w.by + Math.sin(a) * w.len;
        g.lineWidth = 4 * B.scale; g.beginPath(); g.moveTo(w.bx, w.by); g.lineTo(ex, ey); g.stroke();
        for (const L of w.leaves) {
          const px = w.bx + (ex - w.bx) * L.f, py = w.by + (ey - w.by) * L.f, la = a + L.side * .9 + (.15 + .35 * b) * Math.sin(t * (1.6 + 1.5 * b) + L.ph);
          g.save(); g.translate(px + Math.cos(la) * L.l * .55, py + Math.sin(la) * L.l * .55); g.rotate(la);
          g.beginPath(); g.ellipse(0, 0, L.l * .6, L.l * .24 * (.7 + .3 * Math.cos(t * 2.4 * b + L.ph)), 0, 0, TAU); g.fill(); g.restore();
        }
        g.save(); g.translate(ex, ey); g.rotate(a + .25 * Math.sin(t * 1.4 + w.ph)); g.beginPath(); g.ellipse(14, 0, 22 * B.scale, 9 * B.scale, 0, 0, TAU); g.fill(); g.restore();
      }
      g.restore();
    });
    X.save(); X.globalAlpha = alpha; X.globalCompositeOperation = 'multiply'; X.filter = 'blur(9px) opacity(.17)'; X.drawImage(LEAF, 0, 0); X.restore();
  }
  const flicker = t => .9 + .1 * Math.sin(t * .45 + .6) * Math.sin(t * (1.27 + .8 * gust(t)) + 1);

  // clouds: big soft shadows drifting across, dimming the light as they pass
  const CLOUDS = [{ t0: 10, dur: 22, y: 380, r: 520 }, { t0: 36, dur: 24, y: 640, r: 600 }];
  function clouds(X, t) {
    const g = CLOUD.getContext('2d'); g.clearRect(0, 0, W, H); let any = false;
    for (const c of CLOUDS) { const k = (t - c.t0) / c.dur; if (k < 0 || k > 1) continue; any = true;
      const x = -c.r * 1.5 + (W + c.r * 3) * k;
      for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(0,0,0,1)'; g.beginPath(); g.ellipse(x + (i - 2) * c.r * .35, c.y + 50 * Math.sin(i * 2.1), c.r * .5, c.r * .32, 0, 0, TAU); g.fill(); } }
    if (!any) return;
    X.save(); X.globalCompositeOperation = 'multiply'; X.filter = 'blur(120px) opacity(.08)'; X.drawImage(CLOUD, 0, 0); X.restore();
  }
  // how much a cloud is over the light, to dim the beam with it
  const shade = t => CLOUDS.reduce((s, c) => { const k = (t - c.t0) / c.dur; return s + (k > 0 && k < 1 ? .3 * Math.sin(Math.PI * k) ** 2 : 0); }, 0);

  const MOTES = Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H, v: 5 + rnd() * 12, a: rnd() * TAU, s: 1 + rnd() * 2, w: .3 + rnd() * .6 }));
  function motes(X, t, bx0, k) {
    X.save();
    for (const m of MOTES) {
      const y = ((m.y - m.v * t) % (H + 80) + H + 80) % (H + 80) - 40, x = m.x + 30 * Math.sin(m.a + t * m.w * .5) + 6 * t * m.w + 40 * Math.sin(t * .7 + m.a) * gust(t);
      const c = bx0 + 440 * (y + 60) / (H + 120), hw = 200 + 120 * (y / H), on = cl(1.2 - Math.abs(x - c) / hw);
      if (on <= 0) continue;
      const tw = .5 + .5 * Math.sin(m.a * 3 + t * 2.1);
      X.globalAlpha = k * Math.min(1, on) * (.25 + .6 * tw) * (1 - shade(t));
      X.fillStyle = 'rgba(214,170,84,.45)'; X.beginPath(); X.arc(x, y, m.s * 2.4, 0, TAU); X.fill();
      X.fillStyle = '#b8862e'; X.beginPath(); X.arc(x, y, m.s * .8, 0, TAU); X.fill();
      X.fillStyle = '#fffdf4'; X.beginPath(); X.arc(x - .3, y - .3, m.s * .45, 0, TAU); X.fill();
    }
    X.restore();
  }

  // falling leaves: each drifts down, swinging and turning over, settles on the paper, and slides on with a later gust
  const FALL_COL = [['#7d8a3a', '#55632a'], ['#b8892f', '#8a6224'], ['#97733a', '#6e5227'], ['#6f7f3c', '#4a5726']];
  function fallingLeaves(list) {
    return list.map((f, i) => ({ ...f, col: FALL_COL[i % FALL_COL.length], ph: rnd() * TAU, sz: 26 + rnd() * 10, spin: (rnd() < .5 ? -1 : 1) * (1.5 + rnd()) }));
  }
  function leafAt(L, t) {
    const k = (t - L.t0) / L.dur;
    if (k < 0) return null;
    if (k < 1) { const e = io(k * .9 + .1 * k * k);
      return { x: L.x0 + (L.x1 - L.x0) * e + 90 * Math.sin(k * 7 + L.ph) * (1 - k * .6), y: -60 + (L.y1 + 60) * e, r: L.ph + L.spin * k * 3 + .6 * Math.sin(k * 7 + L.ph), flip: Math.cos(k * 11 + L.ph), z: 1 - k, landed: 0 }; }
    // on the paper: rests, then each gust nudges it a little further along
    const later = GUSTS.filter(g => g > L.t0 + L.dur).reduce((s, g) => s + io((t - g) / 3), 0);
    return { x: L.x1 + 60 * later, y: L.y1 + 14 * later, r: L.ph + L.spin * 3 + .3 * later, flip: Math.cos(11 + L.ph) > 0 ? 1 : -1, z: 0, landed: 1 };
  }
  function drawFalling(X, list, t) {
    for (const L of list) {
      const p = leafAt(L, t); if (!p) continue;
      const s = L.sz, f = Math.max(.25, Math.abs(p.flip));
      // its shadow: further from the leaf while it is still high in the air
      X.save(); X.translate(p.x + 10 + 70 * p.z, p.y + 14 + 90 * p.z); X.rotate(p.r); X.scale(f, 1);
      X.filter = `blur(${3 + 10 * p.z}px)`; X.globalAlpha = .22 * (1 - .5 * p.z); X.fillStyle = '#3a2a16';
      X.beginPath(); X.ellipse(0, 0, s, s * .42, 0, 0, TAU); X.fill(); X.restore();
      X.save(); X.translate(p.x, p.y); X.rotate(p.r); X.scale(f * (1 + .25 * p.z), 1 + .25 * p.z);
      const gr = X.createLinearGradient(-s, 0, s, 0); gr.addColorStop(0, p.flip > 0 ? L.col[0] : L.col[1]); gr.addColorStop(1, p.flip > 0 ? L.col[1] : L.col[0]);
      X.fillStyle = gr; X.beginPath(); X.moveTo(-s, 0); X.quadraticCurveTo(-s * .2, -s * .62, s, 0); X.quadraticCurveTo(-s * .2, s * .62, -s, 0); X.fill();
      X.strokeStyle = 'rgba(40,30,10,.35)'; X.lineWidth = 1.2; X.beginPath(); X.moveTo(-s * 1.25, 0); X.lineTo(s * .9, 0); X.stroke();
      for (let v = -1; v <= 1; v += 2) for (let j = 1; j < 4; j++) { X.beginPath(); X.moveTo(-s + j * s * .45, 0); X.lineTo(-s + j * s * .45 + s * .22, v * s * .25); X.stroke(); }
      X.restore();
    }
  }

  // the silk bookmark: a slow ripple runs down it and its tail lifts more when the breeze gusts
  function ribbon(X, t, x0, y0, ang, len, colour) {
    const N = 40, pts = [], b = breeze(t);
    for (let i = 0; i <= N; i++) {
      const s = i / N, amp = (8 + 10 * b) * s * s, bend = .5 * s * s;
      const a = ang + bend + (.1 + .12 * b) * s * Math.sin(t * .8), d = s * len;
      pts.push([x0 + Math.cos(a) * d - Math.sin(a) * amp * Math.sin(s * 9 - t * (1.7 + b)), y0 + Math.sin(a) * d + Math.cos(a) * amp * Math.sin(s * 9 - t * (1.7 + b))]);
    }
    const hw = 8, L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], n = Math.hypot(dx, dy) || 1;
      L.push([p[0] - dy / n * hw, p[1] + dx / n * hw]); R.push([p[0] + dy / n * hw, p[1] - dx / n * hw]); }
    X.save();
    X.filter = 'blur(5px)'; X.fillStyle = 'rgba(50,36,20,.22)'; X.beginPath(); L.forEach(([x, y], i) => i ? X.lineTo(x + 6, y + 8) : X.moveTo(x + 6, y + 8)); R.slice().reverse().forEach(([x, y]) => X.lineTo(x + 6, y + 8)); X.fill(); X.filter = 'none';
    const tail = pts[N], pre = pts[N - 2], ta = Math.atan2(tail[1] - pre[1], tail[0] - pre[0]);
    X.beginPath(); L.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y));
    X.lineTo(tail[0] - Math.cos(ta) * 10, tail[1] - Math.sin(ta) * 10);   // the swallow-tail notch
    R.slice().reverse().forEach(([x, y]) => X.lineTo(x, y)); X.closePath();
    const gr = X.createLinearGradient(x0, y0, tail[0], tail[1]); gr.addColorStop(0, colour[0]); gr.addColorStop(1, colour[1]); X.fillStyle = gr; X.fill();
    X.globalCompositeOperation = 'screen'; X.lineWidth = 2; X.strokeStyle = 'rgba(255,240,210,.35)'; X.beginPath();
    pts.forEach(([x, y], i) => { const k = .5 + .5 * Math.sin(i / N * 9 - t * 1.7); i ? X.lineTo(x, y - 2 * k) : X.moveTo(x, y); }); X.stroke();
    X.restore();
  }

  // birds' shadows: one, or a small flock, each with its own wingbeat
  function birdShape(g, x, y, sc, flap) {
    g.save(); g.translate(x, y); g.scale(sc, sc);
    const up = 10 + 22 * flap, mid = 6 - 6 * flap;
    g.beginPath(); g.moveTo(0, 4);
    g.quadraticCurveTo(-16, -up * .9 - 6, -46, -up * .4 + mid); g.quadraticCurveTo(-20, -up * .5 + 2, -3, 9);
    g.quadraticCurveTo(0, 12, 3, 9); g.quadraticCurveTo(20, -up * .5 + 2, 46, -up * .4 + mid); g.quadraticCurveTo(16, -up * .9 - 6, 0, 4);
    g.closePath(); g.fill(); g.restore();
  }
  function birds(X, t, t0, dur, y, dir = 1, n = 1) {
    const k0 = (t - t0) / dur; if (k0 < -.1 || k0 > 1.3) return;
    const g = BIRD.getContext('2d'); g.clearRect(0, 0, W, H); g.fillStyle = '#000';
    for (let i = 0; i < n; i++) {
      const k = k0 - i * .06, ox = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 70; if (k < 0 || k > 1) continue;
      const x = (dir > 0 ? -200 + (W + 400) * k : W + 200 - (W + 400) * k), yy = y + ox - 60 * Math.sin(k * Math.PI) + 10 * Math.sin(t * 1.3 + i);
      const flap = (k + i * .13) % .4 < .25 ? Math.sin(t * (12 + i) + i * 1.7) : .25;
      birdShape(g, x, yy, 1.6 - .15 * i, flap);
    }
    X.save(); X.globalCompositeOperation = 'multiply'; X.filter = 'blur(4px) opacity(.17)'; X.drawImage(BIRD, 0, 0); X.restore();
  }

  // glints on gold: small four-point stars that bloom and fade at points of gold tooling (pts are canvas-space)
  function glints(X, t, pts, k = 1, every = .7) {
    if (!pts.length || k <= 0) return;
    const n = Math.floor(t / every);
    for (let j = n - 2; j <= n; j++) {
      seedAt(j); const p = pts[Math.floor(hash() * pts.length)], life = (t - j * every) / 1.6; if (life < 0 || life > 1) continue;
      const a = Math.sin(Math.PI * life) * k, r = 7 + 9 * Math.sin(Math.PI * life);
      X.save(); X.translate(p[0], p[1]); X.rotate(.3 + life * .6); X.globalAlpha = a; X.globalCompositeOperation = 'screen';
      const gr = X.createRadialGradient(0, 0, 0, 0, 0, r * 1.3); gr.addColorStop(0, 'rgba(255,248,220,.9)'); gr.addColorStop(1, 'rgba(255,230,170,0)');
      X.fillStyle = gr; X.beginPath(); X.arc(0, 0, r * 1.3, 0, TAU); X.fill();
      X.fillStyle = '#fffaf0'; X.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .12 : r; X.lineTo(Math.cos(i * Math.PI / 4) * rr, Math.sin(i * Math.PI / 4) * rr); } X.fill();
      X.restore();
    }
  }
  let hs = 1; const seedAt = j => { hs = (j * 7919 + 104729) % 2147483647 || 1; }, hash = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
  // gold points of a canvas: where the mask is opaque, sampled sparsely
  function goldPoints(cv, step = 6) {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, out = [];
    for (let y = 0; y < cv.height; y += step) for (let x = 0; x < cv.width; x += step) if (d[(y * cv.width + x) * 4 + 3] > 200) out.push([x, y]);
    return out;
  }

  return { leaves, flicker, shade, clouds, motes, fallingLeaves, drawFalling, ribbon, birds, glints, goldPoints, breeze, gust };
}
