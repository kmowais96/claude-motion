// Life for the ivory scenes: a branch outside the window throwing soft swaying shadows, dust glinting in the beam,
// the silk bookmark stirring, and now and then a bird's shadow crossing the paper. All pure in time.
const TAU = Math.PI * 2, cl = x => Math.max(0, Math.min(1, x));

export function makeLife(W, H, rnd) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const LEAF = mk(), BIRD = mk();
  // the branch: one bough from the top-right corner with twigs, each twig carrying a few leaves
  const ax = W + 80, ay = -60, twigs = [];
  for (let i = 0; i < 9; i++) {
    const s = .18 + i * .09, bx = ax + (W - 700 - ax) * s, by = ay + (430 - ay) * s + 30 * Math.sin(s * 5);
    const side = i % 2 ? 1 : -1, a = Math.atan2(430 - ay, W - 700 - ax) + side * (.6 + rnd() * .4), len = 70 + rnd() * 70;
    const leaves = Array.from({ length: 3 + (rnd() * 3 | 0) }, (_, j) => ({ f: .35 + j * .2, side: j % 2 ? 1 : -1, l: 26 + rnd() * 16, ph: rnd() * TAU }));
    twigs.push({ bx, by, a, len, leaves, ph: rnd() * TAU });
  }
  function leaves(X, t, alpha) {
    const g = LEAF.getContext('2d'); g.clearRect(0, 0, W, H);
    const sway = .03 * Math.sin(t * .45) + .012 * Math.sin(t * 1.27 + 1);
    g.save(); g.translate(ax, ay); g.rotate(sway); g.translate(-ax, -ay);
    g.strokeStyle = g.fillStyle = '#000'; g.lineCap = 'round';
    g.lineWidth = 14; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(W - 300, 160, W - 700, 430); g.stroke();
    for (const w of twigs) {
      const a = w.a + .08 * Math.sin(t * .9 + w.ph), ex = w.bx + Math.cos(a) * w.len, ey = w.by + Math.sin(a) * w.len;
      g.lineWidth = 4; g.beginPath(); g.moveTo(w.bx, w.by); g.lineTo(ex, ey); g.stroke();
      for (const L of w.leaves) {
        const px = w.bx + (ex - w.bx) * L.f, py = w.by + (ey - w.by) * L.f, la = a + L.side * .9 + .25 * Math.sin(t * 1.6 + L.ph);
        g.save(); g.translate(px + Math.cos(la) * L.l * .55, py + Math.sin(la) * L.l * .55); g.rotate(la);
        g.beginPath(); g.ellipse(0, 0, L.l * .6, L.l * .24, 0, 0, TAU); g.fill(); g.restore();
      }
      g.save(); g.translate(ex, ey); g.rotate(a + .2 * Math.sin(t * 1.4 + w.ph)); g.beginPath(); g.ellipse(14, 0, 22, 9, 0, 0, TAU); g.fill(); g.restore();
    }
    g.restore();
    X.save(); X.globalAlpha = alpha; X.globalCompositeOperation = 'multiply'; X.filter = 'blur(9px) opacity(.16)'; X.drawImage(LEAF, 0, 0); X.restore();
  }
  // how much the leaves are shading the light right now, for a gentle flicker in the beam
  const flicker = t => .93 + .07 * Math.sin(t * .45 + .6) * Math.sin(t * 1.27 + 1);

  const MOTES = Array.from({ length: 110 }, () => ({ x: rnd() * W, y: rnd() * H, v: 5 + rnd() * 12, a: rnd() * TAU, s: 1 + rnd() * 2, w: .3 + rnd() * .6 }));
  function motes(X, t, bx0, k) {
    X.save();
    for (const m of MOTES) {
      const y = ((m.y - m.v * t) % (H + 80) + H + 80) % (H + 80) - 40, x = m.x + 30 * Math.sin(m.a + t * m.w * .5) + 6 * t * m.w;
      const c = bx0 + 440 * (y + 60) / (H + 120), hw = 200 + 120 * (y / H), on = cl(1.2 - Math.abs(x - c) / hw);
      if (on <= 0) continue;
      const tw = .5 + .5 * Math.sin(m.a * 3 + t * 2.1);   // each mote turns and catches the light
      X.globalAlpha = k * Math.min(1, on) * (.25 + .6 * tw);
      X.fillStyle = 'rgba(214,170,84,.45)'; X.beginPath(); X.arc(x, y, m.s * 2.4, 0, TAU); X.fill();
      X.fillStyle = '#b8862e'; X.beginPath(); X.arc(x, y, m.s * .8, 0, TAU); X.fill();
      X.fillStyle = '#fffdf4'; X.beginPath(); X.arc(x - .3, y - .3, m.s * .45, 0, TAU); X.fill();
    }
    X.restore();
  }

  // the silk bookmark: anchored under the book, lying out across the paper; a slow ripple runs down it and the tail lifts
  function ribbon(X, t, x0, y0, ang, len, colour) {
    const N = 40, pts = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, amp = 10 * s * s, bend = .5 * s * s;
      const a = ang + bend + .12 * s * Math.sin(t * .8), d = s * len;
      pts.push([x0 + Math.cos(a) * d - Math.sin(a) * amp * Math.sin(s * 9 - t * 1.7), y0 + Math.sin(a) * d + Math.cos(a) * amp * Math.sin(s * 9 - t * 1.7)]);
    }
    const hw = 8, L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], n = Math.hypot(dx, dy) || 1;
      L.push([p[0] - dy / n * hw, p[1] + dx / n * hw]); R.push([p[0] + dy / n * hw, p[1] - dx / n * hw]); }
    X.save();
    X.filter = 'blur(5px)'; X.fillStyle = 'rgba(50,36,20,.22)'; X.beginPath(); L.forEach(([x, y], i) => i ? X.lineTo(x + 6, y + 8) : X.moveTo(x + 6, y + 8)); R.reverse().forEach(([x, y]) => X.lineTo(x + 6, y + 8)); X.fill(); R.reverse(); X.filter = 'none';
    const tail = pts[N], pre = pts[N - 2], ta = Math.atan2(tail[1] - pre[1], tail[0] - pre[0]);
    X.beginPath(); L.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y));
    X.lineTo(tail[0] - Math.cos(ta) * 10, tail[1] - Math.sin(ta) * 10);   // the swallow-tail notch
    R.slice().reverse().forEach(([x, y]) => X.lineTo(x, y)); X.closePath();
    const gr = X.createLinearGradient(x0, y0, tail[0], tail[1]); gr.addColorStop(0, colour[0]); gr.addColorStop(1, colour[1]); X.fillStyle = gr; X.fill();
    // a sheen that slides along the silk with the ripple
    X.globalCompositeOperation = 'screen'; X.lineWidth = 2; X.strokeStyle = 'rgba(255,240,210,.35)'; X.beginPath();
    pts.forEach(([x, y], i) => { const k = .5 + .5 * Math.sin(i / N * 9 - t * 1.7); i ? X.lineTo(x, y - 2 * k) : X.moveTo(x, y); }); X.stroke();
    X.restore();
  }

  // a bird's shadow crossing the paper with a few wingbeats and a glide
  function bird(X, t, t0, dur, y, dir = 1) {
    const k = (t - t0) / dur; if (k < 0 || k > 1) return;
    const x = dir > 0 ? -200 + (W + 400) * k : W + 200 - (W + 400) * k, yy = y - 60 * Math.sin(k * Math.PI);
    const flap = k % .4 < .25 ? Math.sin(t * 13) : .25;
    const g = BIRD.getContext('2d'); g.clearRect(0, 0, W, H); g.save(); g.translate(x, yy); g.scale(dir * 1.6, 1.6); g.fillStyle = '#000';
    // the familiar silhouette: two arched wings meeting at a small body; the wingtips rise and fall with each beat
    const up = 10 + 22 * flap, mid = 6 - 6 * flap;
    g.beginPath(); g.moveTo(0, 4);
    g.quadraticCurveTo(-16, -up * .9 - 6, -46, -up * .4 + mid); g.quadraticCurveTo(-20, -up * .5 + 2, -3, 9);
    g.quadraticCurveTo(0, 12, 3, 9); g.quadraticCurveTo(20, -up * .5 + 2, 46, -up * .4 + mid); g.quadraticCurveTo(16, -up * .9 - 6, 0, 4);
    g.closePath(); g.fill(); g.restore();
    const a = Math.min(1, k * 8, (1 - k) * 8);
    X.save(); X.globalAlpha = a; X.globalCompositeOperation = 'multiply'; X.filter = 'blur(4px) opacity(.17)'; X.drawImage(BIRD, 0, 0); X.restore();
  }
  return { leaves, flicker, motes, ribbon, bird };
}
