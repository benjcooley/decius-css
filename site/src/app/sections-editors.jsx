/* sections-editors.jsx
   Color pickers · Curve · Graph · Texture pickers
*/
const { useState: useStateE, useRef: useRefE, useEffect: useEffectE } = React;

/* ─────────── Color helpers ─────────── */
function hsvToRgb(h, s, v) {
  const c = v * s;
  const hh = (h / 60) % 6;
  const x = c * (1 - Math.abs(hh % 2 - 1));
  let r=0, g=0, b=0;
  if (hh < 1) [r,g,b] = [c,x,0];
  else if (hh < 2) [r,g,b] = [x,c,0];
  else if (hh < 3) [r,g,b] = [0,c,x];
  else if (hh < 4) [r,g,b] = [0,x,c];
  else if (hh < 5) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  const m = v - c;
  return [r+m, g+m, b+m];
}
function rgbHex([r,g,b]) {
  const f = n => Math.round(n*255).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
function rgbToHsv([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}
const hexToHsv = (hex) => { const rgb = hexToRgb(hex); return rgb && rgbToHsv(rgb); };

/* ─────────── Color wheel + triangle (HSV) ─────────── */
function ColorWheel({ size = 220 }) {
  const [h, setH] = useStateE(210);
  const [s, setS] = useStateE(0.7);
  const [v, setV] = useStateE(0.85);
  const wrapRef = useRefE(null);

  const cx = size / 2, cy = size / 2;
  const outerR = size / 2;
  const ringW = 26;
  const innerR = outerR - ringW;
  const triR = innerR - 6;
  const innerPct = (innerR / outerR) * 100;

  // Triangle vertices: V1 = hue tip (rotates with h), V2 = white, V3 = black
  // hue=0 (red) at top; angles in SVG: 0° = right, 90° = down
  const a1 = (h - 90) * Math.PI / 180;
  const a2 = a1 + (2 * Math.PI / 3);
  const a3 = a1 + (4 * Math.PI / 3);
  const V1 = [cx + triR * Math.cos(a1), cy + triR * Math.sin(a1)];  // hue
  const V2 = [cx + triR * Math.cos(a2), cy + triR * Math.sin(a2)];  // white
  const V3 = [cx + triR * Math.cos(a3), cy + triR * Math.sin(a3)];  // black

  // Convert (s, v) → barycentric (a_hue, b_white, c_black) → point inside triangle
  // v = a + b, s = a / (a + b)
  const a = s * v;
  const b = (1 - s) * v;
  const c = 1 - v;
  const cursorX = a * V1[0] + b * V2[0] + c * V3[0];
  const cursorY = a * V1[1] + b * V2[1] + c * V3[1];

  const rgb = hsvToRgb(h, s, v);
  const hex = rgbHex(rgb);
  const hueColor = rgbHex(hsvToRgb(h, 1, 1));

  // Drag handlers
  const distFromCenter = (x, y) => Math.hypot(x - cx, y - cy);
  const handleDown = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const scale = size / rect.width;
    const startX = (e.clientX - rect.left) * scale;
    const startY = (e.clientY - rect.top) * scale;
    const d = distFromCenter(startX, startY);
    const mode = d > innerR ? 'hue' : 'sv';

    const updateHue = (cx0, cy0) => {
      const ang = Math.atan2(cy0 - cy, cx0 - cx);
      let deg = ang * 180 / Math.PI + 90;
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;
      setH(deg);
    };
    const updateSV = (px, py) => {
      // Barycentric coords of point in triangle V1V2V3
      const denom = (V2[1] - V3[1]) * (V1[0] - V3[0]) + (V3[0] - V2[0]) * (V1[1] - V3[1]);
      let ba = ((V2[1] - V3[1]) * (px - V3[0]) + (V3[0] - V2[0]) * (py - V3[1])) / denom;
      let bb = ((V3[1] - V1[1]) * (px - V3[0]) + (V1[0] - V3[0]) * (py - V3[1])) / denom;
      let bc = 1 - ba - bb;
      // Clamp to triangle
      ba = Math.max(0, ba); bb = Math.max(0, bb); bc = Math.max(0, bc);
      const sum = ba + bb + bc;
      ba /= sum; bb /= sum; bc /= sum;
      const nv = ba + bb;
      const ns = nv > 0 ? ba / nv : 0;
      setS(Math.max(0, Math.min(1, ns)));
      setV(Math.max(0, Math.min(1, nv)));
    };

    if (mode === 'hue') updateHue(startX, startY);
    else updateSV(startX, startY);

    const move = (ev) => {
      const x = (ev.clientX - rect.left) * scale;
      const y = (ev.clientY - rect.top) * scale;
      if (mode === 'hue') updateHue(x, y);
      else updateSV(x, y);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Hue indicator: a notch on the ring at the current hue
  const hueAng = (h - 90) * Math.PI / 180;
  const hueX1 = cx + (outerR + 2) * Math.cos(hueAng);
  const hueY1 = cy + (outerR + 2) * Math.sin(hueAng);
  const hueX2 = cx + (innerR - 2) * Math.cos(hueAng);
  const hueY2 = cy + (innerR - 2) * Math.sin(hueAng);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: size + 30 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      {/* Smooth hue ring (conic gradient masked to a donut) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        WebkitMaskImage: `radial-gradient(circle closest-side, transparent ${innerPct - 0.5}%, #000 ${innerPct}%)`,
        maskImage: `radial-gradient(circle closest-side, transparent ${innerPct - 0.5}%, #000 ${innerPct}%)`,
      }} />
      <svg ref={wrapRef} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }} onPointerDown={handleDown}>
        <defs>
          <linearGradient id="cw-white" x1={V1[0]} y1={V1[1]} x2={V2[0]} y2={V2[1]} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={hueColor} stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <linearGradient id="cw-black"
            x1={(V1[0] + V2[0]) / 2} y1={(V1[1] + V2[1]) / 2}
            x2={V3[0]} y2={V3[1]} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>

        {/* Hue thumb (notch) */}
        <line x1={hueX1} y1={hueY1} x2={hueX2} y2={hueY2} stroke="#fff" strokeWidth="2.5" />
        <line x1={hueX1} y1={hueY1} x2={hueX2} y2={hueY2} stroke="#000" strokeWidth="1" />

        {/* Triangle */}
        <polygon points={`${V1[0]},${V1[1]} ${V2[0]},${V2[1]} ${V3[0]},${V3[1]}`} fill={hueColor} stroke="rgba(0,0,0,.3)" strokeWidth=".5" />
        <polygon points={`${V1[0]},${V1[1]} ${V2[0]},${V2[1]} ${V3[0]},${V3[1]}`} fill="url(#cw-white)" />
        <polygon points={`${V1[0]},${V1[1]} ${V2[0]},${V2[1]} ${V3[0]},${V3[1]}`} fill="url(#cw-black)" />

        {/* SV cursor */}
        <circle cx={cursorX} cy={cursorY} r="6" fill="none" stroke="#000" strokeWidth="2" />
        <circle cx={cursorX} cy={cursorY} r="6" fill="none" stroke="#fff" strokeWidth="1.25" />
      </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr', gap: 4, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: hex, border: '1px solid var(--dcs-line)' }} />
        <input className="dcs-input dcs-num" value={`#${hex.slice(1).toUpperCase()}`} readOnly style={{ textAlign: 'center', padding: 0 }} />
        <input className="dcs-input dcs-num" value={`${Math.round(h)}°`} readOnly style={{ textAlign: 'center', padding: 0 }} />
        <input className="dcs-input dcs-num" value={`${Math.round(s * 100)}/${Math.round(v * 100)}`} readOnly style={{ textAlign: 'center', padding: 0 }} />
      </div>
    </div>
  );
}

/* ─────────── Color picker (embedded large, square+bar) ─────────── */
function ColorPicker({ value, onChange, compact }) {
  const [hsv, setHsv] = useStateE({ h: 210, s: .7, v: .85 });
  const [prevColor] = useStateE('#2f86ee');
  const [mode, setMode] = useStateE('hex');
  const sqRef = useRefE(null);
  const hueRef = useRefE(null);
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbHex(rgb);
  const hueColor = rgbHex(hsvToRgb(hsv.h, 1, 1));
  const recents = ['#4d9fff', '#2f86ee', '#ff7ab8', '#4ed18a', '#f2b14a', '#b48cff', '#4ad5d5', '#ef6b6b'];

  const dragSquare = (e) => {
    const rect = sqRef.current.getBoundingClientRect();
    const update = (cx, cy) => {
      const s = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
      const v = 1 - Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
      setHsv(h => ({ ...h, s, v }));
    };
    update(e.clientX, e.clientY);
    const move = ev => update(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const dragHue = (e) => {
    const rect = hueRef.current.getBoundingClientRect();
    const update = (cy) => {
      const t = Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
      setHsv(h => ({ ...h, h: t * 360 }));
    };
    update(e.clientY);
    const move = ev => update(ev.clientY);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  return (
    <div style={{ width: compact ? 240 : 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--dcs-line)', gap: 2 }}>
        {['hex', 'rgb', 'hsl', 'hsv'].map(m => (
          <button key={m}
            onClick={() => setMode(m)}
            style={{
              background: 'transparent', border: 'none',
              padding: '6px 12px', fontSize: 10, letterSpacing: '.08em',
              fontFamily: 'var(--dcs-font-mono)', textTransform: 'uppercase',
              color: mode === m ? 'var(--dcs-accent)' : 'var(--dcs-text-mute)',
              cursor: 'pointer', borderBottom: mode === m ? '1px solid var(--dcs-accent)' : '1px solid transparent',
              marginBottom: -1,
            }}>{m}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button title="Pick from screen"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--dcs-text-mute)', padding: '4px 6px',
          }}><Icon name="eyedropper" /></button>
      </div>

      {/* SV square + vertical hue bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 16px', gap: 8 }}>
        <div ref={sqRef} className="dcs-color-square" style={{ '--hue': hueColor, aspectRatio: '1.2 / 1' }} onPointerDown={dragSquare}>
          <div className="dcs-color-square__cursor" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
        </div>
        <div ref={hueRef}
             onPointerDown={dragHue}
             style={{
               width: 16,
               background: 'linear-gradient(180deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
               border: '1px solid var(--dcs-line)',
               borderRadius: 'var(--dcs-r-1)',
               position: 'relative',
               cursor: 'ns-resize',
             }}>
          <div style={{
            position: 'absolute', left: -2, right: -2,
            top: `${(hsv.h / 360) * 100}%`,
            transform: 'translateY(-50%)',
            height: 4,
            border: '1px solid #fff',
            background: '#14161c',
            borderRadius: 1,
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Alpha bar */}
      <div className="dcs-alpha-bar" style={{ '--c': hex }}>
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: '100%', transform: 'translateX(-50%)', width: 4, background: '#fff', border: '1px solid #14161c', borderRadius: 1 }} />
      </div>

      {/* Current / previous comparison */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', height: 28,
        border: '1px solid var(--dcs-line)', borderRadius: 'var(--dcs-r-1)',
        overflow: 'hidden',
        background: 'repeating-conic-gradient(rgba(255,255,255,.05) 0 90deg, rgba(255,255,255,.1) 90deg 180deg) 0 0 / 12px 12px',
      }}>
        <div style={{ background: prevColor, display: 'flex', alignItems: 'flex-end', padding: '2px 6px', fontFamily: 'var(--dcs-font-mono)', fontSize: 9, color: 'rgba(0,0,0,.6)' }}>previous</div>
        <div style={{ background: hex, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '2px 6px', fontFamily: 'var(--dcs-font-mono)', fontSize: 9, color: 'rgba(0,0,0,.6)' }}>new</div>
      </div>

      {/* Value fields by mode */}
      {mode === 'hex' && (
        <div className="dcs-row" style={{ gap: 4 }}>
          <span className="dcs-mono" style={{ fontSize: 11, color: 'var(--dcs-text-mute)', minWidth: 28 }}>#</span>
          <input className="dcs-input dcs-mono" value={hex.slice(1).toUpperCase()} readOnly style={{ flex: 1 }} />
          <Button sm icon iconLeft="copy" />
        </div>
      )}
      {mode === 'rgb' && (
        <div className="dcs-row" style={{ gap: 4 }}>
          {['R', 'G', 'B'].map((k, i) => (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 9, color: 'var(--dcs-text-mute)', textAlign: 'center', fontFamily: 'var(--dcs-font-mono)' }}>{k}</div>
              <input className="dcs-input dcs-mono" defaultValue={Math.round(rgb[i] * 255)} style={{ textAlign: 'center', padding: 0 }} />
            </div>
          ))}
        </div>
      )}
      {mode === 'hsl' && (
        <div className="dcs-row" style={{ gap: 4 }}>
          {[['H', `${Math.round(hsv.h)}°`], ['S', `${Math.round(hsv.s * 100)}%`], ['L', `${Math.round(hsv.v * 50)}%`]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 9, color: 'var(--dcs-text-mute)', textAlign: 'center', fontFamily: 'var(--dcs-font-mono)' }}>{k}</div>
              <input className="dcs-input dcs-mono" defaultValue={v} style={{ textAlign: 'center', padding: 0 }} />
            </div>
          ))}
        </div>
      )}
      {mode === 'hsv' && (
        <div className="dcs-row" style={{ gap: 4 }}>
          {[['H', `${Math.round(hsv.h)}°`], ['S', `${Math.round(hsv.s * 100)}%`], ['V', `${Math.round(hsv.v * 100)}%`]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 9, color: 'var(--dcs-text-mute)', textAlign: 'center', fontFamily: 'var(--dcs-font-mono)' }}>{k}</div>
              <input className="dcs-input dcs-mono" defaultValue={v} style={{ textAlign: 'center', padding: 0 }} />
            </div>
          ))}
        </div>
      )}

      {!compact && (
        <div>
          <div style={{ fontSize: 9, color: 'var(--dcs-text-mute)', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'var(--dcs-font-mono)', marginBottom: 4 }}>Recent</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {recents.map(c => (
              <div key={c} title={c.toUpperCase()} style={{
                flex: 1, height: 18, background: c,
                border: '1px solid var(--dcs-line)', borderRadius: 2,
                cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Channel-editor color field: a mini swatch at input height that opens a
   small dropdown picker. */
// A reusable color CHIP that scrubs HSV on drag: ←→ hue, ↕ value, Ctrl+←→ sat.
// Same behavior wherever a chip appears (channel widget, color-only, etc.).
function ColorChip({ hsv, setHsv, size }) {
  const onDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, s0 = { ...hsv };
    const clamp = (n) => Math.max(0, Math.min(1, n));
    const move = (ev) => {
      const dx = ev.clientX - sx, dy = sy - ev.clientY;
      let h = s0.h, s = s0.s;
      const v = clamp(s0.v + dy / 200);
      if (ev.ctrlKey || ev.metaKey) s = clamp(s0.s + dx / 200);
      else { h = (s0.h + dx) % 360; if (h < 0) h += 360; }
      setHsv({ h, s, v });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  return (
    <span className="dcs-colorfield__chip" onPointerDown={onDown}
      title="drag: ←→ hue · ↕ value · Ctrl saturation"
      style={{ background: rgbHex(hsvToRgb(hsv.h, hsv.s, hsv.v)), ...(size ? { width: size, height: size } : null) }} />
  );
}

// Compact, bound SV picker for the color-field popover: SV square + a hue
// slider + a mini swatch, driving the field's hsv directly.
function MiniPicker({ hsv, set }) {
  const sqRef = useRefE(null), hueRef = useRefE(null);
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const hueColor = rgbHex(hsvToRgb(hsv.h, 1, 1));
  const hex = rgbHex(hsvToRgb(hsv.h, hsv.s, hsv.v));
  const dragSquare = (e) => {
    e.preventDefault();
    const rect = sqRef.current.getBoundingClientRect(), h0 = hsv.h;
    const upd = (cx, cy) => set({ h: h0, s: clamp((cx - rect.left) / rect.width), v: 1 - clamp((cy - rect.top) / rect.height) });
    upd(e.clientX, e.clientY);
    const move = (ev) => upd(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const dragHue = (e) => {
    e.preventDefault();
    const rect = hueRef.current.getBoundingClientRect(), s0 = hsv.s, v0 = hsv.v;
    const upd = (cx) => set({ h: clamp((cx - rect.left) / rect.width) * 360, s: s0, v: v0 });
    upd(e.clientX);
    const move = (ev) => upd(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  return (
    <div style={{ width: 188, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div ref={sqRef} className="dcs-color-square" style={{ '--hue': hueColor, aspectRatio: '1.4 / 1' }} onPointerDown={dragSquare}>
        <div className="dcs-color-square__cursor" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
      </div>
      <div ref={hueRef} className="dcs-hue-bar" onPointerDown={dragHue}>
        <div className="dcs-hue-bar__cursor" style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, flex: '0 0 auto', borderRadius: 'var(--dcs-r-1)', background: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.35)' }} />
        <input className="dcs-input dcs-mono" value={hex.toUpperCase()} spellCheck={false}
          onChange={(e) => { const h = hexToHsv(e.target.value); if (h) set(h); }}
          style={{ flex: 1, minWidth: 0, height: 'var(--dcs-h-in)' }} />
        <Button sm icon iconLeft="eyedropper" title="Pick colour from screen" />
      </div>
    </div>
  );
}

// Channel color widget: chip (drag-scrub) + editable/copy-paste hex + dropdown
// picker. `colorOnly` drops the hex for a compact swatch. Row height matches
// the other channel widgets (var(--dcs-h-in)) so inspector rows align.
function ColorField({ value = '#4d9fff', onChange, colorOnly }) {
  const [hsv, setHsv] = useStateE(() => hexToHsv(value) || { h: 210, s: 0.7, v: 0.85 });
  const [open, setOpen] = useStateE(false);
  const [pop, setPop] = useStateE(null);          // fixed-position popover coords
  const ref = useRefE(null);
  useDismiss(ref, open, () => setOpen(false));
  // True popover: fixed to the viewport so it overlays cleanly and never grows
  // the panel's scroll; closes on scroll/resize like a menu.
  useEffectE(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [open]);
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = ref.current.getBoundingClientRect();
    const PW = 204, PH = 232;
    let top = r.bottom + 4; if (top + PH > window.innerHeight) top = Math.max(8, r.top - PH - 4);
    let left = r.left; if (left + PW > window.innerWidth) left = Math.max(8, window.innerWidth - PW - 8);
    setPop({ top, left }); setOpen(true);
  };
  const set = (h) => { setHsv(h); if (onChange) onChange(rgbHex(hsvToRgb(h.h, h.s, h.v))); };
  const hex = rgbHex(hsvToRgb(hsv.h, hsv.s, hsv.v));
  const onHex = (e) => { const h = hexToHsv(e.target.value); if (h) set(h); };
  return (
    <div ref={ref} className={`dcs-colorfield${colorOnly ? ' dcs-colorfield--swatch' : ''}`} style={{ position: 'relative' }}>
      <ColorChip hsv={hsv} setHsv={set} />
      {!colorOnly && (
        <input className="dcs-colorfield__hex" value={hex.toUpperCase()} spellCheck={false}
          onChange={onHex} onPointerDown={(e) => e.stopPropagation()} />
      )}
      <span className="dcs-colorfield__caret" onClick={toggle}><Icon name="chevron-down" size="sm" /></span>
      {open && pop && (
        <div style={{ position: 'fixed', top: pop.top, left: pop.left, zIndex: 200 }}>
          <Panel raised pad="sm" style={{ boxShadow: 'var(--dcs-shadow-pop)', width: 204 }}>
            <MiniPicker hsv={hsv} set={set} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function SectionColorPicker() {
  const [open, setOpen] = useStateE(false);
  const swatches = [
    '#4d9fff', '#2f86ee', '#1c5fb0', '#0b3a78', '#ef6b6b', '#f2b14a', '#4ed18a',
    '#b48cff', '#ff7ab8', '#4ad5d5', '#e7e9ee', '#aab0bd', '#767c8a', '#14161c',
    '#3c424f', '#2a2e38', '#1f222a', '#181a21', '#00b8d4', '#ff8a3a',
  ];
  return (
    <section className="dw-section" id="color-pickers">
      <div className="dw-section__eyebrow">Editors · 01</div>
      <h2>Color pickers</h2>
      <p className="dw-section__lead">
        Three sizes, one model. The large embedded picker for material editors; a popup variant
        that appears next to swatch buttons; tight chip widgets for inspectors and palette wells.
      </p>

      <Demo frame="app" caption="HSV wheel — outer ring for hue, inner triangle for saturation/value">
        <div className="dcs-row" style={{ gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Panel title="Material ▸ HSV" icon="palette" pad="sm">
            <ColorWheel size={240} />
          </Panel>
          <Panel title="Same color · different model" icon="droplet">
            <ColorPicker compact />
          </Panel>
        </div>
      </Demo>

      <Demo frame="app" caption="Large embedded — for material / shader panels">
        <div className="dcs-row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <Panel title="Material · Lambert" icon="palette">
            <ColorPicker />
          </Panel>
          <Panel title="Live preview" icon="eye" style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: 'radial-gradient(circle at 35% 30%, #b6d6ff, #4d9fff 60%, #1c4080 100%)', boxShadow: 'inset 0 0 24px rgba(0,0,0,.4)' }} />
              <div className="dcs-num" style={{ fontSize: 11, color: 'var(--dcs-text-dim)', lineHeight: 1.7 }}>
                <div>RGB · 077 159 255</div>
                <div>HSV · 210° 70% 100%</div>
                <div>HEX · #4D9FFF</div>
                <div>LIN · 0.072 0.348 1.000</div>
              </div>
            </div>
          </Panel>
        </div>
      </Demo>

      <Demo frame="app" caption="Swatch button → popup">
        <div className="dcs-col" style={{ gap: 10, position: 'relative', paddingBottom: open ? 360 : 0 }}>
          <div className="dcs-row" style={{ gap: 12 }}>
            <div className="dcs-field" style={{ minWidth: 0 }}>
              <label className="dcs-field__label">Diffuse</label>
              <div className="dcs-swatch" onClick={() => setOpen(o => !o)}>
                <div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} />
                <span>#4D9FFF</span>
              </div>
            </div>
            <div className="dcs-field" style={{ minWidth: 0 }}>
              <label className="dcs-field__label">Specular</label>
              <div className="dcs-swatch">
                <div className="dcs-swatch__chip" style={{ '--c': '#23262e' }} />
                <span>#23262E</span>
              </div>
            </div>
            <div className="dcs-field" style={{ minWidth: 0 }}>
              <label className="dcs-field__label">Emission</label>
              <div className="dcs-swatch">
                <div className="dcs-swatch__chip" style={{ '--c': '#000000' }} />
                <span>#000000</span>
              </div>
            </div>
          </div>
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 10 }}>
              <Panel raised pad="sm" style={{ boxShadow: 'var(--dcs-shadow-pop)' }}>
                <ColorPicker compact />
              </Panel>
            </div>
          )}
        </div>
      </Demo>

      <Demo frame="app" caption="Channel widgets — every inspector control shares one row height, so a textbox, value editor, color chip, dropdown, toggle/checkbox and a multiple-choice group all stack with even prompt → widget metrics.">
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap', paddingBottom: 260 }}>
          {/* Stacked in an inspector — every row is the same height (var(--dcs-h-in)):
              prompt on the left, widget on the right. They "just stack" uniformly. */}
          <Panel title="Material" icon="palette" pad="sm" style={{ minWidth: 264 }}>
            <div className="dcs-props">
              <div className="dcs-field"><span className="dcs-field__label">Name</span><input className="dcs-input" defaultValue="jane_skin" /></div>
              <div className="dcs-field"><span className="dcs-field__label">Roughness</span><Combo value={0.35} min={0} max={1} step={0.01} format={v => v.toFixed(2)} /></div>
              <div className="dcs-field"><span className="dcs-field__label">Base</span><ColorField value="#4d9fff" /></div>
              <div className="dcs-field"><span className="dcs-field__label">Rim</span><ColorField value="#ff7ab8" /></div>
              <div className="dcs-field"><span className="dcs-field__label">Blend</span>
                <select className="dcs-select"><option>Normal</option><option>Add</option><option>Multiply</option><option>Screen</option></select>
              </div>
              <div className="dcs-field"><span className="dcs-field__label">Shading</span>
                <ButtonGroup value="pbr" options={[{ value: 'flat', label: 'Flat' }, { value: 'pbr', label: 'PBR' }, { value: 'toon', label: 'Toon' }]} />
              </div>
              <div className="dcs-field"><span className="dcs-field__label">Two-sided</span><Switch /></div>
              <div className="dcs-field"><span className="dcs-field__label">Cast shadow</span><Check checked /></div>
            </div>
          </Panel>
          <div className="dcs-col" style={{ gap: 12, minWidth: 200 }}>
            <div className="dcs-row" style={{ gap: 10, alignItems: 'center' }}>
              <ColorField value="#4ad5d5" colorOnly />
              <ColorField value="#f2b14a" colorOnly />
              <ColorField value="#b48cff" colorOnly />
              <span style={{ fontSize: 11, color: 'var(--dcs-text-mute)' }}>color-only</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--dcs-text-dim)', lineHeight: 1.6, maxWidth: 220 }}>
              Each row is one channel widget at a uniform height —
              <strong style={{ color: 'var(--dw-text)' }}> textbox, value editor, color chip, dropdown, toggle / checkbox</strong>,
              and a <strong style={{ color: 'var(--dw-text)' }}>multiple-choice</strong> group — so they line up when stacked.
              The color chip <strong style={{ color: 'var(--dw-text)' }}>scrubs</strong> on drag
              (←→ hue, ↕ value, Ctrl saturation); its hex is a real field you can
              <strong style={{ color: 'var(--dw-text)' }}> copy &amp; paste</strong>, and the chevron opens the full picker.
            </div>
          </div>
        </div>
      </Demo>

      <Demo frame="app" caption="Palette well — pin colors per project">
        <Panel title="Palette · Project" icon="palette" pad="sm"
               tools={<><Button ghost sm icon iconLeft="plus" /><Button ghost sm icon iconLeft="eyedropper" /></>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {swatches.map(c => (
              <div key={c} className="dcs-tooltip" data-tip={c.toUpperCase()} style={{
                aspectRatio: '1', borderRadius: 'var(--dcs-r-1)',
                background: c, cursor: 'pointer',
                border: '1px solid var(--dcs-line)',
                boxShadow: 'var(--dcs-bevel-down)'
              }} />
            ))}
            <div style={{ aspectRatio: '1', borderRadius: 'var(--dcs-r-1)', background: 'var(--dcs-well)', border: '1px dashed var(--dcs-line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--dcs-text-mute)' }}>
              <Icon name="plus" size="sm" />
            </div>
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

/* ─────────── Curve editor ─────────── */
// Each point: { x, y, hx, hy } where (hx, hy) is the RIGHT-side tangent
// half-vector in normalized 0..1 space. The left handle mirrors as (-hx, -hy)
// so the curve stays smooth across the point.
function CurveEditor({ height = 220, points: initial, showHandles = true, color = '#4d9fff' }) {
  // Migrate legacy points (with just .h scalar or none) → {x, y, hx, hy}
  const seed = React.useMemo(() => {
    const src = initial || [
      { x: 0,    y: 1 },
      { x: 0.15, y: 0.2 },
      { x: 0.5,  y: 0.6 },
      { x: 0.85, y: 0.1 },
      { x: 1,    y: 0.3 },
    ];
    return src.map((p, i, a) => {
      if (p.hx !== undefined && p.hy !== undefined) return p;
      const prev = a[Math.max(0, i - 1)];
      const next = a[Math.min(a.length - 1, i + 1)];
      const dx = (next.x - prev.x) / 3;
      const dy = (next.y - prev.y) / 3;
      return { x: p.x, y: p.y, hx: dx, hy: dy };
    });
  }, [initial]);

  const [pts, setPts] = useStateE(seed);
  const [active, setActive] = useStateE(2);
  const [size, setSize] = useStateE({ w: 600, h: 260 });
  const wrapRef = useRefE(null);
  const svgRef = useRefE(null);

  useEffectE(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(100, Math.round(r.width)), h: Math.max(60, Math.round(r.height)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const W = size.w, H = size.h;
  const px = (p) => p.x * W;
  const py = (p) => (1 - p.y) * H;
  // Handle pixel positions (right + left, mirrored)
  const hxPx = (p) => p.hx * W;
  const hyPx = (p) => -p.hy * H;   // y is flipped in screen coords

  const dragPoint = (i) => (e) => {
    e.stopPropagation();
    setActive(i);
    const rect = svgRef.current.getBoundingClientRect();
    const move = (ev) => {
      const nx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const ny = 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setPts(p => p.map((q, j) => j === i ? { ...q, x: nx, y: ny } : q));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // side = +1 for right handle, -1 for left. Either drag updates the
  // right-handle (hx, hy); left-handle is computed as the mirror.
  const dragHandle = (i, side) => (e) => {
    e.stopPropagation();
    setActive(i);
    const rect = svgRef.current.getBoundingClientRect();
    const center = pts[i];
    const move = (ev) => {
      const nx = (ev.clientX - rect.left) / rect.width;
      const ny = 1 - (ev.clientY - rect.top) / rect.height;
      // Offset from point center, in normalized space
      const dx = (nx - center.x) * side;
      const dy = (ny - center.y) * side;
      // Clamp to a sensible reach
      const max = 0.5;
      setPts(p => p.map((q, j) => j === i ? {
        ...q,
        hx: Math.max(-max, Math.min(max, dx)),
        hy: Math.max(-max, Math.min(max, dy)),
      } : q));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // Build cubic path using each point's tangent as the cubic control offset.
  const path = pts.length < 2 ? '' : pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${px(p)} ${py(p)}`;
    const p0 = a[i - 1];
    const p1 = p;
    // cp1 = p0 + p0's right tangent;  cp2 = p1 - p1's right tangent (= p1 + p1.left)
    const cp1x = px(p0) + hxPx(p0);
    const cp1y = py(p0) + hyPx(p0);
    const cp2x = px(p1) - hxPx(p1);
    const cp2y = py(p1) - hyPx(p1);
    return acc + ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${px(p1)} ${py(p1)}`;
  }, '');

  const curveColor = color;       // curve + points take the channel/key color
  const tanColor = '#aab0bd';
  const accent = color;

  return (
    <div ref={wrapRef} className="dcs-graph" style={{ height, position: 'relative' }}>
      <div className="dcs-graph__major" />
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill={color} fillOpacity=".12" />
        <path d={path} fill="none" stroke={curveColor} strokeWidth="1.75" />

        {/* Tangent handles for the active point only — draggable in 2D, mirrored */}
        {showHandles && active !== null && active >= 0 && active < pts.length && (() => {
          const p = pts[active];
          const cx = px(p), cy = py(p);
          const dxp = hxPx(p), dyp = hyPx(p);
          const rx = cx + dxp, ry = cy + dyp;
          const lx = cx - dxp, ly = cy - dyp;
          return (
            <g>
              <line x1={lx} y1={ly} x2={rx} y2={ry}
                    stroke={tanColor} strokeWidth="1" strokeDasharray="3 3" opacity=".9" />
              {/* Right handle */}
              <circle cx={rx} cy={ry} r="9" fill="transparent"
                      style={{ cursor: 'move' }}
                      onPointerDown={dragHandle(active, +1)} />
              <circle cx={rx} cy={ry} r="4"
                      fill={accent} stroke="var(--dcs-bg)" strokeWidth="1.5"
                      style={{ pointerEvents: 'none' }} />
              {/* Left handle (mirrored) */}
              <circle cx={lx} cy={ly} r="9" fill="transparent"
                      style={{ cursor: 'move' }}
                      onPointerDown={dragHandle(active, -1)} />
              <circle cx={lx} cy={ly} r="4"
                      fill={accent} stroke="var(--dcs-bg)" strokeWidth="1.5"
                      style={{ pointerEvents: 'none' }} />
            </g>
          );
        })()}

        {pts.map((p, i) => (
          <g key={i} onPointerDown={dragPoint(i)} style={{ cursor: 'move' }}>
            <circle cx={px(p)} cy={py(p)} r="9" fill="transparent" />
            <circle cx={px(p)} cy={py(p)} r="4.5"
                    fill={i === active ? curveColor : 'var(--dcs-bg)'}
                    stroke={curveColor} strokeWidth="1.5" />
            {i === active && (
              <text x={px(p) + 10} y={py(p) - 8} fontFamily="JetBrains Mono" fontSize="10" fill={curveColor}>
                {p.x.toFixed(2)}, {p.y.toFixed(2)}
              </text>
            )}
          </g>
        ))}

        <text x="6" y="14" fontFamily="JetBrains Mono" fontSize="10" fill="var(--dcs-text-mute)" opacity=".6">1.0</text>
        <text x="6" y={H - 6} fontFamily="JetBrains Mono" fontSize="10" fill="var(--dcs-text-mute)" opacity=".6">0.0</text>
        <text x={W - 26} y={H - 6} fontFamily="JetBrains Mono" fontSize="10" fill="var(--dcs-text-mute)" opacity=".6">1.0</text>
      </svg>
    </div>
  );
}

function SectionCurve() {
  return (
    <section className="dw-section" id="curve">
      <div className="dw-section__eyebrow">Editors · 02</div>
      <h2>Curve editor</h2>
      <p className="dw-section__lead">
        Drag control points to shape envelopes, color ramps, falloffs, or animation eases. The
        curve takes its channel/key color and fills against it at low opacity, so overlaid channels
        stay legible — exactly like an animation graph editor (X red, Y green, Z blue).
      </p>
      <Demo frame="app" caption="Drag any point or its tangent handles to reshape the curve">
        <Panel title="Envelope · Filter cutoff" icon="envelope" pad="sm"
               tools={<><ButtonGroup value="bez" options={[
                  { value: 'lin', label: 'Linear' },
                  { value: 'bez', label: 'Bezier' },
                  { value: 'step', label: 'Step' },
               ]} /></>}>
          <CurveEditor color="#4d9fff" />
        </Panel>
      </Demo>

      <Demo frame="app" caption="Each curve carries its channel's key color">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Panel title="Location · X" icon="curve" pad="sm">
            <CurveEditor height={160} color="#ef6b6b" points={[
              { x: 0, y: 0 }, { x: 0.18, y: 0.08 }, { x: 0.5, y: 0.45 }, { x: 0.8, y: 0.85 }, { x: 1, y: 0.97 }
            ]} />
          </Panel>
          <Panel title="Location · Y" icon="curve" pad="sm">
            <CurveEditor height={160} color="#4ed18a" points={[
              { x: 0, y: 0.5 }, { x: 0.2, y: 0.9 }, { x: 0.4, y: 0.15 }, { x: 0.6, y: 0.65 }, { x: 0.8, y: 0.25 }, { x: 1, y: 0.5 }
            ]} />
          </Panel>
        </div>
      </Demo>
    </section>
  );
}

/* ─────────── Graph editor (node graph) ─────────── */
const GRAPH_NODE_W = 132, GRAPH_HEAD = 24, GRAPH_ROW = 22, GRAPH_BODY_PAD = 6;
const GRAPH_ZMIN = 0.4, GRAPH_ZMAX = 2.4;
const GRAPH_PALETTE = ['#4d9fff', '#b48cff', '#f2b14a', '#4ed18a', '#ff7ab8', '#4ad5d5'];
let graphSeq = 100;
const nodeHeight = (n) => GRAPH_HEAD + GRAPH_BODY_PAD * 2 + (n.ins.length + n.outs.length) * GRAPH_ROW;

function NodeGraph() {
  const [nodes, setNodes] = useStateE([
    { id: 'noise',  x: 16,  y: 30,  title: 'Noise',   icon: 'wave-noise', color: '#b48cff', ins: [],                 outs: ['fac'] },
    { id: 'tex',    x: 16,  y: 176, title: 'Texture', icon: 'image',      color: '#f2b14a', ins: ['uv'],             outs: ['rgb'] },
    { id: 'mix',    x: 250, y: 84,  title: 'Mix',     icon: 'array',      color: '#4d9fff', ins: ['a', 'b', 'fac'],  outs: ['rgb'] },
    { id: 'gamma',  x: 470, y: 70,  title: 'Gamma',   icon: 'bolt',       color: '#4ed18a', ins: ['in'],             outs: ['out'] },
    { id: 'output', x: 660, y: 100, title: 'Output',  icon: 'render',     color: '#4d9fff', ins: ['color'],          outs: [] },
  ]);
  const [wires, setWires] = useStateE([
    { id: 'w1', fn: 'noise', fs: 'fac', tn: 'mix',    ts: 'a' },
    { id: 'w2', fn: 'tex',   fs: 'rgb', tn: 'mix',    ts: 'b' },
    { id: 'w3', fn: 'mix',   fs: 'rgb', tn: 'gamma',  ts: 'in' },
    { id: 'w4', fn: 'gamma', fs: 'out', tn: 'output', ts: 'color' },
  ]);
  const [sel, setSel] = useStateE(null);          // { type:'node'|'wire', id }
  const [view, setView] = useStateE({ z: 1, ox: 0, oy: 0 });
  const [drag, setDrag] = useStateE(null);        // live connect: { fn, fs, x, y } (x,y in world)
  const wrapRef = useRefE(null);

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  // World pixel space — the viewport <div> applies the pan/zoom transform, so
  // node coords and socket centers share one space and wires always meet sockets.
  const socketY = (n, idx) => n.y + GRAPH_HEAD + GRAPH_BODY_PAD + idx * GRAPH_ROW + GRAPH_ROW / 2;
  const outPos = (n, name) => [n.x + GRAPH_NODE_W, socketY(n, n.ins.length + n.outs.indexOf(name))];
  const inPos  = (n, name) => [n.x, socketY(n, n.ins.indexOf(name))];
  const wirePath = (fx, fy, tx, ty) => { const mx = (fx + tx) / 2; return `M ${fx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${tx} ${ty}`; };
  const toWorld = (cx, cy) => {
    const r = wrapRef.current.getBoundingClientRect();
    return [(cx - r.left - view.ox) / view.z, (cy - r.top - view.oy) / view.z];
  };

  // ── Zoom (buttons + wheel) ───────────────────────────────────────────
  const zoomAt = (factor, cx, cy) => setView(v => {
    const z = Math.max(GRAPH_ZMIN, Math.min(GRAPH_ZMAX, v.z * factor));
    const k = z / v.z;
    return { z, ox: cx - (cx - v.ox) * k, oy: cy - (cy - v.oy) * k };
  });
  const zoomBtn = (factor) => () => {
    const r = wrapRef.current.getBoundingClientRect();
    zoomAt(factor, r.width / 2, r.height / 2);
  };
  const fit = () => {
    if (!nodes.length || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (const n of nodes) { a = Math.min(a, n.x); b = Math.min(b, n.y); c = Math.max(c, n.x + GRAPH_NODE_W); d = Math.max(d, n.y + nodeHeight(n)); }
    const pad = 28, cw = r.width - pad * 2, ch = r.height - pad * 2;
    const z = Math.max(GRAPH_ZMIN, Math.min(GRAPH_ZMAX, Math.min(cw / (c - a), ch / (d - b), 1.2)));
    setView({ z, ox: pad + (cw - (c - a) * z) / 2 - a * z, oy: pad + (ch - (d - b) * z) / 2 - b * z });
  };
  useEffectE(() => {
    const el = wrapRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Background: pan on drag, deselect on click ──────────────────────
  const onBgDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox0 = view.ox, oy0 = view.oy;
    let moved = false;
    const move = (ev) => {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
      setView(v => ({ ...v, ox: ox0 + (ev.clientX - sx), oy: oy0 + (ev.clientY - sy) }));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (!moved) setSel(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // ── Move a node by its header ───────────────────────────────────────
  const dragNode = (id) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    setSel({ type: 'node', id });
    const n0 = byId[id], ox = e.clientX, oy = e.clientY, sx = n0.x, sy = n0.y, z = view.z;
    const move = (ev) => setNodes(ns => ns.map(n => n.id === id
      ? { ...n, x: sx + (ev.clientX - ox) / z, y: Math.max(0, sy + (ev.clientY - oy) / z) } : n));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // ── Connect / disconnect wires by dragging sockets ──────────────────
  const findInputAt = (cx, cy) => {
    const r = wrapRef.current.getBoundingClientRect();
    let best = null, bestD = 18;
    for (const n of nodes) for (const s of n.ins) {
      const [wx, wy] = inPos(n, s);
      const d = Math.hypot(cx - (r.left + view.ox + wx * view.z), cy - (r.top + view.oy + wy * view.z));
      if (d < bestD) { bestD = d; best = { nid: n.id, sock: s }; }
    }
    return best;
  };
  const addWire = (fn, fs, tn, ts) => {
    if (fn === tn) return;
    setWires(ws => [...ws.filter(w => !(w.tn === tn && w.ts === ts)), { id: 'w' + (graphSeq++), fn, fs, tn, ts }]);
  };
  const beginDrag = (fn, fs, e) => {
    const move = (ev) => { const [x, y] = toWorld(ev.clientX, ev.clientY); setDrag({ fn, fs, x, y }); };
    move(e);
    const up = (ev) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const hit = findInputAt(ev.clientX, ev.clientY);
      setDrag(null);
      if (hit) addWire(fn, fs, hit.nid, hit.sock);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const startConnect = (fn, fs) => (e) => { e.stopPropagation(); e.preventDefault(); beginDrag(fn, fs, e); };
  const startFromInput = (tn, ts) => (e) => {
    e.stopPropagation(); e.preventDefault();
    const w = wires.find(x => x.tn === tn && x.ts === ts);
    if (!w) return;                       // empty input — nothing to grab
    setWires(ws => ws.filter(x => x.id !== w.id));
    beginDrag(w.fn, w.fs, e);             // re-drag from the original source
  };

  // ── Add / delete ────────────────────────────────────────────────────
  const addNode = () => {
    const id = 'n' + (graphSeq++);
    const r = wrapRef.current.getBoundingClientRect();
    const x = Math.max(0, (r.width / 2 - view.ox) / view.z - GRAPH_NODE_W / 2);
    const y = Math.max(0, (r.height / 2 - view.oy) / view.z - 30);
    const color = GRAPH_PALETTE[nodes.length % GRAPH_PALETTE.length];
    setNodes(ns => [...ns, { id, x, y, title: 'Node', icon: 'bolt', color, ins: ['in'], outs: ['out'] }]);
    setSel({ type: 'node', id });
  };
  const deleteSel = () => {
    if (!sel) return;
    if (sel.type === 'node') {
      setNodes(ns => ns.filter(n => n.id !== sel.id));
      setWires(ws => ws.filter(w => w.fn !== sel.id && w.tn !== sel.id));
    } else {
      setWires(ws => ws.filter(w => w.id !== sel.id));
    }
    setSel(null);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); }
    else if (e.key === 'Escape') setSel(null);
  };

  const Socket = ({ side, filled, onPointerDown }) => (
    <div onPointerDown={onPointerDown}
      title={side === 'out' ? 'drag to connect' : 'drag to rewire / detach'}
      style={{
        width: 10, height: 10, borderRadius: '50%',
        background: filled ? 'var(--dcs-accent)' : 'var(--dcs-bg)',
        border: '2px solid var(--dcs-bg)',
        boxShadow: `0 0 0 1px ${filled ? 'var(--dcs-accent)' : 'var(--dcs-line-strong)'}`,
        [side === 'in' ? 'marginLeft' : 'marginRight']: -14, flex: '0 0 auto', cursor: 'crosshair',
      }} />
  );

  const selWire = sel && sel.type === 'wire' ? sel.id : null;

  return (
    <div ref={wrapRef} className="dcs-graph" tabIndex={0}
      onPointerDown={onBgDown} onKeyDown={onKeyDown}
      onPointerDownCapture={() => wrapRef.current && wrapRef.current.focus()}
      style={{ height: 320, position: 'relative', overflow: 'hidden', outline: 'none' }}>
      <div className="dcs-graph__major" />

      {/* Pan/zoom viewport — pointer-events pass through empty space to the bg. */}
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', pointerEvents: 'none',
        transform: `translate(${view.ox}px, ${view.oy}px) scale(${view.z})` }}>
        <svg width="3000" height="2000" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
          {wires.map(w => {
            const a = byId[w.fn], b = byId[w.tn];
            if (!a || !b) return null;
            const [fx, fy] = outPos(a, w.fs);
            const [tx, ty] = inPos(b, w.ts);
            const d = wirePath(fx, fy, tx, ty);
            const on = w.id === selWire;
            return (
              <g key={w.id}>
                <path d={d} fill="none" stroke="transparent" strokeWidth="12"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onPointerDown={(e) => { e.stopPropagation(); setSel({ type: 'wire', id: w.id }); }} />
                <path d={d} fill="none" stroke={on ? '#fff' : a.color} strokeWidth={on ? 3 : 2}
                  strokeOpacity={on ? 1 : 0.95} style={{ pointerEvents: 'none' }} />
              </g>
            );
          })}
          {drag && byId[drag.fn] && (() => {
            const [fx, fy] = outPos(byId[drag.fn], drag.fs);
            return <path d={wirePath(fx, fy, drag.x, drag.y)} fill="none" stroke="var(--dcs-accent)"
              strokeWidth="2" strokeDasharray="4 3" strokeOpacity=".8" style={{ pointerEvents: 'none' }} />;
          })()}
        </svg>

        {nodes.map(n => {
          const conn = new Set(wires.filter(w => w.tn === n.id).map(w => w.ts));
          const on = sel && sel.type === 'node' && sel.id === n.id;
          return (
            <div key={n.id}
              onPointerDown={(e) => { e.stopPropagation(); setSel({ type: 'node', id: n.id }); }}
              style={{
                position: 'absolute', left: n.x, top: n.y, width: GRAPH_NODE_W,
                background: 'var(--dcs-bg)',
                border: `1px solid ${on ? 'var(--dcs-accent)' : 'var(--dcs-line)'}`,
                borderRadius: 'var(--dcs-r-2)',
                boxShadow: on ? '0 0 0 1px var(--dcs-accent), var(--dcs-shadow-2)' : 'var(--dcs-shadow-2)',
                fontSize: 11, userSelect: 'none', pointerEvents: 'auto',
              }}>
              <div onPointerDown={dragNode(n.id)} style={{
                height: GRAPH_HEAD, background: n.color, color: '#0a1220',
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
                fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 10,
                cursor: 'grab', borderRadius: 'var(--dcs-r-2) var(--dcs-r-2) 0 0',
              }}>
                <Icon name={n.icon} size="sm" /><span>{n.title}</span>
              </div>
              <div style={{ padding: `${GRAPH_BODY_PAD}px 0` }}>
                {n.ins.map(s => (
                  <div key={s} style={{ height: GRAPH_ROW, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', color: 'var(--dcs-text-dim)' }}>
                    <Socket side="in" filled={conn.has(s)} onPointerDown={startFromInput(n.id, s)} /><span>{s}</span>
                  </div>
                ))}
                {n.outs.map(s => (
                  <div key={s} style={{ height: GRAPH_ROW, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, padding: '0 8px', color: 'var(--dcs-text-dim)' }}>
                    <span>{s}</span><Socket side="out" filled onPointerDown={startConnect(n.id, s)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating toolbar — zoom, fit, add, delete (overlay, doesn't pan). */}
      <Toolbar floating size="sm" style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
        <Button ghost sm icon iconLeft="zoom-out" title="Zoom out" onClick={zoomBtn(1 / 1.2)} />
        <span style={{ fontSize: 10, fontFamily: 'var(--dcs-font-mono)', color: 'var(--dcs-text-mute)', minWidth: 32, textAlign: 'center' }}>{Math.round(view.z * 100)}%</span>
        <Button ghost sm icon iconLeft="zoom-in" title="Zoom in" onClick={zoomBtn(1.2)} />
        <Button ghost sm icon iconLeft="fit" title="Fit to view" onClick={fit} />
        <ToolbarSep />
        <Button ghost sm iconLeft="plus" title="Add node" onClick={addNode}>Node</Button>
        <Button ghost sm icon iconLeft="trash" title="Delete selected" onClick={deleteSel} disabled={!sel} />
      </Toolbar>

      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, fontFamily: 'var(--dcs-font-mono)', color: 'var(--dcs-text-mute)', pointerEvents: 'none' }}>
        click to select · drag header to move · drag sockets to wire · wheel to zoom · ⌫ deletes
      </div>
    </div>
  );
}

function SectionGraph() {
  return (
    <section className="dw-section" id="graph">
      <div className="dw-section__eyebrow">Editors · 03</div>
      <h2>Node graph</h2>
      <p className="dw-section__lead">
        For shader networks, compositors, animation rigs, audio routing. Colored title bars sort by
        kind without an icon legend; accent-color wires keep signal flow legible against the grid.
        Select nodes and edges, drag sockets to connect or detach, add and delete, and zoom or pan
        the canvas — all from the small JS model, no graph library.
      </p>
      <Demo frame="app">
        <Panel title="Shader network · jane_skin.mat" icon="graph" pad={0}>
          <NodeGraph />
        </Panel>
      </Demo>
    </section>
  );
}

/* ─────────── Texture / image picker ─────────── */
function SectionTexture() {
  const [picked, setPicked] = useStateE(2);
  // Generate procedural tile thumbnails so we don't need image assets
  const tiles = [
    { name: 'Concrete_01', kind: 'PBR', res: '4K', gradient: 'linear-gradient(135deg, #7c8492, #4a5161)' },
    { name: 'WoodPlank_F',  kind: 'PBR', res: '2K', gradient: 'repeating-linear-gradient(90deg, #6e4a2a, #6e4a2a 18px, #4e3520 18px, #4e3520 24px)' },
    { name: 'Sky_Studio',   kind: 'HDRI', res: '8K', gradient: 'linear-gradient(180deg, #ffb84d, #f2b14a 40%, #4d9fff 90%)' },
    { name: 'Metal_Brushed',kind: 'PBR', res: '4K', gradient: 'repeating-linear-gradient(135deg, #cfd4dc, #cfd4dc 1px, #aab0bd 1px, #aab0bd 2px)' },
    { name: 'Noise_Perlin', kind: 'PROC', res: '∞',  gradient: 'radial-gradient(circle at 30% 40%, #555d6e, #20232b)' },
    { name: 'Grass_Hi',     kind: 'PBR', res: '2K', gradient: 'linear-gradient(180deg, #4ed18a, #2bb872 60%, #1a6e44)' },
    { name: 'RustyMetal_3', kind: 'PBR', res: '4K', gradient: 'radial-gradient(circle at 60% 40%, #f2b14a, #8a4a1a)' },
    { name: 'Water_Sub',    kind: 'PBR', res: '2K', gradient: 'linear-gradient(180deg, #4ad5d5, #1c5fb0)' },
    { name: 'Marble_Stat',  kind: 'PBR', res: '4K', gradient: 'linear-gradient(45deg, #e7e9ee, #cfd4dc 50%, #aab0bd)' },
    { name: 'Voronoi_Cell', kind: 'PROC', res: '∞', gradient: 'repeating-radial-gradient(circle at 30% 40%, #b48cff, #b48cff 8px, #6f4eea 8px, #6f4eea 16px)' },
    { name: 'Brick_OldRed', kind: 'PBR', res: '2K', gradient: 'repeating-linear-gradient(0deg, #8a3a3a, #8a3a3a 12px, #602727 12px, #602727 18px)' },
    { name: 'Asphalt_Wet',  kind: 'PBR', res: '4K', gradient: 'radial-gradient(ellipse at 50% 60%, #20232b, #14161c)' },
  ];
  return (
    <section className="dw-section" id="textures">
      <div className="dw-section__eyebrow">Editors · 04</div>
      <h2>Texture &amp; image pickers</h2>
      <p className="dw-section__lead">
        A grid browser with kind/resolution badges, a sidebar of categories, and an inspector for
        the active asset. Tiles use a square aspect with a 1px line keyline.
      </p>
      <Demo frame="app" inset>
        <Panel title="Asset browser · /work/intro/textures" icon="texture" pad={0}
               tools={<><Button ghost sm icon iconLeft="search" /><Button ghost sm icon iconLeft="grid" pressed /><Button ghost sm icon iconLeft="menu" /></>}>
          <div style={{ display: 'flex', minHeight: 360 }}>
            <div style={{ width: 160, borderRight: '1px solid var(--dcs-line)', background: 'var(--dcs-surface-1)' }}>
              <div className="dcs-tree" style={{ padding: '6px 0' }}>
                {[
                  { id: 'all', name: 'All assets', icon: 'folder-open', count: 248 },
                  { id: 'pbr', name: 'PBR Surfaces', icon: 'texture', count: 184 },
                  { id: 'hdri', name: 'HDRI', icon: 'globe', count: 12 },
                  { id: 'proc', name: 'Procedural', icon: 'wave-noise', count: 24 },
                  { id: 'fav', name: 'Favorites', icon: 'star', count: 18 },
                  { id: 'recent', name: 'Recent', icon: 'timeline', count: 10 },
                ].map((c, i) => (
                  <div key={c.id} className="dcs-tree__row" aria-selected={i === 0} style={{ '--depth': 0, paddingLeft: 14 }}>
                    <span style={{ width: 14 }} />
                    <Icon name={c.icon} className="dcs-tree__icon" />
                    <span className="dcs-tree__label">{c.name}</span>
                    <span className="dcs-tree__meta">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, alignContent: 'start' }}>
              {tiles.map((t, i) => (
                <div key={t.name} onClick={() => setPicked(i)} style={{
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  border: i === picked ? '1px solid var(--dcs-accent)' : '1px solid transparent',
                  background: i === picked ? 'var(--dcs-accent-dim)' : 'transparent',
                  padding: 4, borderRadius: 4,
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '1',
                    background: t.gradient,
                    border: '1px solid var(--dcs-line)',
                    borderRadius: 2,
                    position: 'relative',
                  }}>
                    <span className="dcs-badge" style={{
                      position: 'absolute', top: 4, left: 4,
                      fontSize: 9, height: 14, padding: '0 4px',
                      background: 'rgba(0,0,0,.5)', borderColor: 'transparent',
                      color: t.kind === 'HDRI' ? 'var(--dcs-warn)' : t.kind === 'PROC' ? 'var(--dcs-purple)' : 'var(--dcs-accent)',
                    }}>{t.kind}</span>
                    <span className="dcs-badge" style={{
                      position: 'absolute', top: 4, right: 4,
                      fontSize: 9, height: 14, padding: '0 4px',
                      background: 'rgba(0,0,0,.5)', borderColor: 'transparent',
                      color: 'var(--dcs-text-dim)',
                    }}>{t.res}</span>
                  </div>
                  <div style={{
                    fontSize: 10, color: i === picked ? 'var(--dcs-text)' : 'var(--dcs-text-dim)',
                    marginTop: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontFamily: 'var(--dcs-font-mono)',
                  }}>{t.name}</div>
                </div>
              ))}
            </div>
            <div style={{ width: 220, borderLeft: '1px solid var(--dcs-line)', background: 'var(--dcs-surface-1)', padding: 12 }}>
              <div style={{
                width: '100%', aspectRatio: '1',
                background: tiles[picked].gradient,
                border: '1px solid var(--dcs-line)', borderRadius: 4, marginBottom: 10,
              }} />
              <div style={{ fontSize: 13, color: 'var(--dcs-text)', marginBottom: 4 }}>{tiles[picked].name}</div>
              <div className="dcs-mono" style={{ fontSize: 10, color: 'var(--dcs-text-mute)', marginBottom: 12 }}>
                <div>{tiles[picked].kind} · {tiles[picked].res} · linear sRGB</div>
                <div>8.4 MB · 4096 × 4096</div>
                <div>last used 2 days ago</div>
              </div>
              <div className="dcs-col" style={{ gap: 6 }}>
                <Button sm primary iconLeft="check" style={{ width: '100%' }}>Use texture</Button>
                <Button sm ghost iconLeft="export" style={{ width: '100%' }}>Reveal in OS</Button>
                <Button sm ghost iconLeft="trash" style={{ width: '100%' }}>Remove</Button>
              </div>
            </div>
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

Object.assign(window, { SectionColorPicker, SectionCurve, SectionGraph, SectionTexture, CurveEditor, NodeGraph, ColorPicker });
