/* ===========================================================================
   ui.js — build & wire all UI; boot the app
   =========================================================================== */
(function (PS) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const D = () => window.decius;

  PS.toast = (msg, variant) => D() && D().toast({ message: msg, variant: variant || 'info', timeout: 2600 });

  /* ---------------- color math ---------------- */
  function hsvToRgb(h, s, v) {
    h /= 360; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    let r, g, b; switch (i % 6) { case 0: r = v, g = t, b = p; break; case 1: r = q, g = v, b = p; break; case 2: r = p, g = v, b = t; break; case 3: r = p, g = q, b = v; break; case 4: r = t, g = p, b = v; break; default: r = v, g = p, b = q; }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return { h, s: mx ? d / mx : 0, v: mx };
  }
  const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');

  /* ---------------- foreground/background ---------------- */
  PS.setForeground = function (hex, fromPicker) {
    PS.fg = hex; $('#ps-chip-fg').style.background = hex;
    const c = PS.hexToRgb(hex);
    if (!fromPicker) PS.hsv = rgbToHsv(c.r, c.g, c.b);
    syncColorPanel();
  };
  PS.setBackground = hex => { PS.bg = hex; $('#ps-chip-bg').style.background = hex; };

  function syncColorPanel() {
    const c = PS.hexToRgb(PS.fg);
    $('#ps-hex').value = PS.fg.toUpperCase();
    $('#ps-r').value = c.r; $('#ps-g').value = c.g; $('#ps-b').value = c.b;
    const hueHex = (() => { const o = hsvToRgb(PS.hsv.h, 1, 1); return toHex(o.r, o.g, o.b); })();
    const sv = $('#ps-sv'); sv.style.setProperty('--hue', hueHex);
    $('#ps-sv-dot').style.left = (PS.hsv.s * 100) + '%';
    $('#ps-sv-dot').style.top = ((1 - PS.hsv.v) * 100) + '%';
    $('#ps-hue-dot').style.left = (PS.hsv.h / 360 * 100) + '%';
  }

  function initPicker() {
    const sv = $('#ps-sv'), hue = $('#ps-hue');
    const fromSV = e => { const r = sv.getBoundingClientRect(); PS.hsv.s = clamp01((e.clientX - r.left) / r.width); PS.hsv.v = clamp01(1 - (e.clientY - r.top) / r.height); commitHSV(); };
    const fromHue = e => { const r = hue.getBoundingClientRect(); PS.hsv.h = clamp01((e.clientX - r.left) / r.width) * 360; commitHSV(); };
    drag(sv, fromSV); drag(hue, fromHue);
    ['ps-r', 'ps-g', 'ps-b'].forEach(id => $('#' + id).addEventListener('change', () => {
      const r = +$('#ps-r').value, g = +$('#ps-g').value, b = +$('#ps-b').value; PS.hsv = rgbToHsv(r, g, b); PS.setForeground(toHex(r, g, b), true);
    }));
    $('#ps-hex').addEventListener('change', e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) PS.setForeground(v); });
    function commitHSV() { const o = hsvToRgb(PS.hsv.h, PS.hsv.s, PS.hsv.v); PS.setForeground(toHex(o.r, o.g, o.b), true); }
  }
  const clamp01 = v => Math.max(0, Math.min(1, v));
  function drag(el, fn) { el.addEventListener('pointerdown', e => { e.preventDefault(); fn(e); const mv = ev => fn(ev); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); }); }

  /* ---------------- tools ---------------- */
  PS.tool = PS.TOOLS[0];
  function buildTools() {
    const host = $('#ps-tools'); host.innerHTML = '';
    PS.TOOLS.forEach(t => {
      if (t.sep) { const s = document.createElement('div'); s.className = 'ps-toolsep'; host.appendChild(s); return; }
      const b = document.createElement('div');
      b.className = 'ps-tool'; b.dataset.tool = t.id; if (t.group) b.dataset.group = '1';
      b.setAttribute('aria-pressed', 'false');
      b.title = t.name + '  (' + t.key + ')';
      b.innerHTML = t.svg ? PS.SVG[t.svg] : `<i class="di di-${t.icon}"></i>`;
      b.addEventListener('click', () => PS.selectTool(t.id));
      host.appendChild(b);
    });
  }

  PS.selectTool = function (id) {
    const t = PS.toolById(id); if (!t) return;
    PS.tool = t;
    $$('.ps-tool').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === id)));
    // options bar
    $('#ps-opt-glyph').innerHTML = t.svg ? PS.SVG[t.svg] : `<i class="di di-${t.icon}"></i>`;
    $('#ps-opt-name').textContent = t.name;
    const slot = $('#ps-opt-slot');
    slot.innerHTML = PS.OPTIONS[id] ? PS.OPTIONS[id]() : '';
    D() && D().init(slot);
    wireOptionSlot(slot);
    $('#ps-stage').style.cursor = (t.cursor || 'crosshair');
    $('#ps-st-tip').textContent = t.tip || '';
    if (id !== 'pen') PS.clearPen && PS.clearPen();
  };

  function wireOptionSlot(slot) {
    // size slider <-> number field
    const sl = slot.querySelector('#ps-o-size'), nf = slot.querySelector('#ps-o-size-n');
    if (sl && nf) {
      sl.addEventListener('input', e => { nf.value = Math.round(e.detail.value); });
      nf.addEventListener('change', () => { const v = +nf.value; sl.setAttribute('data-value', v); PS.setSlider(sl, v); });
    }
  }

  /* set a decius slider's value visually + attr */
  PS.setSlider = function (el, v) {
    const min = +el.getAttribute('data-min') || 0, max = +el.getAttribute('data-max') || 100;
    const pct = (v - min) / (max - min) * 100;
    el.setAttribute('data-value', v);
    const fill = el.querySelector('.dcs-slider__fill'), thumb = el.querySelector('.dcs-slider__thumb');
    if (fill) fill.style.width = pct + '%'; if (thumb) thumb.style.left = pct + '%';
  };

  /* ---------------- swatches ---------------- */
  function buildSwatches() {
    const host = $('#ps-swatches'); host.innerHTML = '';
    PS.SWATCHES.forEach(c => {
      const s = document.createElement('div'); s.className = 'ps-swatch-chip'; s.style.background = c; s.title = c.toUpperCase();
      s.addEventListener('click', () => PS.setForeground(c));
      s.addEventListener('contextmenu', e => { e.preventDefault(); PS.setBackground(c); });
      host.appendChild(s);
    });
  }

  /* ---------------- adjustments grid ---------------- */
  function buildAdjust() {
    const host = $('#ps-adjust-grid'); host.innerHTML = '';
    PS.ADJUSTMENTS.forEach(([icon, label, key]) => {
      const b = document.createElement('button');
      b.className = 'dcs-btn dcs-btn--icon'; b.title = label; b.innerHTML = `<i class="di di-${icon}"></i>`;
      b.addEventListener('click', () => PS.adjust(key));
      host.appendChild(b);
    });
  }

  /* ---------------- layers panel ---------------- */
  // make thumbnails live-update during painting
  const _ut = PS.updateThumb;
  PS.updateThumb = function (l) { _ut(l); if (l.rowThumbCtx) { l.rowThumbCtx.clearRect(0, 0, 34, 34); l.rowThumbCtx.drawImage(l.thumb, 0, 0); } };

  PS.refreshLayers = function () {
    const list = $('#ps-layer-list'); list.innerHTML = '';
    // top layer first
    for (let i = PS.doc.layers.length - 1; i >= 0; i--) {
      const l = PS.doc.layers[i];
      const row = document.createElement('div');
      row.className = 'ps-layer' + (i === PS.doc.active ? ' is-active' : '');
      row.draggable = true; row.dataset.idx = i;

      const eye = document.createElement('span');
      eye.className = 'ps-layer-eye' + (l.visible ? '' : ' is-off');
      eye.innerHTML = `<i class="di di-${l.visible ? 'eye' : 'eye-off'}"></i>`;
      eye.addEventListener('click', e => { e.stopPropagation(); l.visible = !l.visible; PS.render(); PS.refreshLayers(); PS.snapshot((l.visible ? 'Show' : 'Hide') + ' Layer', 'eye'); });

      const th = document.createElement('canvas'); th.width = 34; th.height = 34; th.className = '';
      const wrap = document.createElement('div'); wrap.className = 'ps-layer-thumb'; wrap.appendChild(th);
      l.rowThumbCtx = th.getContext('2d'); l.rowThumbCtx.drawImage(l.thumb, 0, 0);

      const name = document.createElement('div'); name.className = 'ps-layer-name';
      name.textContent = l.name;
      name.addEventListener('dblclick', e => { e.stopPropagation(); editName(name, l); });

      const lock = document.createElement('span'); lock.className = 'ps-layer-lock';
      if (l.locked) lock.innerHTML = '<i class="di di-lock"></i>';

      row.append(eye, wrap, name, lock);
      row.addEventListener('click', () => { PS.doc.active = i; syncActiveControls(); PS.refreshLayers(); });
      wireRowDnD(row);
      list.appendChild(row);
    }
    syncActiveControls();
    PS.refreshDocMeta && PS.refreshDocMeta();
  };

  function editName(node, l) {
    const inp = document.createElement('input'); inp.value = l.name;
    node.textContent = ''; node.appendChild(inp); inp.focus(); inp.select();
    const done = () => { l.name = inp.value || l.name; PS.refreshLayers(); };
    inp.addEventListener('blur', done);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(); if (e.key === 'Escape') PS.refreshLayers(); });
  }

  function syncActiveControls() {
    const l = PS.active(); if (!l) return;
    const b = $('#ps-blend'); if (b) b.value = l.blend;
    const op = $('#ps-op-amt'); if (op) op.textContent = Math.round(l.opacity * 100) + '%';
    const fl = $('#ps-fill-amt'); if (fl) fl.textContent = Math.round(l.fill * 100) + '%';
    const la = $('.ps-lock-group [data-lock="all"]'); if (la) la.setAttribute('aria-pressed', String(!!l.locked));
  }

  let dndIdx = null;
  function wireRowDnD(row) {
    row.addEventListener('dragstart', e => { dndIdx = +row.dataset.idx; e.dataTransfer.effectAllowed = 'move'; });
    row.addEventListener('dragover', e => { e.preventDefault(); const r = row.getBoundingClientRect(); const below = (e.clientY - r.top) > r.height / 2; row.classList.toggle('is-drop-below', below); row.classList.toggle('is-drop-above', !below); });
    row.addEventListener('dragleave', () => row.classList.remove('is-drop-below', 'is-drop-above'));
    row.addEventListener('drop', e => {
      e.preventDefault(); row.classList.remove('is-drop-below', 'is-drop-above');
      const target = +row.dataset.idx; const r = row.getBoundingClientRect(); const below = (e.clientY - r.top) > r.height / 2;
      let dest = below ? target : target + 1; // list is reversed visually
      if (dndIdx == null || dndIdx === target) return;
      const a = PS.doc.layers; const [moved] = a.splice(dndIdx, 1);
      if (dndIdx < dest) dest--;
      a.splice(dest, 0, moved); PS.doc.active = dest;
      PS.render(); PS.refreshLayers(); PS.snapshot('Reorder Layers', 'layers');
    });
  }

  /* ---------------- history panel ---------------- */
  PS.refreshHistory = function () {
    const host = $('#ps-history-list'); if (!host) return; host.innerHTML = '';
    PS.history.list.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'ps-history-item' + (i === PS.history.index ? ' is-current' : (i > PS.history.index ? ' is-future' : ''));
      d.innerHTML = `<i class="di di-${s.icon}"></i><span>${s.name}</span>`;
      d.addEventListener('click', () => PS.jumpTo(i));
      host.appendChild(d);
    });
    host.scrollTop = host.scrollHeight;
  };

  /* ---------------- channels (static-ish) ---------------- */
  function buildChannels() {
    const host = $('#ps-channels'); if (!host) return;
    const rows = [['RGB', 'eq', '⌘2'], ['Red', 'eq', '⌘3'], ['Green', 'eq', '⌘4'], ['Blue', 'eq', '⌘5']];
    host.className = 'dcs-list'; host.setAttribute('data-dcs-select', '');
    host.innerHTML = rows.map((r, i) => `<div class="dcs-list__item" aria-selected="${i === 0}"><span class="dcs-tree__icon"><i class="di di-${r[1]}"></i></span><span class="ps-layer-name">${r[0]}</span><span class="dcs-tree__meta">${r[2]}</span></div>`).join('');
  }

  /* ---------------- doc meta / statusbar ---------------- */
  PS.refreshDocMeta = function () {
    $('#ps-ov-doc').textContent = PS.doc.w + ' × ' + PS.doc.h;
    const mb = (PS.doc.w * PS.doc.h * 4 / 1048576);
    $('#ps-st-doc').textContent = mb.toFixed(2) + 'M / ' + (mb * PS.doc.layers.length).toFixed(1) + 'M';
    updateTitle();
  };
  function updateTitle() { $('#ps-titlebar').textContent = 'Untitled-1 @ ' + Math.round(PS.view.z * 100) + '% (RGB/8)'; }
  PS.refreshZoomUI = function () {
    const pct = Math.round(PS.view.z * 100);
    const f = $('#ps-zoom-field'); if (f && document.activeElement !== f) f.value = pct + '%';
    updateTitle();
  };
  PS.updateCursorReadout = p => { $('#ps-ov-cursor').textContent = Math.round(p.x) + ', ' + Math.round(p.y) + ' px'; };
  PS.markDirty = () => {};

  /* ---------------- adjustments & filters (pixel ops) ---------------- */
  function region() { const s = PS.doc.sel; return s ? { x: Math.max(0, s.x), y: Math.max(0, s.y), w: Math.min(PS.doc.w - s.x, s.w), h: Math.min(PS.doc.h - s.y, s.h) } : { x: 0, y: 0, w: PS.doc.w, h: PS.doc.h }; }

  PS.runPixels = function (fn, name, icon) {
    const l = PS.active(), R = region();
    const img = l.ctx.getImageData(R.x, R.y, R.w, R.h); fn(img.data);
    l.ctx.putImageData(img, R.x, R.y);
    PS.render(); PS.updateThumb(l); if (name) PS.snapshot(name, icon || 'color-grade');
  };
  PS.runFilterCanvas = function (filterStr, name, icon) {
    const l = PS.active(), R = region();
    const tmp = document.createElement('canvas'); tmp.width = R.w; tmp.height = R.h;
    const tc = tmp.getContext('2d'); tc.filter = filterStr; tc.drawImage(l.canvas, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
    l.ctx.clearRect(R.x, R.y, R.w, R.h); l.ctx.drawImage(tmp, R.x, R.y);
    PS.render(); PS.updateThumb(l); if (name) PS.snapshot(name, icon || 'blur');
  };

  // modal builder with live sliders
  function adjustModal(title, controls, apply) {
    const l = PS.active();
    const R = region(); const base = l.ctx.getImageData(R.x, R.y, R.w, R.h);
    const id = 'ps-adj-modal';
    $('#' + id) && $('#' + id).remove();
    const rows = controls.map(c => `<div class="ps-prop" style="grid-template-columns:90px 1fr 48px;">
        <label>${c.label}</label>
        <div class="dcs-slider" data-k="${c.k}" data-dcs-slider data-min="${c.min}" data-max="${c.max}" data-value="${c.val}"></div>
        <span class="ps-prop-val" data-v="${c.k}">${c.val}</span></div>`).join('');
    const wrap = document.createElement('div');
    wrap.className = 'dcs-modal-backdrop'; wrap.id = id;
    wrap.innerHTML = `<div class="dcs-modal" style="width:380px;">
      <div class="dcs-modal__header"><i class="di di-color-grade"></i> ${title}<div class="dcs-spacer" style="flex:1"></div><button class="dcs-btn dcs-btn--icon dcs-btn--sm" data-dcs-dismiss="modal"><i class="di di-close"></i></button></div>
      <div class="dcs-modal__body">${rows}</div>
      <div class="dcs-modal__footer"><button class="dcs-btn" data-act="cancel">Cancel</button><button class="dcs-btn dcs-btn--primary" data-act="ok">OK</button></div></div>`;
    $('#ps-modals').appendChild(wrap);
    D() && D().init(wrap);
    const vals = {}; controls.forEach(c => vals[c.k] = c.val);
    const preview = () => {
      const img = new ImageData(new Uint8ClampedArray(base.data), R.w, R.h);
      apply(img.data, vals); l.ctx.putImageData(img, R.x, R.y); PS.render(); PS.updateThumb(l);
    };
    $$('.dcs-slider', wrap).forEach(s => s.addEventListener('input', e => { vals[s.dataset.k] = e.detail.value; wrap.querySelector(`[data-v="${s.dataset.k}"]`).textContent = Math.round(e.detail.value); preview(); }));
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => { l.ctx.putImageData(base, R.x, R.y); PS.render(); PS.updateThumb(l); D().modal.close('#' + id); wrap.remove(); });
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => { D().modal.close('#' + id); wrap.remove(); PS.snapshot(title, 'color-grade'); });
    preview();
    D() && D().modal.open('#' + id);
  }

  PS.adjust = function (key) {
    switch (key) {
      case 'bc': return adjustModal('Brightness / Contrast', [
        { k: 'b', label: 'Brightness', min: -100, max: 100, val: 0 }, { k: 'c', label: 'Contrast', min: -100, max: 100, val: 0 }
      ], (d, v) => { const c = (v.c / 100) + 1, b = v.b * 1.2; for (let i = 0; i < d.length; i += 4) { for (let j = 0; j < 3; j++) d[i + j] = (d[i + j] - 128) * c + 128 + b; } });
      case 'hsl': return adjustModal('Hue / Saturation', [
        { k: 'h', label: 'Hue', min: -180, max: 180, val: 0 }, { k: 's', label: 'Saturation', min: -100, max: 100, val: 0 }, { k: 'l', label: 'Lightness', min: -100, max: 100, val: 0 }
      ], (d, v) => hueSatOp(d, v));
      case 'levels': return adjustModal('Levels', [
        { k: 'lo', label: 'Black', min: 0, max: 254, val: 0 }, { k: 'hi', label: 'White', min: 1, max: 255, val: 255 }, { k: 'g', label: 'Gamma', min: 10, max: 300, val: 100 }
      ], (d, v) => { const lo = v.lo, hi = Math.max(v.lo + 1, v.hi), g = 100 / v.g; for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) { let t = (d[i + j] - lo) / (hi - lo); t = Math.pow(Math.max(0, Math.min(1, t)), g); d[i + j] = t * 255; } });
      case 'invert': return PS.runPixels(d => { for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } }, 'Invert', 'mirror');
      case 'desat': return PS.runPixels(d => { for (let i = 0; i < d.length; i += 4) { const y = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; d[i] = d[i + 1] = d[i + 2] = y; } }, 'Desaturate', 'mono');
      case 'threshold': return PS.runPixels(d => { for (let i = 0; i < d.length; i += 4) { const y = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; const t = y > 128 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = t; } }, 'Threshold', 'filter-lp');
      case 'vibrance': return adjustModal('Vibrance', [{ k: 's', label: 'Vibrance', min: -100, max: 100, val: 0 }], (d, v) => hueSatOp(d, { h: 0, s: v.s, l: 0 }));
      default: PS.toast('“' + key + '” — adjustment preview applied', 'info'); return adjustModal('Adjustment', [{ k: 'a', label: 'Amount', min: -100, max: 100, val: 0 }], (d, v) => { const b = v.a * 1.0; for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] += b; });
    }
  };
  function hueSatOp(d, v) {
    const dh = v.h, ds = v.s / 100, dl = v.l / 100;
    for (let i = 0; i < d.length; i += 4) {
      const hsv = rgbToHsv(d[i], d[i + 1], d[i + 2]);
      hsv.h = (hsv.h + dh + 360) % 360;
      hsv.s = Math.max(0, Math.min(1, hsv.s * (1 + ds)));
      hsv.v = Math.max(0, Math.min(1, hsv.v * (1 + dl)));
      const o = hsvToRgb(hsv.h, hsv.s, hsv.v); d[i] = o.r; d[i + 1] = o.g; d[i + 2] = o.b;
    }
  }

  PS.filter = function (key) {
    switch (key) {
      case 'fblur': return canvasFilterModal('Gaussian Blur', 'r', 0, 40, 4, r => `blur(${r}px)`);
      case 'fsharp': return PS.runFilterCanvas('contrast(1.4) saturate(1.1)', 'Sharpen', 'sharpen');
      case 'fnoise': return PS.runPixels(d => { for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 90; d[i] += n; d[i + 1] += n; d[i + 2] += n; } }, 'Add Noise', 'wave-noise');
      case 'fpix': return pixelate();
      case 'femboss': return PS.runFilterCanvas('grayscale(1) contrast(2)', 'Emboss', 'extrude');
      case 'ffind': return PS.runFilterCanvas('grayscale(1) invert(1) contrast(2.5)', 'Find Edges', 'cross-target');
    }
  };
  function canvasFilterModal(title, key, min, max, val, filterFn) {
    const l = PS.active(), R = region();
    const base = document.createElement('canvas'); base.width = R.w; base.height = R.h;
    base.getContext('2d').drawImage(l.canvas, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
    const id = 'ps-adj-modal'; $('#' + id) && $('#' + id).remove();
    const wrap = document.createElement('div'); wrap.className = 'dcs-modal-backdrop'; wrap.id = id;
    wrap.innerHTML = `<div class="dcs-modal" style="width:380px;">
      <div class="dcs-modal__header"><i class="di di-blur"></i> ${title}<div class="dcs-spacer" style="flex:1"></div><button class="dcs-btn dcs-btn--icon dcs-btn--sm" data-dcs-dismiss="modal"><i class="di di-close"></i></button></div>
      <div class="dcs-modal__body"><div class="ps-prop" style="grid-template-columns:90px 1fr 48px;">
        <label>Amount</label><div class="dcs-slider" data-dcs-slider data-min="${min}" data-max="${max}" data-value="${val}"></div>
        <span class="ps-prop-val" data-v>${val}</span></div></div>
      <div class="dcs-modal__footer"><button class="dcs-btn" data-act="cancel">Cancel</button><button class="dcs-btn dcs-btn--primary" data-act="ok">OK</button></div></div>`;
    $('#ps-modals').appendChild(wrap); D() && D().init(wrap);
    const preview = amt => {
      l.ctx.clearRect(R.x, R.y, R.w, R.h);
      const tmp = document.createElement('canvas'); tmp.width = R.w; tmp.height = R.h;
      const tc = tmp.getContext('2d'); tc.filter = filterFn(amt); tc.drawImage(base, 0, 0);
      l.ctx.drawImage(tmp, R.x, R.y); PS.render(); PS.updateThumb(l);
    };
    wrap.querySelector('.dcs-slider').addEventListener('input', e => { wrap.querySelector('[data-v]').textContent = Math.round(e.detail.value); preview(e.detail.value); });
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => { l.ctx.clearRect(R.x, R.y, R.w, R.h); l.ctx.drawImage(base, R.x, R.y); PS.render(); PS.updateThumb(l); D().modal.close('#' + id); wrap.remove(); });
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => { D().modal.close('#' + id); wrap.remove(); PS.snapshot(title, 'blur'); });
    preview(val); D() && D().modal.open('#' + id);
  }
  function pixelate() {
    const l = PS.active(), R = region(), block = 10;
    const tmp = document.createElement('canvas'); tmp.width = Math.ceil(R.w / block); tmp.height = Math.ceil(R.h / block);
    const tc = tmp.getContext('2d'); tc.imageSmoothingEnabled = false;
    tc.drawImage(l.canvas, R.x, R.y, R.w, R.h, 0, 0, tmp.width, tmp.height);
    l.ctx.imageSmoothingEnabled = false; l.ctx.clearRect(R.x, R.y, R.w, R.h);
    l.ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, R.x, R.y, R.w, R.h);
    l.ctx.imageSmoothingEnabled = true; PS.render(); PS.updateThumb(l); PS.snapshot('Pixelate', 'grid');
  }

  /* ---------------- menus ---------------- */
  function buildMenus() {
    const host = $('#ps-menus'); host.innerHTML = '';
    Object.entries(PS.MENUS).forEach(([id, items]) => {
      const m = document.createElement('div'); m.className = 'dcs-menu'; m.id = id; m.innerHTML = items.join('');
      m.addEventListener('dcs:select', e => PS.menuAction(e.detail.value));
      host.appendChild(m);
    });
  }

  PS.menuAction = function (v) {
    const A = {
      undo: PS.undo, redo: PS.redo,
      new: () => PS.dlgNewDoc(),
      open: () => { PS.generateSampleScene(); PS.history.list = []; PS.history.index = -1; PS.snapshot('Open', 'folder-open'); PS.fitToScreen(); PS.refreshLayers(); PS.toast('Opened sample document', 'ok'); },
      place: () => PS.dlgPlace(),
      save: () => PS.toast('Saved Untitled-1.psd', 'ok'),
      export: () => PS.dlgExportAs(),
      lnew: () => PS.dlgNewLayer(),
      ldup: PS.duplicateLayer, ldel: PS.deleteLayer, lup: () => PS.moveActive(1), ldown: () => PS.moveActive(-1), lmerge: PS.mergeDown,
      lgroup: () => PS.toast('Grouped layers', 'info'), lmask: () => PS.toast('Layer mask added', 'info'),
      flatten: PS.flatten,
      sall: () => PS.setSelection({ x: 0, y: 0, w: PS.doc.w, h: PS.doc.h }),
      sdesel: () => PS.setSelection(null), sinv: () => PS.toast('Selection inverted', 'info'),
      sfeather: () => PS.dlgFeather(),
      bc: () => PS.adjust('bc'), hsl: () => PS.adjust('hsl'), levels: () => PS.adjust('levels'), invert: () => PS.adjust('invert'), desat: () => PS.adjust('desat'),
      size: () => PS.dlgImageSize(), canvas: () => PS.dlgCanvasSize(),
      fill: () => PS.dlgFill(), stroke: () => PS.dlgStroke(),
      transform: () => PS.toast('Free Transform — drag handles (demo)', 'info'),
      vin: () => PS.setZoom(PS.view.z * 1.4), vout: () => PS.setZoom(PS.view.z / 1.4), vfit: PS.fitToScreen, v100: () => PS.setZoom(1),
      fblur: () => PS.filter('fblur'), fsharp: () => PS.filter('fsharp'), fnoise: () => PS.filter('fnoise'), fpix: () => PS.filter('fpix'), femboss: () => PS.filter('femboss'), ffind: () => PS.filter('ffind'),
      hkeys: () => PS.dlgShortcuts(),
      habout: () => aboutModal(), hframework: () => aboutModal(true),
    };
    if (A[v]) A[v](); else PS.toast(v, 'info');
  };

  function fillFg() { const l = PS.active(); l.ctx.save(); PS.clipToSel(l.ctx, () => { l.ctx.fillStyle = PS.fg; l.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); }); l.ctx.restore(); PS.render(); PS.updateThumb(l); PS.snapshot('Fill', 'fill'); }
  function exportPNG() { PS.render(); const a = document.createElement('a'); a.download = 'decius-photoeditor.png'; a.href = PS.viewCanvas.toDataURL('image/png'); a.click(); PS.toast('Exported PNG', 'ok'); }

  function aboutModal(fw) {
    const id = 'ps-about'; $('#' + id) && $('#' + id).remove();
    const w = document.createElement('div'); w.className = 'dcs-modal-backdrop'; w.id = id;
    w.innerHTML = `<div class="dcs-modal" style="width:440px;">
      <div class="dcs-modal__header"><i class="di di-decius"></i> ${fw ? 'About decius.css' : 'Decius PhotoEditor'}</div>
      <div class="dcs-modal__body">
        <p style="margin:0 0 10px;color:var(--dcs-text-dim);line-height:1.5;">${fw
          ? 'decius.css is a dark, dense, token-driven CSS framework for digital-content-creation tools, synths and pro desktop interfaces. This entire application — every panel, control, menu, toolbar and dialog — is built from decius components and tokens.'
          : 'A faithful image-editor UI showcase, hand-built on the <b>decius.css</b> framework. Painting, layers, history, color picker and adjustments are all live.'}</p>
        <div class="dcs-row" style="gap:8px;flex-wrap:wrap;">
          <span class="dcs-badge dcs-badge--accent">decius.css 0.5.3</span>
          <span class="dcs-badge dcs-badge--soft">IBM Plex Sans</span>
          <span class="dcs-badge dcs-badge--soft">225 icons</span>
          <span class="dcs-badge dcs-badge--ok">flat · comfortable</span>
        </div>
      </div>
      <div class="dcs-modal__footer"><button class="dcs-btn dcs-btn--primary" data-dcs-dismiss="modal">Close</button></div></div>`;
    $('#ps-modals').appendChild(w); D() && D().init(w); D() && D().modal.open('#' + id);
  }

  /* ---------------- top layer controls ---------------- */
  function wireLayerControls() {
    $('#ps-blend').addEventListener('change', e => { PS.active().blend = e.target.value; PS.render(); PS.snapshot('Blend: ' + e.target.options[e.target.selectedIndex].text, 'layers'); });
    // scrubby Opacity / Fill values (drag horizontally, Photoshop-style)
    wireScrub('#ps-op-amt', () => PS.active().opacity * 100, v => { PS.active().opacity = v / 100; PS.render(); });
    wireScrub('#ps-fill-amt', () => PS.active().fill * 100, v => { PS.active().fill = v / 100; PS.render(); });
    // lock toggles
    $$('.ps-lock-group [data-lock]').forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      if (b.dataset.lock === 'all') { PS.active().locked = on; PS.refreshLayers(); }
    }));
    $('#ps-l-new').addEventListener('click', () => { PS.addLayer('Layer ' + PS.doc.layers.length); PS.refreshLayers(); PS.snapshot('New Layer', 'plus'); });
    $('#ps-l-dup').addEventListener('click', PS.duplicateLayer);
    $('#ps-l-del').addEventListener('click', PS.deleteLayer);
    $('#ps-l-group').addEventListener('click', () => PS.toast('New group', 'info'));
    $('#ps-l-mask').addEventListener('click', () => PS.toast('Layer mask added', 'info'));
    $('#ps-l-adjust').addEventListener('click', () => PS.adjust('hsl'));
    $('#ps-l-fx').addEventListener('click', () => PS.toast('Layer style (fx) — Blending Options', 'info'));
    $('#ps-l-link').addEventListener('click', () => PS.toast('Linked', 'info'));
  }

  /* drag-to-scrub a value label (0–100) */
  function wireScrub(sel, get, set) {
    const el = $(sel); if (!el) return;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      const sx = e.clientX, sv = get(); let moved = false;
      const label = (sel.indexOf('fill') >= 0) ? 'Fill' : 'Opacity';
      const mv = ev => { if (Math.abs(ev.clientX - sx) > 1) moved = true; const v = Math.max(0, Math.min(100, sv + (ev.clientX - sx))); set(v); el.textContent = Math.round(v) + '%'; };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (moved) PS.snapshot(label, 'opacity'); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
  }

  /* ---------------- color chips ---------------- */
  // Clicking a FG/BG chip opens the #ps-color-picker popover anchored to
  // that chip. The popover is wired to a small "target" state — its
  // pointer drags / hex edits route through `setColorAtTarget` so the
  // SAME picker can edit either swatch. Decius `initPopover` does the
  // actual showing/hiding; we just track which chip last opened it.
  PS.cpTarget = 'fg';
  function wireChips() {
    // The chips themselves carry `data-dcs-toggle="popover"` (set in the
    // HTML) so Decius' initPopover already handles open/close + outside-
    // click dismissal. We just need a pointerdown listener that runs
    // BEFORE the click → popover-open, so the picker UI shows the right
    // chip's current color the moment the popover appears.
    const stage = (which) => {
      PS.cpTarget = which;
      const hex = which === 'fg' ? PS.fg : PS.bg;
      const c = PS.hexToRgb(hex);
      PS.cpHSV = rgbToHsv(c.r, c.g, c.b);
      syncColorPicker();
    };
    $('#ps-chip-fg').addEventListener('pointerdown', () => stage('fg'));
    $('#ps-chip-bg').addEventListener('pointerdown', () => stage('bg'));
    $('#ps-color-swap').addEventListener('click', () => { const t = PS.fg; PS.setForeground(PS.bg); PS.setBackground(t); });
    $('#ps-color-reset').addEventListener('click', () => { PS.setForeground('#000000'); PS.setBackground('#ffffff'); });
  }

  // setColorAtTarget routes a picker edit to whichever chip last opened the
  // popover. Without this dispatch, the picker would always overwrite FG
  // and the BG chip would be a read-only swatch.
  PS.setColorAtTarget = function (hex, fromPicker) {
    if (PS.cpTarget === 'bg') PS.setBackground(hex);
    else PS.setForeground(hex, fromPicker);
  };

  function syncColorPicker() {
    if (!$('#ps-cp-sv')) return;
    const hueHex = (() => { const o = hsvToRgb(PS.cpHSV.h, 1, 1); return toHex(o.r, o.g, o.b); })();
    $('#ps-cp-sv').style.setProperty('--hue', hueHex);
    $('#ps-cp-sv-dot').style.left = (PS.cpHSV.s * 100) + '%';
    $('#ps-cp-sv-dot').style.top = ((1 - PS.cpHSV.v) * 100) + '%';
    $('#ps-cp-hue-dot').style.left = (PS.cpHSV.h / 360 * 100) + '%';
    const c = hsvToRgb(PS.cpHSV.h, PS.cpHSV.s, PS.cpHSV.v);
    $('#ps-cp-hex').value = toHex(c.r, c.g, c.b).toUpperCase();
  }

  function initColorPickerPopover() {
    const sv = $('#ps-cp-sv'), hue = $('#ps-cp-hue');
    if (!sv || !hue) return;
    PS.cpHSV = { h: 0, s: 0, v: 0 };
    const commit = () => {
      const o = hsvToRgb(PS.cpHSV.h, PS.cpHSV.s, PS.cpHSV.v);
      PS.setColorAtTarget(toHex(o.r, o.g, o.b), true);
      syncColorPicker();
    };
    const fromSV = e => { const r = sv.getBoundingClientRect(); PS.cpHSV.s = clamp01((e.clientX - r.left) / r.width); PS.cpHSV.v = clamp01(1 - (e.clientY - r.top) / r.height); commit(); };
    const fromHue = e => { const r = hue.getBoundingClientRect(); PS.cpHSV.h = clamp01((e.clientX - r.left) / r.width) * 360; commit(); };
    drag(sv, fromSV); drag(hue, fromHue);
    $('#ps-cp-hex').addEventListener('change', e => {
      let v = e.target.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
        PS.setColorAtTarget(v);
        const c = PS.hexToRgb(v);
        PS.cpHSV = rgbToHsv(c.r, c.g, c.b);
        syncColorPicker();
      }
    });
  }

  /* ---------------- tweaks popover (mirrors Dender's wireAccent) ---- */
  // Wires `#ps-tweaks` so clicking accent dots / density buttons /
  // style buttons sets `data-dcs-accent`, `-density`, `-style` on the
  // body — same protocol as Dender, so every decius surface re-skins
  // live from the same handful of tokens. Uses Photo's `ps-`-prefixed
  // row IDs but is otherwise the same code path as Dender's app.js.
  function wireTweaks() {
    const body = document.body;
    const arow = $('#ps-accent-row');
    if (arow) {
      const mark = () => {
        const cur = body.getAttribute('data-dcs-accent') || 'blue';
        $$('[data-accent-set]', arow).forEach(d => d.setAttribute('aria-pressed', d.getAttribute('data-accent-set') === cur ? 'true' : 'false'));
      };
      arow.addEventListener('click', e => {
        const dot = e.target.closest('[data-accent-set]');
        if (!dot) return;
        body.setAttribute('data-dcs-accent', dot.getAttribute('data-accent-set'));
        mark();
      });
      mark();
    }
    const drow = $('#ps-density-row');
    if (drow) {
      const mark = () => {
        const cur = body.getAttribute('data-dcs-density') || 'comfortable';
        $$('[data-density-set]', drow).forEach(b => b.setAttribute('aria-pressed', b.getAttribute('data-density-set') === cur ? 'true' : 'false'));
      };
      drow.addEventListener('click', e => {
        const b = e.target.closest('[data-density-set]');
        if (!b) return;
        body.setAttribute('data-dcs-density', b.getAttribute('data-density-set'));
        mark();
      });
      mark();
    }
    const srow = $('#ps-style-row');
    if (srow) {
      const mark = () => {
        const cur = body.getAttribute('data-dcs-style') || 'flat';
        $$('[data-style-set]', srow).forEach(b => b.setAttribute('aria-pressed', b.getAttribute('data-style-set') === cur ? 'true' : 'false'));
      };
      srow.addEventListener('click', e => {
        const b = e.target.closest('[data-style-set]');
        if (!b) return;
        const s = b.getAttribute('data-style-set');
        if (s === 'flat') body.removeAttribute('data-dcs-style');
        else body.setAttribute('data-dcs-style', s);
        mark();
      });
      mark();
    }
  }

  /* ---------------- zoom controls ---------------- */
  function wireZoom() {
    $('#ps-zoom-field').addEventListener('change', e => { const v = parseFloat(e.target.value); if (!isNaN(v)) PS.setZoom(v / 100); });
    $('#ps-btn-reset-view').addEventListener('click', PS.fitToScreen);
  }

  /* ---------------- keyboard ---------------- */
  function wireKeys() {
    window.addEventListener('keydown', e => {
      if (e.target.matches('input,textarea,select')) return;
      const k = e.key.toLowerCase(), cmd = e.metaKey || e.ctrlKey;
      if (k === ' ') { PS.spaceDown = true; $('#ps-stage').classList.add('is-pan'); e.preventDefault(); return; }
      if (cmd && k === 'z') { e.preventDefault(); e.shiftKey ? PS.redo() : PS.undo(); return; }
      if (cmd && k === 'y') { e.preventDefault(); PS.redo(); return; }
      if (cmd && k === 'a') { e.preventDefault(); PS.setSelection({ x: 0, y: 0, w: PS.doc.w, h: PS.doc.h }); return; }
      if (cmd && k === 'd') { e.preventDefault(); PS.setSelection(null); return; }
      if (cmd && (k === '=' || k === '+')) { e.preventDefault(); PS.setZoom(PS.view.z * 1.4); return; }
      if (cmd && k === '-') { e.preventDefault(); PS.setZoom(PS.view.z / 1.4); return; }
      if (cmd && k === '0') { e.preventDefault(); PS.fitToScreen(); return; }
      if (cmd && k === '1') { e.preventDefault(); PS.setZoom(1); return; }
      if (cmd && k === 's') { e.preventDefault(); PS.toast('Saved Untitled-1.psd', 'ok'); return; }
      if (cmd) return;
      if (k === 'x') { const t = PS.fg; PS.setForeground(PS.bg); PS.setBackground(t); return; }
      if (k === 'd') { PS.setForeground('#000000'); PS.setBackground('#ffffff'); return; }
      if (k === '[') { PS.moveActive(-1); return; }
      if (k === ']') { PS.moveActive(1); return; }
      if ((k === 'delete' || k === 'backspace') && PS.doc.sel) { const l = PS.active(); l.ctx.clearRect(PS.doc.sel.x, PS.doc.sel.y, PS.doc.sel.w, PS.doc.sel.h); PS.render(); PS.updateThumb(l); PS.snapshot('Clear', 'delete'); return; }
      // tool shortcuts
      const t = PS.TOOLS.find(t => !t.sep && t.key.toLowerCase() === k);
      if (t) PS.selectTool(t.id);
    });
    window.addEventListener('keyup', e => { if (e.key === ' ') { PS.spaceDown = false; $('#ps-stage').classList.remove('is-pan'); } });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    buildMenus(); buildTools(); buildSwatches(); buildAdjust(); buildChannels();
    PS.initCanvas();
    PS.generateSampleScene();
    PS.setForeground('#1f6feb'); PS.setBackground('#ffffff');
    PS.selectTool('brush');
    initPicker();
    initColorPickerPopover();
    wireLayerControls(); wireChips(); wireZoom(); wireKeys(); wireTweaks();
    PS.initPointer();
    D() && D().init(document);
    PS.refreshLayers();
    PS.snapshot('Open', 'folder-open'); PS.history.sourceIndex = 0;
    // defer initial fit until the flex layout has resolved the stage size; retry until ready
    let tries = 0;
    (function tryFit() {
      PS.fitToScreen();
      if (PS._needFit && tries++ < 30) requestAnimationFrame(tryFit);
    })();
    PS.refreshDocMeta();
    window.addEventListener('resize', () => { if (PS._needFit) PS.fitToScreen(); PS.drawRulers(); PS.updateMarquee(); });
    PS.toast('Welcome to Decius PhotoEditor — built on decius.css', 'ok');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.PS);
