/* ===========================================================================
   paint.js — pointer interaction + per-tool drawing
   =========================================================================== */
(function (PS) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);

  /* ---- color helpers ---- */
  PS.hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };
  const rgba = (c, a) => { const o = PS.hexToRgb(c); return `rgba(${o.r},${o.g},${o.b},${a})`; };

  /* ---- read an option control's numeric / bool value ---- */
  PS.opt = function (id, dflt) {
    const el = document.getElementById(id);
    if (!el) return dflt;
    if (el.hasAttribute('data-value')) return parseFloat(el.getAttribute('data-value'));
    if (el.classList.contains('dcs-check')) return el.getAttribute('aria-checked') === 'true';
    if ('value' in el) { const v = parseFloat(el.value); return isNaN(v) ? el.value : v; }
    return dflt;
  };

  /* ---- soft round stamp ---- */
  function stamp(ctx, x, y, r, color, hardness, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (hardness >= 0.985) {
      ctx.fillStyle = color;
    } else {
      const g = ctx.createRadialGradient(x, y, Math.max(0.01, r * hardness), x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* paint state shared across a stroke */
  let S = null;

  function beginStroke(p) {
    const t = PS.tool, layer = PS.active();
    const r = Math.max(0.5, PS.opt('ps-o-size', 24) / 2);
    const hard = (t.id === 'pencil') ? 1 : PS.opt('ps-o-hard', 70) / 100;
    const op = PS.opt('ps-o-op', 100) / 100;
    const flow = PS.opt('ps-o-flow', 100) / 100;

    const base = document.createElement('canvas'); base.width = PS.doc.w; base.height = PS.doc.h;
    base.getContext('2d').drawImage(layer.canvas, 0, 0);

    const buf = document.createElement('canvas'); buf.width = PS.doc.w; buf.height = PS.doc.h;

    S = { tool: t.id, layer, r, hard, op, flow, base, buf, bctx: buf.getContext('2d'), last: p, srcImg: null, cloneOff: null };

    if (t.id === 'clone') {
      if (!PS.cloneSource) { PS.toast && PS.toast('Set a source first (Alt-click).', 'warn'); S = null; return false; }
      S.cloneOff = { dx: PS.cloneSource.x - p.x, dy: PS.cloneSource.y - p.y, layer: PS.cloneSource.layer };
    }
    if (t.id === 'history') {
      PS.historySourceFor(layer, img => { S && (S.srcImg = img); });
    }
    paintTo(p, true);
    return true;
  }

  function lineStamps(a, b, cb) {
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    const sp = Math.max(0.6, S.r * (S.tool === 'pencil' ? 0.5 : 0.16));
    const n = Math.max(1, Math.floor(dist / sp));
    for (let i = 1; i <= n; i++) cb(a.x + dx * (i / n), a.y + dy * (i / n));
    if (dist === 0) cb(a.x, a.y);
  }

  function paintTo(p, first) {
    if (!S) return;
    const from = first ? p : S.last;
    const t = S.tool;

    if (t === 'smudge' || t === 'blur') { directSmear(from, p, t); S.last = p; commitLive(); return; }

    lineStamps(from, p, (x, y) => {
      if (t === 'clone') {
        const sl = S.cloneOff.layer.canvas;
        S.bctx.save(); S.bctx.beginPath(); S.bctx.arc(x, y, S.r, 0, 7); S.bctx.clip();
        S.bctx.globalAlpha = S.flow;
        S.bctx.drawImage(sl, S.cloneOff.dx, S.cloneOff.dy);
        S.bctx.restore();
      } else if (t === 'history') {
        if (!S.srcImg) return;
        S.bctx.save(); S.bctx.beginPath(); S.bctx.arc(x, y, S.r, 0, 7); S.bctx.clip();
        S.bctx.globalAlpha = S.flow; S.bctx.drawImage(S.srcImg, 0, 0); S.bctx.restore();
      } else if (t === 'eraser') {
        stamp(S.bctx, x, y, S.r, '#000', S.hard, S.flow);
      } else if (t === 'dodge') {
        stamp(S.bctx, x, y, S.r, '#ffffff', S.hard, S.flow);
      } else if (t === 'burn') {
        stamp(S.bctx, x, y, S.r, '#000000', S.hard, S.flow);
      } else { // brush / pencil
        stamp(S.bctx, x, y, S.r, PS.fg, S.hard, S.flow);
      }
    });
    S.last = p;
    commitLive();
  }

  // recompose active layer = base (+/-) buffer, clipped to selection
  function commitLive() {
    const l = S.layer, ctx = l.ctx, t = S.tool;
    ctx.clearRect(0, 0, PS.doc.w, PS.doc.h);
    ctx.drawImage(S.base, 0, 0);
    PS.clipToSel(ctx, () => {
      ctx.save();
      ctx.globalAlpha = S.op;
      if (t === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      else if (t === 'dodge') ctx.globalCompositeOperation = 'screen';
      else if (t === 'burn') ctx.globalCompositeOperation = 'multiply';
      else ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(S.buf, 0, 0);
      ctx.restore();
    });
    PS.render(); PS.updateThumb(l);
  }

  function directSmear(a, b, kind) {
    const l = S.layer, ctx = l.ctx, r = S.r, strength = S.op;
    lineStamps(a, b, (x, y) => {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
      ctx.globalAlpha = kind === 'smudge' ? strength * 0.5 : strength * 0.6;
      if (kind === 'smudge') {
        const dx = x - a.x, dy = y - a.y;
        ctx.drawImage(l.canvas, -dx * 0.6, -dy * 0.6);
      } else { // blur: sample then redraw slightly offset blended (cheap blur)
        ctx.filter = 'blur(' + Math.max(1, r / 6) + 'px)';
        ctx.drawImage(S.base, 0, 0); ctx.filter = 'none';
      }
      ctx.restore();
    });
    PS.render(); PS.updateThumb(l);
  }

  function endStroke() {
    if (!S) return;
    const name = { brush: 'Brush', pencil: 'Pencil', eraser: 'Eraser', clone: 'Clone Stamp', history: 'History Brush', dodge: 'Dodge', burn: 'Burn', smudge: 'Smudge', blur: 'Blur' }[S.tool] || 'Paint';
    const icon = PS.toolById(S.tool) ? PS.toolById(S.tool).icon : 'brush';
    S = null;
    PS.snapshot(name, icon);
  }

  /* ---- flood fill (bucket) + magic wand ---- */
  function floodMask(srcCtx, sx, sy, tol, contiguous) {
    const W = PS.doc.w, H = PS.doc.h;
    const img = srcCtx.getImageData(0, 0, W, H).data;
    const mask = new Uint8Array(W * H);
    const idx = (x, y) => (y * W + x) * 4;
    const i0 = idx(sx, sy);
    const tr = img[i0], tg = img[i0 + 1], tb = img[i0 + 2], ta = img[i0 + 3];
    const match = i => {
      const dr = img[i] - tr, dg = img[i + 1] - tg, db = img[i + 2] - tb, da = img[i + 3] - ta;
      return (dr * dr + dg * dg + db * db + da * da) <= tol * tol * 4;
    };
    if (contiguous) {
      const st = [[sx, sy]];
      while (st.length) {
        const [x, y] = st.pop();
        if (x < 0 || y < 0 || x >= W || y >= H || mask[y * W + x]) continue;
        if (!match(idx(x, y))) continue;
        mask[y * W + x] = 1;
        st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    } else {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (match(idx(x, y))) mask[y * W + x] = 1;
    }
    return mask;
  }
  function maskToCanvas(mask, color, alpha) {
    const W = PS.doc.w, H = PS.doc.h;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d'); const out = cx.createImageData(W, H);
    const o = PS.hexToRgb(color);
    for (let i = 0; i < mask.length; i++) if (mask[i]) { const p = i * 4; out.data[p] = o.r; out.data[p + 1] = o.g; out.data[p + 2] = o.b; out.data[p + 3] = Math.round(255 * alpha); }
    cx.putImageData(out, 0, 0); return c;
  }
  function maskBBox(mask) {
    const W = PS.doc.w, H = PS.doc.h; let x0 = W, y0 = H, x1 = 0, y1 = 0, any = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { any = true; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return any ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null;
  }

  function doFill(p) {
    const l = PS.active();
    const tol = PS.opt('ps-o-tol', 32);
    const contig = PS.opt('ps-o-contig', true);
    const alpha = PS.opt('ps-o-op', 100) / 100;
    const sx = Math.floor(p.x), sy = Math.floor(p.y);
    if (sx < 0 || sy < 0 || sx >= PS.doc.w || sy >= PS.doc.h) return;
    const mask = floodMask(l.ctx, sx, sy, tol, contig);
    const fillC = maskToCanvas(mask, PS.fg, 1);
    l.ctx.save(); l.ctx.globalAlpha = alpha;
    PS.clipToSel(l.ctx, () => l.ctx.drawImage(fillC, 0, 0));
    l.ctx.restore();
    PS.render(); PS.updateThumb(l); PS.snapshot('Paint Bucket', 'fill');
  }

  function doWand(p) {
    const tol = PS.opt('ps-o-tol', 32);
    const contig = PS.opt('ps-o-contig', true);
    const sx = Math.floor(p.x), sy = Math.floor(p.y);
    const mask = floodMask(PS.vctx, sx, sy, tol, contig);
    const bb = maskBBox(mask);
    if (bb) { PS.setSelection(bb); PS.toast && PS.toast('Selection: ' + bb.w + ' × ' + bb.h + ' px', 'info'); }
  }

  /* ---- eyedropper ---- */
  function pickColor(p) {
    const x = Math.floor(p.x), y = Math.floor(p.y);
    const d = PS.vctx.getImageData(Math.max(0, Math.min(PS.doc.w - 1, x)), Math.max(0, Math.min(PS.doc.h - 1, y)), 1, 1).data;
    const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    PS.setForeground && PS.setForeground(hex);
  }

  /* ---- gradient ---- */
  function doGradient(a, b) {
    const l = PS.active(), ctx = l.ctx;
    const alpha = PS.opt('ps-o-op', 100) / 100;
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, rgba(PS.fg, 1)); g.addColorStop(1, rgba(PS.fg, 0));
    ctx.save(); ctx.globalAlpha = alpha;
    PS.clipToSel(ctx, () => { ctx.fillStyle = g; ctx.fillRect(0, 0, PS.doc.w, PS.doc.h); });
    ctx.restore();
    PS.render(); PS.updateThumb(l); PS.snapshot('Gradient', 'fill');
  }

  /* ---- type & shape ---- */
  function placeType(p) {
    const txt = (document.getElementById('ps-type-text') || {}).value || 'Text';
    const size = PS.opt('ps-type-size', 64);
    const font = (document.getElementById('ps-type-font') || {}).value || 'IBM Plex Sans';
    const l = PS.addLayer('T  ' + txt, { kind: 'text' });
    l.ctx.fillStyle = PS.fg; l.ctx.textBaseline = 'top';
    l.ctx.font = `600 ${size}px "${font}", sans-serif`;
    l.ctx.fillText(txt, p.x, p.y);
    PS.updateThumb(l); PS.render(); PS.refreshLayers && PS.refreshLayers(); PS.snapshot('Type: ' + txt, 'edit');
  }
  function drawShape(a, b) {
    const l = PS.active(), ctx = l.ctx;
    const radius = PS.opt('ps-shape-radius', 8);
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    ctx.save(); ctx.fillStyle = PS.fg; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius); else ctx.rect(x, y, w, h);
    ctx.fill(); ctx.restore();
    PS.render(); PS.updateThumb(l); PS.snapshot('Rectangle', 'shape');
  }

  /* ---- crop ---- */
  PS.applyCrop = function (rect) {
    rect = rect || PS.doc.sel; if (!rect) return;
    const nx = Math.max(0, Math.round(rect.x)), ny = Math.max(0, Math.round(rect.y));
    const nw = Math.min(PS.doc.w - nx, Math.round(rect.w)), nh = Math.min(PS.doc.h - ny, Math.round(rect.h));
    if (nw < 4 || nh < 4) return;
    PS.doc.layers.forEach(l => {
      const c = document.createElement('canvas'); c.width = nw; c.height = nh;
      c.getContext('2d').drawImage(l.canvas, -nx, -ny);
      l.canvas.width = nw; l.canvas.height = nh; l.ctx = l.canvas.getContext('2d');
      l.ctx.drawImage(c, 0, 0); PS.updateThumb(l);
    });
    PS.doc.w = nw; PS.doc.h = nh;
    PS.viewCanvas.width = nw; PS.viewCanvas.height = nh;
    $('#ps-doc').style.width = nw + 'px'; $('#ps-doc').style.height = nh + 'px';
    PS.setSelection(null); PS.render(); PS.fitToScreen();
    PS.snapshot('Crop', 'clip'); PS.refreshDocMeta && PS.refreshDocMeta();
  };

  /* ---- pen path preview ---- */
  PS.penPts = [];
  let penOverlay = null;
  function penClick(p) {
    if (!penOverlay) { penOverlay = document.createElement('canvas'); penOverlay.width = PS.doc.w; penOverlay.height = PS.doc.h; penOverlay.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none'; $('#ps-doc').insertBefore(penOverlay, $('#ps-marquee')); }
    PS.penPts.push(p); drawPen();
  }
  function drawPen() {
    const c = penOverlay.getContext('2d'); c.clearRect(0, 0, PS.doc.w, PS.doc.h);
    if (!PS.penPts.length) return;
    c.strokeStyle = '#4d9fff'; c.lineWidth = 1.5; c.beginPath();
    PS.penPts.forEach((pt, i) => i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)); c.stroke();
    c.fillStyle = '#fff'; c.strokeStyle = '#1f6feb';
    PS.penPts.forEach(pt => { c.beginPath(); c.rect(pt.x - 3, pt.y - 3, 6, 6); c.fill(); c.stroke(); });
  }
  PS.clearPen = function () { PS.penPts = []; if (penOverlay) penOverlay.getContext('2d').clearRect(0, 0, PS.doc.w, PS.doc.h); };

  /* ============================ POINTER ROUTING ============================ */
  let drag = null;

  function onDown(e) {
    if (e.button === 1) return;
    const stage = $('#ps-stage');
    const space = PS.spaceDown;
    const tool = (space || PS.tool.id === 'hand') ? PS.toolById('hand') : PS.tool;
    const p = PS.screenToDoc(e.clientX, e.clientY);
    try { stage.setPointerCapture && stage.setPointerCapture(e.pointerId); } catch (_) {}

    // pan
    if (tool.id === 'hand') {
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, px: PS.view.px, py: PS.view.py };
      stage.classList.add('is-panning'); return;
    }
    if (tool.id === 'zoom') {
      const factor = e.altKey ? 1 / 1.4 : 1.4;
      PS.setZoom(PS.view.z * factor, e.clientX, e.clientY); return;
    }
    if (tool.id === 'eyedropper') { pickColor(p); drag = { kind: 'pick' }; return; }
    if (tool.id === 'fill') { doFill(p); return; }
    if (tool.id === 'wand') { doWand(p); return; }
    if (tool.id === 'type') { placeType(p); return; }
    if (tool.id === 'pen') { penClick(p); return; }
    if (tool.id === 'clone' && e.altKey) {
      PS.cloneSource = { x: p.x, y: p.y, layer: PS.active() };
      const st = $('#ps-clone-state'); if (st) { st.textContent = 'Source set ✓'; st.className = 'dcs-badge dcs-badge--ok'; }
      return;
    }
    if (tool.id === 'move') {
      const base = document.createElement('canvas'); base.width = PS.doc.w; base.height = PS.doc.h;
      base.getContext('2d').drawImage(PS.active().canvas, 0, 0);
      drag = { kind: 'move', sx: p.x, sy: p.y, base, layer: PS.active() }; return;
    }
    if (tool.id === 'marquee' || tool.id === 'crop' || tool.id === 'shape' || tool.id === 'gradient' || tool.id === 'lasso') {
      drag = { kind: tool.id, a: p, b: p }; if (tool.id === 'lasso') drag.pts = [p];
      return;
    }
    // paint family
    if (PS.tool.paint && tool.id !== 'hand') { if (beginStroke(p)) drag = { kind: 'stroke' }; }
  }

  function onMove(e) {
    const p = PS.screenToDoc(e.clientX, e.clientY);
    PS.updateCursorReadout && PS.updateCursorReadout(p);
    if (!drag) return;
    if (drag.kind === 'pan') { PS.view.px = drag.px + (e.clientX - drag.sx); PS.view.py = drag.py + (e.clientY - drag.sy); PS.applyView(); return; }
    if (drag.kind === 'stroke') { paintTo(p); return; }
    if (drag.kind === 'move') {
      const dx = p.x - drag.sx, dy = p.y - drag.sy, l = drag.layer;
      l.ctx.clearRect(0, 0, PS.doc.w, PS.doc.h); l.ctx.drawImage(drag.base, dx, dy);
      PS.render(); PS.updateThumb(l); return;
    }
    if (drag.kind === 'marquee' || drag.kind === 'crop') {
      drag.b = p; previewRect(drag.a, drag.b); return;
    }
    if (drag.kind === 'shape' || drag.kind === 'gradient') { drag.b = p; previewRect(drag.a, drag.b, drag.kind === 'gradient'); return; }
    if (drag.kind === 'lasso') { drag.pts.push(p); drag.b = p; previewRect(bbox(drag.pts).min, bbox(drag.pts).max); return; }
  }

  function onUp(e) {
    const stage = $('#ps-stage'); stage.classList.remove('is-panning');
    if (!drag) return;
    const p = PS.screenToDoc(e.clientX, e.clientY);
    const k = drag.kind;
    if (k === 'stroke') endStroke();
    else if (k === 'move') PS.snapshot('Move Layer', 'move');
    else if (k === 'marquee' || k === 'lasso' || k === 'crop') {
      const r = rectOf(drag.a, drag.b);
      if (k === 'crop') { if (r.w > 4) PS.applyCrop(r); }
      else PS.setSelection(r.w > 1 ? r : null);
    }
    else if (k === 'shape') { drawShape(drag.a, drag.b); }
    else if (k === 'gradient') { doGradient(drag.a, drag.b); }
    drag = null;
    PS.updateMarquee();
  }

  /* selection preview while dragging (uses marquee element directly) */
  function previewRect(a, b) {
    const r = rectOf(a, b), o = PS.docOrigin(), z = PS.view.z, m = $('#ps-marquee');
    m.classList.remove('ps-hidden');
    m.style.left = (o.x + r.x * z) + 'px'; m.style.top = (o.y + r.y * z) + 'px';
    m.style.width = (r.w * z) + 'px'; m.style.height = (r.h * z) + 'px';
  }
  const rectOf = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
  function bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }); return { min: { x: x0, y: y0 }, max: { x: x1, y: y1 } }; }

  PS.initPointer = function () {
    const stage = $('#ps-stage');
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // wheel: zoom with ctrl/cmd, else pan
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) { PS.setZoom(PS.view.z * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX, e.clientY); }
      else { PS.view.px -= e.deltaX; PS.view.py -= e.deltaY; PS.applyView(); }
    }, { passive: false });
  };

})(window.PS);
