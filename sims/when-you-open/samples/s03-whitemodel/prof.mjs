// timing probe: node prof.mjs "<query>" t...
import { openDemo, closeServer } from '/home/claude/lemo-opuscar/core/render/page.mjs';
const [q, ...ts] = process.argv.slice(2);
const t0 = Date.now();
const { browser, page } = await openDemo('/home/claude/claude-motion/sims/when-you-open/samples/s03-whitemodel', { q });
console.log('load', Date.now() - t0);
for (const t of ts) {
  const a = Date.now();
  const r = await page.evaluate(t => { const a = performance.now(); window.render(+t); const gl = document.querySelector('#stage canvas').getContext('webgl2'); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; }, t);
  console.log(t, 'render+sync', Math.round(r), 'total', Date.now() - a);
}
await browser.close(); closeServer();
