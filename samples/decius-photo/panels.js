/* ===========================================================================
   panels.js — detached/floating surfaces: resize handles, Navigator, floating
   toolbar wiring. Dragging of .dcs-panel--floating / .dcs-toolbar--floating
   is handled by stock decius.js via [data-dcs-drag-handle]; this file only
   adds the photo-specific resize grips and the Navigator panel logic.
   =========================================================================== */
(function (PS) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);

  /* generic: resize a floating panel by dragging its right / bottom / corner edges */
  function makeResizable(el) {
    ['e', 's', 'se'].forEach(dir => {
      const h = document.createElement('div'); h.className = 'ps-rz ps-rz-' + dir; el.appendChild(h);
      h.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const br = $('#ps-body').getBoundingClientRect(), r = el.getBoundingClientRect();
        el.style.left = (r.left - br.left) + 'px'; el.style.top = (r.top - br.top) + 'px';
        el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = 'none';
        const sw = r.width, sh = r.height, sx = e.clientX, sy = e.clientY;
        el.classList.add('dcs--dragging');
        const move = ev => {
          if (dir.indexOf('e') >= 0) el.style.width = Math.max(184, Math.min(br.width - (r.left - br.left) - 4, sw + (ev.clientX - sx))) + 'px';
          if (dir.indexOf('s') >= 0) el.style.height = Math.max(110, Math.min(br.height - (r.top - br.top) - 4, sh + (ev.clientY - sy))) + 'px';
          PS.queueNav && PS.queueNav();
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); el.classList.remove('dcs--dragging'); };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      });
    });
  }

  /* ---- Navigator ---- */
  let navBox = null;
  function navMetrics() {
    const thumb = $('#ps-nav-thumb'); if (!thumb) return null;
    const bw = thumb.clientWidth, bh = thumb.clientHeight;
    const s = Math.min(bw / PS.doc.w, bh / PS.doc.h);
    const tw = PS.doc.w * s, th = PS.doc.h * s;
    return { thumb, bw, bh, s, tw, th, ox: (bw - tw) / 2, oy: (bh - th) / 2 };
  }
  PS.updateNavigator = function () {
    const m = navMetrics(); if (!m || !PS.viewCanvas) return;
    const cv = $('#ps-nav-canvas');
    cv.width = Math.max(1, Math.round(m.tw)); cv.height = Math.max(1, Math.round(m.th));
    cv.style.left = m.ox + 'px'; cv.style.top = m.oy + 'px';
    cv.style.width = m.tw + 'px'; cv.style.height = m.th + 'px';
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(PS.viewCanvas, 0, 0, cv.width, cv.height);
    // viewport rectangle = doc region currently visible in the stage
    const tl = PS.screenToDoc(PS.stageRect().left, PS.stageRect().top);
    const br = PS.screenToDoc(PS.stageRect().right, PS.stageRect().bottom);
    const x0 = Math.max(0, Math.min(PS.doc.w, tl.x)), y0 = Math.max(0, Math.min(PS.doc.h, tl.y));
    const x1 = Math.max(0, Math.min(PS.doc.w, br.x)), y1 = Math.max(0, Math.min(PS.doc.h, br.y));
    const v = $('#ps-nav-view');
    v.style.left = (m.ox + x0 * m.s) + 'px'; v.style.top = (m.oy + y0 * m.s) + 'px';
    v.style.width = Math.max(2, (x1 - x0) * m.s) + 'px'; v.style.height = Math.max(2, (y1 - y0) * m.s) + 'px';
    // sync zoom UI in the navigator
    const pct = Math.round(PS.view.z * 100);
    const z = $('#ps-nav-zoom'); if (z && PS.setSlider) PS.setSlider(z, Math.min(800, pct));
    const p = $('#ps-nav-pct'); if (p) p.textContent = pct + '%';
  };
  let navQueued = false;
  PS.queueNav = function () { if (navQueued) return; navQueued = true; requestAnimationFrame(() => { navQueued = false; PS.updateNavigator(); }); };

  function centerOnDoc(dx, dy) {
    PS.view.px = (PS.doc.w / 2 - dx) * PS.view.z;
    PS.view.py = (PS.doc.h / 2 - dy) * PS.view.z;
    PS.applyView();
  }

  PS.initDetached = function () {
    // draggable surfaces: stock decius.js auto-wires [data-dcs-drag-handle]
    // resizable panels (drag the borders)
    $$('.dcs-panel--floating').forEach(makeResizable);
    // center the floating toolbar along the bottom
    const bar = $('#ps-floatbar');
    if (bar) { const sr = $('#ps-body').getBoundingClientRect(); bar.style.left = Math.round((sr.width - bar.offsetWidth) / 2) + 'px'; bar.style.transform = 'none'; }

    // Navigator: drag/click on the thumbnail pans the doc
    const thumb = $('#ps-nav-thumb');
    if (thumb) {
      const panFrom = e => {
        const m = navMetrics(); const r = thumb.getBoundingClientRect();
        const dx = (e.clientX - r.left - m.ox) / m.s, dy = (e.clientY - r.top - m.oy) / m.s;
        centerOnDoc(Math.max(0, Math.min(PS.doc.w, dx)), Math.max(0, Math.min(PS.doc.h, dy)));
      };
      thumb.addEventListener('pointerdown', e => {
        e.preventDefault(); panFrom(e);
        const mv = ev => panFrom(ev); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      });
    }
    // Navigator zoom slider
    const navZoom = $('#ps-nav-zoom');
    if (navZoom) navZoom.addEventListener('input', e => PS.setZoom(e.detail.value / 100));

    // floating toolbar actions
    const acts = { undo: PS.undo, redo: PS.redo, zoomin: () => PS.setZoom(PS.view.z * 1.4), zoomout: () => PS.setZoom(PS.view.z / 1.4), fit: PS.fitToScreen };
    $$('#ps-floatbar [data-act]').forEach(b => b.addEventListener('click', () => acts[b.dataset.act] && acts[b.dataset.act]()));

    // keep Navigator live: wrap render + applyView
    const _r = PS.render; PS.render = function () { _r.apply(this, arguments); PS.queueNav(); };
    const _av = PS.applyView; PS.applyView = function () { _av.apply(this, arguments); PS.queueNav(); };
    PS.updateNavigator();
  };

  function $$(s, r = document) { return Array.from(r.querySelectorAll(s)); }

  // run after the app has booted
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(PS.initDetached, 0));
  else setTimeout(PS.initDetached, 0);

})(window.PS);
