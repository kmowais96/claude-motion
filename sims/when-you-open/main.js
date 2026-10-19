// Samples for "When You Open the Qur'an": ?s=1 | 4 | 5 | 10
const q = new URLSearchParams(location.search);
const id = q.get('s') || '1';
const mod = await import(`./sample${id}.js`);
await document.fonts.ready;
await Promise.all(['italic 500 42px "Cormorant Garamond"', '500 60px "Cormorant Garamond"', '700 120px "Amiri"'].map(f => document.fonts.load(f, f.includes('Amiri') ? 'كفر' : 'Ab')));
const gl = document.getElementById('c'), ov = document.getElementById('o').getContext('2d'), hz = document.getElementById('h').getContext('2d');
const render = await mod.setup(gl, document.getElementById('s'));
window.DUR = mod.DUR;
window.render = t => { ov.clearRect(0, 0, 1920, 1080); hz.clearRect(0, 0, 1920, 1080); render(t, ov, hz); };
window.TEXTS = t => (mod.texts ? mod.texts(t) : []);
window.EV = mod.events ? mod.events() : [];
window.render(0);
window.READY = true;
