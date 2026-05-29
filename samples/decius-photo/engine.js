/* ===========================================================================
   engine.js — document model, layers, compositing, history, viewport, rulers
   =========================================================================== */
(function (PS) {
  'use strict';

  PS.doc  = { w: 1280, h: 800, layers: [], active: 0, sel: null };
  PS.view = { z: 0.67, px: 0, py: 0, min: 0.05, max: 16 };
  PS.fg = '#1f6feb'; PS.bg = '#ffffff';
  PS.hsv = { h: 0, s: 0, v: 0 };

  let UID = 1;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- layer factory ---------- */
  PS.mkLayer = function (name, opts) {
    opts = opts || {};
    const c = document.createElement('canvas');
    c.width = PS.doc.w; c.height = PS.doc.h;
    const tc = document.createElement('canvas');
    tc.width = 34; tc.height = 34;
    return {
      id: UID++, name: name,
      canvas: c, ctx: c.getContext('2d'),
      thumb: tc, thumbCtx: tc.getContext('2d'),
      visible: opts.visible !== false,
      opacity: opts.opacity == null ? 1 : opts.opacity,
      fill: 1, blend: opts.blend || 'source-over',
      locked: !!opts.locked, kind: opts.kind || 'pixel'
    };
  };

  PS.active = () => PS.doc.layers[PS.doc.active];

  /* ---------- compositing ---------- */
  PS.viewCanvas = null; PS.vctx = null;

  PS.initCanvas = function () {
    const doc = PS.doc;
    const v = document.createElement('canvas');
    v.width = doc.w; v.height = doc.h; v.id = 'ps-view'; v.className = 'ps-composite';
    PS.viewCanvas = v; PS.vctx = v.getContext('2d');
    const host = $('#ps-doc');
    host.style.width = doc.w + 'px';
    host.style.height = doc.h + 'px';
    host.insertBefore(v, $('#ps-marquee'));
  };

  PS.render = function () {
    const ctx = PS.vctx, doc = PS.doc;
    ctx.clearRect(0, 0, doc.w, doc.h);
    for (const l of doc.layers) {
      if (!l.visible || l.opacity <= 0) continue;
      ctx.globalAlpha = l.opacity * l.fill;
      ctx.globalCompositeOperation = l.blend;
      ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  PS.updateThumb = function (l) {
    const t = l.thumbCtx, doc = PS.doc;
    t.clearRect(0, 0, 34, 34);
    const s = Math.min(34 / doc.w, 34 / doc.h);
    const w = doc.w * s, h = doc.h * s;
    t.drawImage(l.canvas, (34 - w) / 2, (34 - h) / 2, w, h);
  };
  PS.updateAllThumbs = () => PS.doc.layers.forEach(PS.updateThumb);

  /* ---------- view transform ---------- */
  PS.applyView = function () {
    const d = $('#ps-doc');
    d.style.setProperty('--z', PS.view.z);
    d.style.setProperty('--px', PS.view.px + 'px');
    d.style.setProperty('--py', PS.view.py + 'px');
    d.classList.toggle('is-pixelated', PS.view.z >= 4);
    PS.drawRulers();
    PS.updateMarquee();
    if (PS.refreshZoomUI) PS.refreshZoomUI();
  };

  PS.stageRect = () => $('#ps-stage').getBoundingClientRect();

  PS.docOrigin = function () { // screen px of doc(0,0), relative to stage
    const r = PS.stageRect(), v = PS.view, d = PS.doc;
    const cx = r.width / 2 + v.px, cy = r.height / 2 + v.py;
    return { x: cx - d.w * v.z / 2, y: cy - d.h * v.z / 2 };
  };

  PS.screenToDoc = function (clientX, clientY) {
    const r = PS.stageRect(), o = PS.docOrigin(), v = PS.view;
    return { x: (clientX - r.left - o.x) / v.z, y: (clientY - r.top - o.y) / v.z };
  };

  PS.setZoom = function (z, clientX, clientY) {
    z = Math.max(PS.view.min, Math.min(PS.view.max, z));
    const r = PS.stageRect();
    if (clientX == null) { clientX = r.left + r.width / 2; clientY = r.top + r.height / 2; }
    const before = PS.screenToDoc(clientX, clientY);
    PS.view.z = z;
    const after = PS.screenToDoc(clientX, clientY);
    PS.view.px += (after.x - before.x) * z;
    PS.view.py += (after.y - before.y) * z;
    PS.applyView();
  };

  PS.fitToScreen = function () {
    const r = PS.stageRect();
    if (r.width < 8 || r.height < 8) { PS._needFit = true; return; } // layout not ready yet
    PS._needFit = false;
    const z = Math.min((r.width - 48) / PS.doc.w, (r.height - 48) / PS.doc.h);
    PS.view.z = Math.max(PS.view.min, Math.min(PS.view.max, z));
    PS.view.px = 0; PS.view.py = 0;
    PS.applyView();
  };

  /* ---------- rulers ---------- */
  PS.drawRulers = function () {
    const o = PS.docOrigin(), v = PS.view, r = PS.stageRect();
    const rh = $('#ps-ruler-h'), rv = $('#ps-ruler-v');
    if (!rh) return;
    const dpr = window.devicePixelRatio || 1;
    const css = getComputedStyle(document.body);
    const ink = css.getPropertyValue('--dcs-text-mute').trim() || '#767c8a';
    const line = css.getPropertyValue('--dcs-line-soft').trim() || '#3a3f4c';

    function setup(cv, w, h) {
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      c.font = '8px ' + (css.getPropertyValue('--dcs-font-mono') || 'monospace');
      c.fillStyle = ink; c.strokeStyle = line; c.lineWidth = 1;
      return c;
    }
    const stepFor = z => { const targets = [1,2,5,10,20,25,50,100,200,250,500,1000]; for (const t of targets) if (t * z >= 48) return t; return 1000; };
    const step = stepFor(v.z);

    const wEl = rh.parentElement.clientWidth, hEl = rv.parentElement.clientHeight;
    const ch = setup(rh, wEl, 18), cv = setup(rv, 18, hEl);
    // horizontal
    const startX = Math.floor((-o.x) / v.z / step) * step;
    for (let dx = startX; dx <= PS.doc.w + step; dx += step) {
      const sx = o.x + dx * v.z; if (sx < 0 || sx > wEl) continue;
      ch.beginPath(); ch.moveTo(sx + .5, 12); ch.lineTo(sx + .5, 18); ch.stroke();
      if (dx >= 0 && dx <= PS.doc.w) ch.fillText(dx, sx + 2, 9);
    }
    const startY = Math.floor((-o.y) / v.z / step) * step;
    for (let dy = startY; dy <= PS.doc.h + step; dy += step) {
      const sy = o.y + dy * v.z; if (sy < 0 || sy > hEl) continue;
      cv.beginPath(); cv.moveTo(12, sy + .5); cv.lineTo(18, sy + .5); cv.stroke();
      if (dy >= 0 && dy <= PS.doc.h) { cv.save(); cv.translate(8, sy + 2); cv.rotate(-Math.PI / 2); cv.fillText(dy, 0, 0); cv.restore(); }
    }
  };

  /* ---------- selection ---------- */
  PS.setSelection = function (rect) {
    if (rect && rect.w > 0 && rect.h > 0) {
      PS.doc.sel = { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) };
    } else PS.doc.sel = null;
    PS.updateMarquee();
  };
  PS.updateMarquee = function () {
    const m = $('#ps-marquee'), sel = PS.doc.sel;
    if (!m) return;
    if (!sel) { m.classList.add('ps-hidden'); return; }
    const o = PS.docOrigin(), z = PS.view.z;
    m.classList.remove('ps-hidden');
    m.style.left = (o.x + sel.x * z) + 'px';
    m.style.top = (o.y + sel.y * z) + 'px';
    m.style.width = (sel.w * z) + 'px';
    m.style.height = (sel.h * z) + 'px';
  };
  PS.clipToSel = function (ctx, fn) {
    const sel = PS.doc.sel;
    if (!sel) return fn();
    ctx.save(); ctx.beginPath(); ctx.rect(sel.x, sel.y, sel.w, sel.h); ctx.clip(); fn(); ctx.restore();
  };

  /* ---------- layer ops ---------- */
  PS.addLayer = function (name, opts, atTop) {
    const l = PS.mkLayer(name || ('Layer ' + (PS.doc.layers.length)), opts);
    const idx = (atTop === false) ? 0 : PS.doc.layers.length;
    PS.doc.layers.splice(idx, 0, l);
    PS.doc.active = idx;
    PS.updateThumb(l); PS.render(); PS.refreshLayers && PS.refreshLayers();
    return l;
  };
  PS.deleteLayer = function () {
    if (PS.doc.layers.length <= 1) return;
    PS.doc.layers.splice(PS.doc.active, 1);
    PS.doc.active = Math.max(0, PS.doc.active - 1);
    PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Delete Layer', 'trash');
  };
  PS.duplicateLayer = function () {
    const src = PS.active();
    const l = PS.mkLayer(src.name + ' copy', { visible: src.visible, opacity: src.opacity, blend: src.blend });
    l.ctx.drawImage(src.canvas, 0, 0);
    PS.doc.layers.splice(PS.doc.active + 1, 0, l);
    PS.doc.active++;
    PS.updateThumb(l); PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Duplicate Layer', 'duplicate');
  };
  PS.moveActive = function (dir) {
    const i = PS.doc.active, j = i + dir;
    if (j < 0 || j >= PS.doc.layers.length) return;
    const a = PS.doc.layers;
    [a[i], a[j]] = [a[j], a[i]];
    PS.doc.active = j;
    PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Reorder Layer', 'layers');
  };
  PS.mergeDown = function () {
    const i = PS.doc.active; if (i <= 0) return;
    const top = PS.doc.layers[i], bot = PS.doc.layers[i - 1];
    bot.ctx.globalAlpha = top.opacity * top.fill; bot.ctx.globalCompositeOperation = top.blend;
    bot.ctx.drawImage(top.canvas, 0, 0);
    bot.ctx.globalAlpha = 1; bot.ctx.globalCompositeOperation = 'source-over';
    PS.doc.layers.splice(i, 1); PS.doc.active = i - 1;
    PS.updateThumb(bot); PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Merge Down', 'compress');
  };
  PS.flatten = function () {
    const flat = PS.mkLayer('Background', {});
    flat.ctx.fillStyle = '#ffffff'; flat.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h);
    PS.render(); flat.ctx.drawImage(PS.viewCanvas, 0, 0);
    PS.doc.layers = [flat]; PS.doc.active = 0;
    PS.updateThumb(flat); PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Flatten Image', 'layers');
  };

  /* ---------- history (dataURL snapshots) ---------- */
  PS.history = { list: [], index: -1, max: 40, sourceIndex: 0 };

  PS.snapshot = function (name, icon) {
    const h = PS.history;
    const rec = {
      name: name, icon: icon || 'edit', active: PS.doc.active,
      layers: PS.doc.layers.map(l => ({
        id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, fill: l.fill,
        blend: l.blend, locked: l.locked, kind: l.kind, data: l.canvas.toDataURL()
      }))
    };
    if (h.index < h.list.length - 1) h.list = h.list.slice(0, h.index + 1);
    h.list.push(rec);
    if (h.list.length > h.max) { h.list.shift(); if (h.sourceIndex > 0) h.sourceIndex--; }
    h.index = h.list.length - 1;
    PS.refreshHistory && PS.refreshHistory();
    PS.markDirty && PS.markDirty();
  };

  PS.restoreState = function (rec, done) {
    const layers = [];
    let pending = rec.layers.length;
    if (!pending) { finish(); return; }
    rec.layers.forEach((ld, i) => {
      const l = PS.mkLayer(ld.name, { visible: ld.visible, opacity: ld.opacity, blend: ld.blend, locked: ld.locked });
      l.id = ld.id; l.fill = ld.fill == null ? 1 : ld.fill; l.kind = ld.kind || 'pixel';
      layers[i] = l;
      const img = new Image();
      img.onload = () => { l.ctx.drawImage(img, 0, 0); PS.updateThumb(l); if (--pending === 0) finish(); };
      img.onerror = () => { if (--pending === 0) finish(); };
      img.src = ld.data;
    });
    function finish() {
      PS.doc.layers = layers; PS.doc.active = Math.min(rec.active, layers.length - 1);
      PS.render(); PS.refreshLayers && PS.refreshLayers(); done && done();
    }
  };

  PS.jumpTo = function (i) {
    const h = PS.history;
    if (i < 0 || i >= h.list.length) return;
    h.index = i;
    PS.restoreState(h.list[i], () => { PS.refreshHistory && PS.refreshHistory(); });
  };
  PS.undo = function () { if (PS.history.index > 0) PS.jumpTo(PS.history.index - 1); };
  PS.redo = function () { if (PS.history.index < PS.history.list.length - 1) PS.jumpTo(PS.history.index + 1); };

  /* history-brush source: imageData of active layer at sourceIndex (from its dataURL) */
  PS.historySourceFor = function (layer, cb) {
    const h = PS.history, rec = h.list[h.sourceIndex];
    const ld = rec && rec.layers.find(x => x.id === layer.id);
    if (!ld) { cb(null); return; }
    const img = new Image();
    img.onload = () => cb(img); img.onerror = () => cb(null); img.src = ld.data;
  };

  /* ---------- sample artwork ---------- */
  PS.generateSampleScene = function () {
    const W = PS.doc.w, H = PS.doc.h;
    PS.doc.layers = [];

    // Background sky
    const bg = PS.mkLayer('Background', { locked: true });
    let g = bg.ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1437'); g.addColorStop(0.45, '#1d2b66');
    g.addColorStop(0.72, '#6a4a86'); g.addColorStop(0.88, '#d98a5a'); g.addColorStop(1, '#f2c277');
    bg.ctx.fillStyle = g; bg.ctx.fillRect(0, 0, W, H);
    // stars
    bg.ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 90; i++) { const x = Math.random() * W, y = Math.random() * H * 0.5; const r = Math.random() * 1.2; bg.ctx.globalAlpha = Math.random() * .8 + .2; bg.ctx.beginPath(); bg.ctx.arc(x, y, r, 0, 7); bg.ctx.fill(); }
    bg.ctx.globalAlpha = 1;

    // Sun glow
    const sun = PS.mkLayer('Sun', { blend: 'screen' });
    const cx = W * 0.5, cy = H * 0.62;
    const rg = sun.ctx.createRadialGradient(cx, cy, 8, cx, cy, 260);
    rg.addColorStop(0, 'rgba(255,240,200,1)'); rg.addColorStop(0.25, 'rgba(255,190,120,.85)');
    rg.addColorStop(0.6, 'rgba(255,140,90,.35)'); rg.addColorStop(1, 'rgba(255,120,80,0)');
    sun.ctx.fillStyle = rg; sun.ctx.fillRect(0, 0, W, H);
    sun.ctx.fillStyle = 'rgba(255,250,235,1)'; sun.ctx.beginPath(); sun.ctx.arc(cx, cy, 70, 0, 7); sun.ctx.fill();

    // Mountains (far)
    const far = PS.mkLayer('Mountains · Far', { opacity: 0.85 });
    far.ctx.fillStyle = '#34305a';
    ridge(far.ctx, H * 0.66, 7, 90, '#34305a');
    // Mountains (near)
    const near = PS.mkLayer('Mountains · Near', {});
    ridge(near.ctx, H * 0.76, 5, 150, '#1a1730');

    // Water + reflection band
    const water = PS.mkLayer('Water', { blend: 'overlay', opacity: 0.55 });
    let wg = water.ctx.createLinearGradient(0, H * 0.82, 0, H);
    wg.addColorStop(0, 'rgba(255,200,150,.55)'); wg.addColorStop(1, 'rgba(60,40,90,.2)');
    water.ctx.fillStyle = wg; water.ctx.fillRect(0, H * 0.82, W, H * 0.18);

    // Title text layer
    const title = PS.mkLayer('“DECIUS”', { kind: 'text' });
    title.ctx.fillStyle = 'rgba(255,255,255,.96)';
    title.ctx.font = '700 120px "IBM Plex Sans", sans-serif';
    title.ctx.textBaseline = 'top';
    title.ctx.shadowColor = 'rgba(0,0,0,.35)'; title.ctx.shadowBlur = 18; title.ctx.shadowOffsetY = 6;
    title.ctx.fillText('DECIUS', 64, 70);
    title.ctx.shadowColor = 'transparent';
    title.ctx.font = '500 30px "JetBrains Mono", monospace';
    title.ctx.fillStyle = 'rgba(255,255,255,.7)';
    title.ctx.fillText('a decius.css showcase', 70, 210);

    // empty paint layer on top (active)
    const paint = PS.mkLayer('Paint', {});

    PS.doc.layers = [bg, sun, far, near, water, title, paint];
    PS.doc.active = PS.doc.layers.length - 1;
    PS.updateAllThumbs();
    PS.render();

    function ridge(ctx, baseY, jag, count, color) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
      ctx.lineTo(0, baseY);
      let x = 0; const seg = W / count;
      for (let i = 0; i <= count; i++) {
        const y = baseY - Math.abs(Math.sin(i * 0.7 + 1) ) * (40 + (i % 3) * 26) - Math.random() * jag * 4;
        ctx.lineTo(x, y); x += seg;
      }
      ctx.lineTo(W, baseY); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
  };

})(window.PS);
