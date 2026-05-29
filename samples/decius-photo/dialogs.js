/* ===========================================================================
   dialogs.js — Photoshop-style dialog boxes, built from decius modal/form
   components and wired to the menus.
   =========================================================================== */
(function (PS) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const D = () => window.decius;

  /* ---- generic dialog builder -------------------------------------------
     opts = { title, icon, width, fields:[...], okLabel, onOk(values) }
     field types: section | static | text | number | select | slider | check
                | color (shows current foreground) | anchor (canvas anchor) | custom(html) */
  PS.dialog = function (opts) {
    const id = 'ps-dlg'; const old = $('#' + id); if (old) old.remove();
    const wrap = document.createElement('div'); wrap.className = 'dcs-modal-backdrop'; wrap.id = id;
    const body = opts.fields.map(f => fieldHTML(f)).join('');
    wrap.innerHTML = `<div class="dcs-modal" style="width:${opts.width || 380}px;">
      <div class="dcs-modal__header"><i class="di di-${opts.icon || 'cog'}"></i> ${opts.title}
        <div style="flex:1"></div>
        <button class="dcs-btn dcs-btn--icon dcs-btn--sm" data-dcs-dismiss="modal"><i class="di di-close"></i></button></div>
      <div class="dcs-modal__body"><div class="ps-dlg-body">${body}</div></div>
      <div class="dcs-modal__footer">
        <button class="dcs-btn" data-act="cancel">Cancel</button>
        <button class="dcs-btn dcs-btn--primary" data-act="ok">${opts.okLabel || 'OK'}</button></div></div>`;
    $('#ps-modals').appendChild(wrap);
    D() && D().init(wrap);
    // live W×H linking for image/canvas size
    if (opts.onField) opts.onField(wrap);
    const close = () => { D() && D().modal.close('#' + id); wrap.remove(); };
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', close);
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => {
      const v = readValues(wrap); close(); opts.onOk && opts.onOk(v);
    });
    D() && D().modal.open('#' + id);
    const first = wrap.querySelector('input,select'); if (first) setTimeout(() => first.focus(), 30);
    return wrap;
  };

  function fieldHTML(f) {
    if (f.type === 'section') return `<div class="ps-dlg-sec">${f.label}</div>`;
    if (f.type === 'static') return `<div class="ps-dlg-static">${f.html}</div>`;
    if (f.type === 'custom') return f.html;
    const ctrl = (() => {
      switch (f.type) {
        case 'text': return `<input class="dcs-input" data-k="${f.key}" value="${f.value || ''}" placeholder="${f.placeholder || ''}">`;
        case 'number': return `<input class="dcs-input dcs-input--num" data-k="${f.key}" data-num="1" value="${f.value}" style="text-align:left;">`;
        case 'select': return `<select class="dcs-select" data-k="${f.key}">${f.options.map(o => { const v = o.value ?? o, l = o.label ?? o; return `<option value="${v}"${String(v) === String(f.value) ? ' selected' : ''}>${l}</option>`; }).join('')}</select>`;
        case 'slider': return `<div class="ps-dlg-slider"><div class="dcs-slider" data-k="${f.key}" data-dcs-slider data-min="${f.min}" data-max="${f.max}" data-value="${f.value}"></div><span class="ps-prop-val" data-v="${f.key}">${f.value}${f.unit || ''}</span></div>`;
        case 'check': return `<label class="dcs-check" data-k="${f.key}" aria-checked="${f.value ? 'true' : 'false'}"><span class="dcs-check__box"></span> ${f.checkLabel || ''}</label>`;
        case 'color': return `<span class="dcs-colorfield dcs-colorfield--swatch" data-k="${f.key}" style="cursor:default;"><span class="dcs-colorfield__chip" style="background:${PS.fg};"></span><span class="dcs-colorfield__hex">${PS.fg.toUpperCase()}</span></span>`;
        default: return '';
      }
    })();
    if (f.type === 'check') return `<div class="ps-dlg-row"><label>${f.label || ''}</label>${ctrl}</div>`;
    return `<div class="ps-dlg-row"><label>${f.label}</label>${ctrl}</div>`;
  }

  function readValues(wrap) {
    const v = {};
    wrap.querySelectorAll('[data-k]').forEach(el => {
      const k = el.getAttribute('data-k');
      if (el.classList.contains('dcs-slider')) v[k] = parseFloat(el.getAttribute('data-value'));
      else if (el.classList.contains('dcs-check')) v[k] = el.getAttribute('aria-checked') === 'true';
      else if (el.classList.contains('dcs-colorfield')) v[k] = PS.fg;
      else if (el.tagName === 'SELECT') v[k] = el.value;
      else if (el.hasAttribute('data-num')) v[k] = parseFloat(el.value);
      else v[k] = el.value;
    });
    return v;
  }

  /* ---- canvas resize core (used by New / Image Size / Canvas Size) ------- */
  function resizeDoc(nw, nh, mode, anchor, bgFill) {
    nw = Math.max(1, Math.round(nw)); nh = Math.max(1, Math.round(nh));
    PS.doc.layers.forEach(l => {
      const c = document.createElement('canvas'); c.width = nw; c.height = nh; const cx = c.getContext('2d');
      if (mode === 'scale') cx.drawImage(l.canvas, 0, 0, nw, nh);
      else { // canvas resize: place by anchor
        const ax = anchorOffset(anchor)[0], ay = anchorOffset(anchor)[1];
        const dx = Math.round((nw - PS.doc.w) * ax), dy = Math.round((nh - PS.doc.h) * ay);
        cx.drawImage(l.canvas, dx, dy);
      }
      l.canvas.width = nw; l.canvas.height = nh; l.ctx = l.canvas.getContext('2d'); l.ctx.drawImage(c, 0, 0); PS.updateThumb(l);
    });
    if (bgFill && PS.doc.layers[0]) { const bg = PS.doc.layers[0]; bg.ctx.globalCompositeOperation = 'destination-over'; bg.ctx.fillStyle = bgFill; bg.ctx.fillRect(0, 0, nw, nh); bg.ctx.globalCompositeOperation = 'source-over'; PS.updateThumb(bg); }
    PS.doc.w = nw; PS.doc.h = nh;
    PS.viewCanvas.width = nw; PS.viewCanvas.height = nh;
    $('#ps-doc').style.width = nw + 'px'; $('#ps-doc').style.height = nh + 'px';
    PS.setSelection(null); PS.render(); PS.fitToScreen(); PS.refreshDocMeta && PS.refreshDocMeta();
  }
  function anchorOffset(a) { const map = { tl: [0, 0], tc: [.5, 0], tr: [1, 0], ml: [0, .5], mc: [.5, .5], mr: [1, .5], bl: [0, 1], bc: [.5, 1], br: [1, 1] }; return map[a || 'mc']; }

  /* ===================== specific dialogs ===================== */

  PS.dlgNewDoc = function () {
    const presets = { 'Custom': [1280, 800], 'Web 1920×1080': [1920, 1080], 'Square 2048': [2048, 2048], 'Postcard 1748×1240': [1748, 1240], 'Phone 1170×2532': [1170, 2532] };
    PS.dialog({
      title: 'New Document', icon: 'file', width: 420,
      fields: [
        { type: 'text', key: 'name', label: 'Name', value: 'Untitled-1' },
        { type: 'select', key: 'preset', label: 'Preset', value: 'Custom', options: Object.keys(presets) },
        { type: 'section', label: 'Size & resolution' },
        { type: 'number', key: 'w', label: 'Width (px)', value: 1280 },
        { type: 'number', key: 'h', label: 'Height (px)', value: 800 },
        { type: 'number', key: 'res', label: 'Resolution', value: 72 },
        { type: 'select', key: 'mode', label: 'Color Mode', value: 'RGB/8', options: ['RGB/8', 'RGB/16', 'Grayscale', 'CMYK/8'] },
        { type: 'select', key: 'bg', label: 'Background', value: 'White', options: ['White', 'Black', 'Transparent', 'Foreground'] },
      ],
      okLabel: 'Create',
      onField: wrap => {
        const sel = wrap.querySelector('[data-k="preset"]');
        sel.addEventListener('change', () => { const d = presets[sel.value]; if (d) { wrap.querySelector('[data-k="w"]').value = d[0]; wrap.querySelector('[data-k="h"]').value = d[1]; } });
      },
      onOk: v => {
        const bg = v.bg === 'Transparent' ? null : v.bg === 'Black' ? '#000000' : v.bg === 'Foreground' ? PS.fg : '#ffffff';
        // fresh document
        PS.doc.w = v.w; PS.doc.h = v.h;
        PS.viewCanvas.width = v.w; PS.viewCanvas.height = v.h;
        $('#ps-doc').style.width = v.w + 'px'; $('#ps-doc').style.height = v.h + 'px';
        const base = PS.mkLayer('Background', { locked: true });
        if (bg) { base.ctx.fillStyle = bg; base.ctx.fillRect(0, 0, v.w, v.h); }
        PS.doc.layers = [base]; PS.doc.active = 0;
        PS.updateThumb(base); PS.setSelection(null); PS.render(); PS.refreshLayers();
        PS.history.list = []; PS.history.index = -1; PS.snapshot('New Document', 'file'); PS.history.sourceIndex = 0;
        $('#ps-titlebar').textContent = (v.name || 'Untitled-1') + ' @ 100% (' + v.mode + ')';
        PS.fitToScreen(); PS.refreshDocMeta(); PS.toast('Created ' + v.w + ' × ' + v.h + ' document', 'ok');
      }
    });
  };

  PS.dlgImageSize = function () {
    PS.dialog({
      title: 'Image Size', icon: 'aspect', width: 400,
      fields: [
        { type: 'static', html: `Current: <b>${PS.doc.w} × ${PS.doc.h}px</b> · ${(PS.doc.w * PS.doc.h * 4 / 1048576).toFixed(2)}M` },
        { type: 'section', label: 'Dimensions' },
        { type: 'number', key: 'w', label: 'Width (px)', value: PS.doc.w },
        { type: 'number', key: 'h', label: 'Height (px)', value: PS.doc.h },
        { type: 'number', key: 'res', label: 'Resolution', value: 72 },
        { type: 'check', key: 'constrain', label: 'Constrain', checkLabel: 'Lock aspect ratio', value: true },
        { type: 'check', key: 'resample', label: 'Resample', checkLabel: 'Resample image', value: true },
      ],
      okLabel: 'Resize',
      onField: wrap => {
        const W = wrap.querySelector('[data-k="w"]'), H = wrap.querySelector('[data-k="h"]'), C = wrap.querySelector('[data-k="constrain"]');
        const ar = PS.doc.w / PS.doc.h;
        W.addEventListener('input', () => { if (C.getAttribute('aria-checked') === 'true') H.value = Math.round(W.value / ar); });
        H.addEventListener('input', () => { if (C.getAttribute('aria-checked') === 'true') W.value = Math.round(H.value * ar); });
      },
      onOk: v => { resizeDoc(v.w, v.h, 'scale'); PS.snapshot('Image Size', 'aspect'); PS.toast('Resized to ' + Math.round(v.w) + ' × ' + Math.round(v.h), 'ok'); }
    });
  };

  PS.dlgCanvasSize = function () {
    const anchors = [['tl', 'chevron-up'], ['tc', 'chevron-up'], ['tr', 'chevron-up'], ['ml', 'chevron-left'], ['mc', 'cross-target'], ['mr', 'chevron-right'], ['bl', 'chevron-down'], ['bc', 'chevron-down'], ['br', 'chevron-down']];
    const grid = `<div class="ps-dlg-row"><label>Anchor</label><div class="ps-anchor-grid" data-k="anchor" data-anchor="mc">${anchors.map(a => `<button class="dcs-btn dcs-btn--icon dcs-btn--sm${a[0] === 'mc' ? ' dcs-btn--primary' : ''}" data-a="${a[0]}"><i class="di di-${a[1]}"></i></button>`).join('')}</div></div>`;
    PS.dialog({
      title: 'Canvas Size', icon: 'fit', width: 400,
      fields: [
        { type: 'static', html: `Current: <b>${PS.doc.w} × ${PS.doc.h}px</b>` },
        { type: 'section', label: 'New size' },
        { type: 'number', key: 'w', label: 'Width (px)', value: PS.doc.w },
        { type: 'number', key: 'h', label: 'Height (px)', value: PS.doc.h },
        { type: 'custom', html: grid },
      ],
      okLabel: 'Resize',
      onField: wrap => {
        const g = wrap.querySelector('[data-k="anchor"]');
        g.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; g.querySelectorAll('button').forEach(x => x.classList.remove('dcs-btn--primary')); b.classList.add('dcs-btn--primary'); g.setAttribute('data-anchor', b.dataset.a); });
      },
      onOk: v => { const anchor = $('#ps-dlg [data-k="anchor"]') ? 'mc' : 'mc'; const a = (document.querySelector('.ps-anchor-grid') || {}).dataset; resizeDoc(v.w, v.h, 'canvas', (a && a.anchor) || 'mc'); PS.snapshot('Canvas Size', 'fit'); PS.toast('Canvas ' + Math.round(v.w) + ' × ' + Math.round(v.h), 'ok'); }
    });
  };

  PS.dlgNewLayer = function () {
    PS.dialog({
      title: 'New Layer', icon: 'plus', width: 380,
      fields: [
        { type: 'text', key: 'name', label: 'Name', value: 'Layer ' + PS.doc.layers.length },
        { type: 'select', key: 'blend', label: 'Mode', value: 'source-over', options: blendOptions() },
        { type: 'slider', key: 'opacity', label: 'Opacity', min: 0, max: 100, value: 100, unit: '%' },
      ],
      okLabel: 'Create',
      onOk: v => { const l = PS.addLayer(v.name, { blend: v.blend, opacity: v.opacity / 100 }); PS.refreshLayers(); PS.snapshot('New Layer', 'plus'); }
    });
  };

  PS.dlgFill = function () {
    PS.dialog({
      title: 'Fill', icon: 'fill', width: 380,
      fields: [
        { type: 'select', key: 'use', label: 'Contents', value: 'Foreground', options: ['Foreground', 'Background', 'Black', 'White', '50% Gray'] },
        { type: 'section', label: 'Blending' },
        { type: 'select', key: 'blend', label: 'Mode', value: 'source-over', options: blendOptions() },
        { type: 'slider', key: 'opacity', label: 'Opacity', min: 0, max: 100, value: 100, unit: '%' },
      ],
      okLabel: 'Fill',
      onOk: v => {
        const col = { 'Foreground': PS.fg, 'Background': PS.bg, 'Black': '#000000', 'White': '#ffffff', '50% Gray': '#808080' }[v.use];
        const l = PS.active(); l.ctx.save(); l.ctx.globalAlpha = v.opacity / 100; l.ctx.globalCompositeOperation = v.blend;
        PS.clipToSel(l.ctx, () => { l.ctx.fillStyle = col; l.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); });
        l.ctx.restore(); PS.render(); PS.updateThumb(l); PS.snapshot('Fill', 'fill');
      }
    });
  };

  PS.dlgStroke = function () {
    PS.dialog({
      title: 'Stroke', icon: 'edit', width: 380,
      fields: [
        { type: 'number', key: 'width', label: 'Width (px)', value: 4 },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'select', key: 'loc', label: 'Location', value: 'center', options: [{ value: 'inside', label: 'Inside' }, { value: 'center', label: 'Center' }, { value: 'outside', label: 'Outside' }] },
        { type: 'slider', key: 'opacity', label: 'Opacity', min: 0, max: 100, value: 100, unit: '%' },
      ],
      okLabel: 'Stroke',
      onOk: v => {
        const l = PS.active(), s = PS.doc.sel || { x: 1, y: 1, w: PS.doc.w - 2, h: PS.doc.h - 2 };
        let { x, y, w, h } = s; const off = v.loc === 'inside' ? v.width / 2 : v.loc === 'outside' ? -v.width / 2 : 0;
        x += off; y += off; w -= off * 2; h -= off * 2;
        l.ctx.save(); l.ctx.globalAlpha = v.opacity / 100; l.ctx.strokeStyle = PS.fg; l.ctx.lineWidth = v.width;
        l.ctx.strokeRect(x, y, w, h); l.ctx.restore();
        PS.render(); PS.updateThumb(l); PS.snapshot('Stroke', 'edit');
      }
    });
  };

  PS.dlgFeather = function () {
    PS.dialog({
      title: 'Feather Selection', icon: 'blur', width: 340,
      fields: [{ type: 'number', key: 'r', label: 'Radius (px)', value: 8 }],
      okLabel: 'OK',
      onOk: v => { PS.selFeather = v.r; PS.toast('Feather radius: ' + v.r + ' px', 'info'); }
    });
  };

  PS.dlgExportAs = function () {
    PS.dialog({
      title: 'Export As', icon: 'export', width: 400,
      fields: [
        { type: 'select', key: 'fmt', label: 'Format', value: 'PNG', options: ['PNG', 'JPG', 'WEBP'] },
        { type: 'slider', key: 'quality', label: 'Quality', min: 10, max: 100, value: 92, unit: '%' },
        { type: 'select', key: 'scale', label: 'Scale', value: '1', options: [{ value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '0.5', label: '0.5×' }] },
        { type: 'static', html: `Exports a flattened image of the document.` },
      ],
      okLabel: 'Export',
      onOk: v => {
        PS.render(); const scale = parseFloat(v.scale);
        const c = document.createElement('canvas'); c.width = PS.doc.w * scale; c.height = PS.doc.h * scale;
        const cx = c.getContext('2d'); if (v.fmt !== 'PNG') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
        cx.drawImage(PS.viewCanvas, 0, 0, c.width, c.height);
        const mime = v.fmt === 'JPG' ? 'image/jpeg' : v.fmt === 'WEBP' ? 'image/webp' : 'image/png';
        const a = document.createElement('a'); a.download = 'decius-photoeditor.' + v.fmt.toLowerCase();
        a.href = c.toDataURL(mime, v.quality / 100); a.click(); PS.toast('Exported ' + v.fmt, 'ok');
      }
    });
  };

  PS.dlgShortcuts = function () {
    const keys = [['V', 'Move'], ['M', 'Marquee'], ['L', 'Lasso'], ['B', 'Brush'], ['E', 'Eraser'], ['G', 'Bucket'], ['S', 'Clone'], ['I', 'Eyedropper'], ['Z', 'Zoom'], ['H', 'Hand'], ['⌘Z', 'Undo'], ['⇧⌘Z', 'Redo'], ['⌘A', 'Select All'], ['⌘D', 'Deselect'], ['⌘0', 'Fit on screen'], ['⌘1', '100%'], ['X', 'Swap colors'], ['D', 'Default colors'], ['[ / ]', 'Layer down / up'], ['⌫', 'Clear selection']];
    PS.dialog({
      title: 'Keyboard Shortcuts', icon: 'keys', width: 460,
      fields: [{ type: 'custom', html: `<div class="ps-kbd-list">${keys.map(k => `<div><span>${k[1]}</span><kbd class="dcs-kbd">${k[0]}</kbd></div>`).join('')}</div>` }],
      okLabel: 'Done'
    });
  };

  PS.dlgPlace = function () {
    PS.dialog({
      title: 'Place Embedded', icon: 'import', width: 380,
      fields: [
        { type: 'static', html: 'Place an embedded asset as a new layer.' },
        { type: 'select', key: 'asset', label: 'Asset', value: 'Sun flare', options: ['Sun flare', 'Gradient map', 'Noise texture', 'Vignette'] },
      ],
      okLabel: 'Place',
      onOk: v => {
        const l = PS.addLayer(v.asset, {});
        if (v.asset === 'Vignette') { const g = l.ctx.createRadialGradient(PS.doc.w / 2, PS.doc.h / 2, PS.doc.h * .3, PS.doc.w / 2, PS.doc.h / 2, PS.doc.h * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); l.ctx.fillStyle = g; l.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); l.blend = 'multiply'; }
        else if (v.asset === 'Noise texture') { const im = l.ctx.createImageData(PS.doc.w, PS.doc.h); for (let i = 0; i < im.data.length; i += 4) { const n = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 40; } l.ctx.putImageData(im, 0, 0); l.blend = 'overlay'; }
        else if (v.asset === 'Gradient map') { const g = l.ctx.createLinearGradient(0, 0, PS.doc.w, 0); g.addColorStop(0, '#1f6feb'); g.addColorStop(1, '#ff7ab8'); l.ctx.fillStyle = g; l.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); l.blend = 'soft-light'; l.opacity = .6; }
        else { const g = l.ctx.createRadialGradient(PS.doc.w * .7, PS.doc.h * .3, 8, PS.doc.w * .7, PS.doc.h * .3, 360); g.addColorStop(0, 'rgba(255,240,200,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)'); l.ctx.fillStyle = g; l.ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); l.blend = 'screen'; }
        PS.updateThumb(l); PS.render(); PS.refreshLayers(); PS.snapshot('Place ' + v.asset, 'import');
      }
    });
  };

  function blendOptions() {
    return [['source-over', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'], ['darken', 'Darken'], ['lighten', 'Lighten'], ['color-dodge', 'Color Dodge'], ['color-burn', 'Color Burn'], ['difference', 'Difference'], ['hue', 'Hue'], ['saturation', 'Saturation'], ['color', 'Color'], ['luminosity', 'Luminosity']].map(o => ({ value: o[0], label: o[1] }));
  }

})(window.PS);
