/* dcs.jsx
   React wrappers for decius.css DCC components.
   These render the same class structure shown in the docs code blocks,
   making the live examples and the documented HTML interchangeable.
*/

const { useState, useRef, useEffect, useMemo, useCallback } = React;

// Controlled when an onChange is given; otherwise self-manage state seeded from
// `value` — so docs demos are interactive without per-instance state wiring.
// When uncontrolled we still follow `value` if it changes (e.g. the animated
// hero), but a fixed literal only seeds once, so drags persist.
function useControl(value, onChange) {
  const [internal, setInternal] = useState(value);
  useEffect(() => { if (!onChange) setInternal(value); }, [value, onChange]);
  return onChange ? [value, onChange] : [internal, setInternal];
}

// Outside-click + Esc dismissal, scoped to a wrapper ref.
function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);
}

// Renders the items of a .dcs-menu (icons, shortcuts, checks, danger, separators, submenus).
function MenuList({ items, onPick }) {
  return items.map((it, i) => it.sep ? <div key={i} className="dcs-menu__sep" /> : (
    <div
      key={i}
      className={`dcs-menu__item${it.danger ? ' dcs-menu__item--danger' : ''}${it.sub ? ' dcs-menu__item--has-sub' : ''}`}
      onClick={(e) => { if (it.sub) { e.stopPropagation(); return; } onPick && onPick(it.label); }}
    >
      {it.check
        ? <span className="dcs-menu__check"><Icon name="check" size="sm" /></span>
        : <span className="dcs-menu__icon">{it.icon && <Icon name={it.icon} size="sm" />}</span>}
      <span className="dcs-menu__label-text">{it.label}</span>
      {it.shortcut && <span className="dcs-menu__shortcut">{it.shortcut}</span>}
      {it.sub && <span className="dcs-menu__caret"><Icon name="chevron-right" size="sm" /></span>}
      {it.sub && <div className="dcs-menu dcs-menu__sub"><MenuList items={it.sub} onPick={onPick} /></div>}
    </div>
  ));
}

// Drag-resize seam. Calls onDelta(px) incrementally while dragging.
function Splitter({ horizontal, onDelta }) {
  const [active, setActive] = useState(false);
  const onDown = (e) => {
    e.preventDefault();
    setActive(true);
    const axis = horizontal ? 'clientY' : 'clientX';
    let last = e[axis];
    const move = (ev) => { const d = ev[axis] - last; last = ev[axis]; if (d) onDelta(d); };
    const up = () => { setActive(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return <div className={`dcs-splitter${horizontal ? ' dcs-splitter--h' : ''}${active ? ' dcs-splitter--active' : ''}`} onPointerDown={onDown} />;
}

/* ─────────── Docking layout (real grab-and-dock) ───────────
   Binary-tree layout of split/tabs nodes. Tabs drag between groups; dropping
   on a group's center adds a tab, dropping on an edge splits that group
   (left/right → row, top/bottom → column). Splitters resize. */
let DOCK_ID = 0;
function normLayout(node) {
  const id = `dk${++DOCK_ID}`;
  if (node.type === 'tabs') return { type: 'tabs', id, tabs: [...node.tabs], active: node.active || node.tabs[0] };
  return { type: 'split', id, dir: node.dir, sizes: node.sizes ? [...node.sizes] : node.children.map(() => 1), children: node.children.map(normLayout) };
}
function setActiveInTree(node, gid, tab) {
  if (node.type === 'tabs') return node.id === gid ? { ...node, active: tab } : node;
  return { ...node, children: node.children.map(c => setActiveInTree(c, gid, tab)) };
}
function removeTabFromTree(node, tab) {
  if (node.type === 'tabs') {
    if (!node.tabs.includes(tab)) return node;
    const tabs = node.tabs.filter(t => t !== tab);
    if (!tabs.length) return null;
    return { ...node, tabs, active: node.active === tab ? tabs[0] : node.active };
  }
  const kids = [], sizes = [];
  node.children.forEach((c, i) => { const r = removeTabFromTree(c, tab); if (r !== null) { kids.push(r); sizes.push(node.sizes[i]); } });
  if (kids.length === 0) return null;
  if (kids.length === 1) return kids[0];
  return { ...node, children: kids, sizes };
}
function addTabToTree(node, gid, tab, zone) {
  if (node.type === 'tabs') {
    if (node.id !== gid) return node;
    if (zone === 'center') return { ...node, tabs: [...node.tabs, tab], active: tab };
    const leaf = normLayout({ type: 'tabs', tabs: [tab] });
    const dir = (zone === 'left' || zone === 'right') ? 'row' : 'col';
    const before = zone === 'left' || zone === 'top';
    return { type: 'split', id: `dk${++DOCK_ID}`, dir, sizes: [1, 1], children: before ? [leaf, node] : [node, leaf] };
  }
  return { ...node, children: node.children.map(c => addTabToTree(c, gid, tab, zone)) };
}
// Dock a panel against the whole workspace edge (root-level full-span split).
function addRootEdge(tree, tab, zone) {
  const leaf = normLayout({ type: 'tabs', tabs: [tab] });
  const dir = (zone === 'left' || zone === 'right') ? 'row' : 'col';
  const before = zone === 'left' || zone === 'top';
  return { type: 'split', id: `dk${++DOCK_ID}`, dir, sizes: before ? [1, 3] : [3, 1], children: before ? [leaf, tree] : [tree, leaf] };
}
function resizeSplit(node, splitId, i, dpx, total) {
  if (node.type !== 'split') return node;
  if (node.id === splitId) {
    const sizes = [...node.sizes];
    const sum = sizes.reduce((a, b) => a + b, 0);
    const dw = dpx * (sum / Math.max(1, total));
    const min = sum * 0.07;
    let a = sizes[i] + dw, b = sizes[i + 1] - dw;
    if (a < min) { b -= (min - a); a = min; }
    if (b < min) { a -= (min - b); b = min; }
    sizes[i] = a; sizes[i + 1] = b;
    return { ...node, sizes };
  }
  return { ...node, children: node.children.map(c => resizeSplit(c, splitId, i, dpx, total)) };
}
function dockZone(e, rect) {
  const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
  const m = 0.3;
  if (y < m && y <= x && y <= 1 - x) return 'top';
  if (y > 1 - m && (1 - y) <= x && (1 - y) <= 1 - x) return 'bottom';
  if (x < m) return 'left';
  if (x > 1 - m) return 'right';
  return 'center';
}
const ZONE_BOX = {
  center: { inset: 6 },
  left: { left: 0, top: 0, bottom: 0, width: '50%' },
  right: { right: 0, top: 0, bottom: 0, width: '50%' },
  top: { left: 0, right: 0, top: 0, height: '50%' },
  bottom: { left: 0, right: 0, bottom: 0, height: '50%' },
};
// Root-edge docking is detected inside each group's own dragover when the
// cursor is within EDGE_M of a workspace edge that the group touches — no
// overlay bands, so nothing ever covers a group's tab strip mid-drag.
const EDGE_M = 16;
const ROOT_PREVIEW = {
  left: { left: 0, top: 0, bottom: 0, width: '28%' },
  right: { right: 0, top: 0, bottom: 0, width: '28%' },
  top: { left: 0, right: 0, top: 0, height: '28%' },
  bottom: { left: 0, right: 0, bottom: 0, height: '28%' },
};

// Top-level so re-renders (e.g. 24fps animation) don't remount the subtree.
function DockGroup({ node, ctx }) {
  const ref = useRef(null);
  const onOver = (e) => {
    if (!ctx.drag.current) return;
    e.preventDefault();
    const gr = ref.current.getBoundingClientRect();
    const dr = ctx.dockRef.current.getBoundingClientRect();
    // Near a workspace edge this group sits against → root (full-span) dock.
    let root = null;
    if (e.clientY - dr.top < EDGE_M && gr.top - dr.top < 2) root = 'top';
    else if (dr.bottom - e.clientY < EDGE_M && dr.bottom - gr.bottom < 2) root = 'bottom';
    else if (e.clientX - dr.left < EDGE_M && gr.left - dr.left < 2) root = 'left';
    else if (dr.right - e.clientX < EDGE_M && dr.right - gr.right < 2) root = 'right';
    if (root) { if (ctx.edge !== root) ctx.setEdge(root); if (ctx.hover) ctx.setHover(null); }
    else { if (ctx.edge) ctx.setEdge(null); ctx.setHover({ gid: node.id, zone: dockZone(e, gr) }); }
  };
  return (
    <div className="dcs-dockpane" ref={ref}
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      onDragOver={onOver}
      onDrop={(e) => { e.preventDefault(); if (ctx.edge) ctx.onRootDrop(ctx.edge); else ctx.onDrop(node.id); }}>
      <div className="dcs-dockpane__tabs">
        {node.tabs.map(tab => (
          <div key={tab} className="dcs-dockpane__tab" aria-selected={node.active === tab}
            draggable
            onDragStart={(e) => { ctx.drag.current = { tab, fromId: node.id, count: node.tabs.length }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', tab); }}
            onDragEnd={() => { ctx.drag.current = null; ctx.setHover(null); ctx.setEdge(null); }}
            onClick={() => ctx.activate(node.id, tab)}>
            {ctx.tabMeta(tab).icon && <Icon name={ctx.tabMeta(tab).icon} size="sm" />}
            <span>{ctx.tabMeta(tab).label}</span>
            <div className="dcs-dockpane__tab-close" onClick={(e) => { e.stopPropagation(); ctx.closeTab(tab); }}><Icon name="close" size="sm" /></div>
          </div>
        ))}
      </div>
      <div className="dcs-dockpane__body" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {ctx.renderContent(node.active)}
      </div>
      {ctx.hover && ctx.hover.gid === node.id && !ctx.edge && (
        <div style={{ position: 'absolute', background: 'var(--dcs-accent-haze)', border: '1px solid var(--dcs-accent)', borderRadius: 3, pointerEvents: 'none', zIndex: 6, transition: 'all 90ms ease', ...ZONE_BOX[ctx.hover.zone] }} />
      )}
    </div>
  );
}
function DockNode({ node, ctx }) {
  const ref = useRef(null);
  if (node.type === 'tabs') return <DockGroup node={node} ctx={ctx} />;
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: node.dir === 'row' ? 'row' : 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
      {node.children.map((c, i) => (
        <React.Fragment key={c.id}>
          <div style={{ flex: `${node.sizes[i]} 1 0`, display: 'flex', minWidth: 0, minHeight: 0 }}><DockNode node={c} ctx={ctx} /></div>
          {i < node.children.length - 1 && (
            <Splitter horizontal={node.dir === 'col'} onDelta={(d) => {
              const el = ref.current;
              ctx.resize(node.id, i, d, node.dir === 'row' ? el.clientWidth : el.clientHeight);
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
function DockLayout({ initial, tabMeta, renderContent }) {
  const [root, setRoot] = useState(() => normLayout(initial));
  const [hover, setHover] = useState(null);     // inner: { gid, zone }
  const [edge, setEdge] = useState(null);       // outer root edge being hovered
  const drag = useRef(null);
  const dockRef = useRef(null);
  const ctx = {
    drag, hover, setHover, edge, setEdge, dockRef, tabMeta, renderContent,
    activate: (gid, tab) => setRoot(r => setActiveInTree(r, gid, tab)),
    closeTab: (tab) => setRoot(r => removeTabFromTree(r, tab) || r),
    resize: (id, i, d, total) => setRoot(r => resizeSplit(r, id, i, d, total)),
    onDrop: (gid) => {
      const d = drag.current, h = hover;
      drag.current = null; setHover(null); setEdge(null);
      if (!d || !h || h.gid !== gid) return;
      if (d.fromId === gid && (h.zone === 'center' || d.count <= 1)) return;
      const t = removeTabFromTree(root, d.tab);
      if (t) setRoot(addTabToTree(t, gid, d.tab, h.zone));
    },
    onRootDrop: (zone) => {
      const d = drag.current;
      drag.current = null; setEdge(null); setHover(null);
      if (!d) return;
      const t = removeTabFromTree(root, d.tab);
      if (t) setRoot(addRootEdge(t, d.tab, zone));
    },
  };
  return (
    <div className="dcs-dock" ref={dockRef} style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0 }}>
      <DockNode node={root} ctx={ctx} />
      {/* Root-edge preview — full-span dock against the workspace edge.
          pointer-events:none so it never blocks tab strips or drop targets. */}
      {edge && (
        <div style={{ position: 'absolute', pointerEvents: 'none', zIndex: 7, background: 'var(--dcs-accent-haze)', border: '2px solid var(--dcs-accent)', borderRadius: 4, transition: 'all 90ms ease', ...ROOT_PREVIEW[edge] }} />
      )}
    </div>
  );
}

/* ─────────── Panel ─────────── */
function Panel({ title, icon, tools, footer, raised, flat, bordered, closeable, onClose, headerActive, pad, children, style, className = '' }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div className={`dcs-panel${raised ? ' dcs-panel--raised' : ''}${bordered ? ' dcs-panel--bordered' : ''} ${className}`} style={style}>
      {title !== undefined && (
        <div className={`dcs-panel__header${headerActive ? ' dcs-panel__header--active' : ''}`}>
          <div className="dcs-panel__title">
            {icon && <Icon name={icon} />}
            <span>{title}</span>
          </div>
          {tools && <div className="dcs-panel__tools">{tools}</div>}
          {closeable && (
            <button
              className="dcs-panel__close"
              onClick={() => { if (onClose) onClose(); else setClosed(true); }}
              aria-label="Close panel"
            >
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>
      )}
      <div className={`dcs-panel__body${pad === 0 ? ' dcs-panel__body--pad-0' : pad === 'sm' ? ' dcs-panel__body--pad-sm' : ''}`}>
        {children}
      </div>
      {footer && <div className="dcs-panel__footer">{footer}</div>}
    </div>
  );
}

/* ─────────── Button ─────────── */
function Button({ children, primary, ghost, danger, sm, lg, icon, iconLeft, iconRight, pressed, onClick, disabled, className = '', ...rest }) {
  const cls = [
    'dcs-btn',
    primary && 'dcs-btn--primary',
    ghost && 'dcs-btn--ghost',
    danger && 'dcs-btn--danger',
    sm && 'dcs-btn--sm',
    lg && 'dcs-btn--lg',
    icon && 'dcs-btn--icon',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button
      className={cls}
      aria-pressed={pressed !== undefined ? pressed : undefined}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {iconLeft && <Icon name={iconLeft} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}

function ButtonGroup({ value, onChange, options }) {
  const [cur, set] = useControl(value, onChange);
  return (
    <div className="dcs-btn-group" role="group">
      {options.map(opt => (
        <button
          key={opt.value}
          className="dcs-btn"
          aria-pressed={cur === opt.value}
          onClick={() => set(opt.value)}
        >
          {opt.icon && <Icon name={opt.icon} />}
          {opt.label && <span>{opt.label}</span>}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Drag helper ─────────── */
function useDrag(onDrag, opts = {}) {
  const ref = useRef({ active: false, startX: 0, startY: 0, startVal: 0 });
  return useCallback((e, startVal) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    ref.current = { active: true, startX, startY, startVal };
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onDrag({ dx, dy, startVal, shift: ev.shiftKey, ctrl: ev.ctrlKey || ev.metaKey });
    };
    const up = () => {
      ref.current.active = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (opts.onEnd) opts.onEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [onDrag, opts.onEnd]);
}

/* ─────────── Slider (DCC horizontal) ─────────── */
function Slider({ value, onChange, min = 0, max = 1, step = 0, bipolar, width, ticks }) {
  const [cur, set] = useControl(value, onChange);
  const trackRef = useRef(null);
  const v = Math.max(min, Math.min(max, cur));
  const pct = ((v - min) / (max - min)) * 100;
  const handleDown = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const update = (clientX) => {
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let nv = min + t * (max - min);
      if (step) nv = Math.round(nv / step) * step;
      set(nv);
    };
    update(e.clientX);
    const move = ev => update(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  let fillStyle;
  if (bipolar) {
    const center = ((-min) / (max - min)) * 100;
    if (v >= 0) fillStyle = { left: `${center}%`, width: `${pct - center}%` };
    else fillStyle = { right: `${100 - center}%`, left: 'auto', width: `${center - pct}%` };
  } else {
    fillStyle = { width: `${pct}%` };
  }
  return (
    <div className="dcs-slider" style={{ width: width || '100%' }} onPointerDown={handleDown}>
      <div className="dcs-slider__track" ref={trackRef}>
        <div className="dcs-slider__fill" style={fillStyle} />
        {ticks && ticks.map((t, i) => {
          const left = ((t - min) / (max - min)) * 100;
          return <div key={i} className="dcs-slider__tick" style={{ left: `${left}%` }} />;
        })}
        <div className="dcs-slider__thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─────────── Fader (vertical, synth) ─────────── */
function Fader({ value, onChange, min = 0, max = 1, height = 140, label }) {
  const [cur, set] = useControl(value, onChange);
  const trackRef = useRef(null);
  const v = Math.max(min, Math.min(max, cur));
  const pct = 100 - ((v - min) / (max - min)) * 100;
  const handleDown = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const update = (clientY) => {
      const t = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      set(min + (1 - t) * (max - min));
    };
    update(e.clientY);
    const move = ev => update(ev.clientY);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="dcs-fader" style={{ height }} ref={trackRef} onPointerDown={handleDown}>
      <div className="dcs-fader__track" />
      {[0.25, 0.5, 0.75].map(t => <div key={t} className="dcs-fader__tick" style={{ top: `${t * 100}%` }} />)}
      <div className="dcs-fader__thumb" style={{ top: `${pct}%` }} />
    </div>
  );
}

/* ─────────── Knob ─────────── */
function Knob({ value, onChange, min = 0, max = 1, size = 56, label, bipolar, format }) {
  const [cur, set] = useControl(value, onChange);
  const v = Math.max(min, Math.min(max, cur));
  const norm = (v - min) / (max - min);
  // Angle range: -135° to +135°
  const angle = -135 + norm * 270;
  const arcAngle = norm * 270;
  const startAngle = bipolar ? 0 : -135;
  const sweepDeg = bipolar ? (norm - 0.5) * 270 : arcAngle;

  const handleDown = (e) => {
    const startY = e.clientY;
    const startVal = v;
    const range = max - min;
    const move = (ev) => {
      const dy = startY - ev.clientY;
      const scale = ev.shiftKey ? 400 : 150;
      const delta = (dy / scale) * range;
      set(Math.max(min, Math.min(max, startVal + delta)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Arc track
  const cx = 12, cy = 12, r = 10.5;
  const arcStart = bipolar ? -90 : -225;
  const arcEnd = bipolar ? -90 + sweepDeg : -225 + arcAngle;
  const polar = (ang) => [cx + r * Math.cos(ang * Math.PI / 180), cy + r * Math.sin(ang * Math.PI / 180)];
  const [sx, sy] = polar(arcStart);
  const [ex, ey] = polar(arcEnd);
  const arcLen = Math.abs(arcEnd - arcStart);
  const largeArc = arcLen > 180 ? 1 : 0;
  const sweep = arcEnd >= arcStart ? 1 : 0;

  // Track ring (full sweep)
  const [tsx, tsy] = polar(-225);
  const [tex, tey] = polar(45);

  const formatted = format ? format(v) : v.toFixed(2);
  return (
    <div className="dcs-knob" style={{ '--knob-size': `${size}px` }} onPointerDown={handleDown}>
      <svg className="dcs-knob__ring" viewBox="0 0 24 24">
        <path d={`M ${tsx} ${tsy} A ${r} ${r} 0 1 1 ${tex} ${tey}`} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeLinecap="round" />
        {Math.abs(sweepDeg) > 0.5 && (
          <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`}
                fill="none" stroke="var(--dcs-accent)" strokeWidth="1.75" strokeLinecap="round" />
        )}
      </svg>
      <div className="dcs-knob__cap" />
      <div className="dcs-knob__indicator" style={{ '--angle': `${angle}deg` }} />
      {label && <div className="dcs-knob__label">{label}</div>}
      {label && <div className="dcs-knob__value">{formatted}</div>}
    </div>
  );
}

/* ─────────── Combo (ZBrush-style number/slider) ─────────── */
function Combo({ value, onChange, min = 0, max = 1, step = 0.01, label, format, width = 140, sm, lg }) {
  const [cur, set] = useControl(value, onChange);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const v = Math.max(min, Math.min(max, cur));
  const pct = ((v - min) / (max - min)) * 100;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDown = (e) => {
    if (editing) return;
    if (e.target.classList.contains('dcs-combo__btn')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    let dragged = false;
    const range = max - min;
    const startVal = v;
    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 3) dragged = true;
      const scale = ev.shiftKey ? 4 : 1;
      const delta = (dx / rect.width) * range * scale;
      let nv = Math.max(min, Math.min(max, startVal + delta));
      if (step) nv = Math.round(nv / step) * step;
      set(nv);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!dragged) {
        setDraft(format ? format(v) : v.toString());
        setEditing(true);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed)) set(Math.max(min, Math.min(max, parsed)));
    setEditing(false);
  };

  const cls = ['dcs-combo', editing && 'dcs-combo--editing', sm && 'dcs-combo--sm', lg && 'dcs-combo--lg'].filter(Boolean).join(' ');
  return (
    <div ref={containerRef}
         className={cls}
         style={{ width, '--fill': `${pct}%` }}
         onPointerDown={handleDown}>
      <div className="dcs-combo__fill" />
      <div className="dcs-combo__btn" onPointerDown={(e) => { e.stopPropagation(); set(Math.max(min, v - (step || 0.01))); }}>
        <Icon name="chevron-left" size="sm" />
      </div>
      {label && <div className="dcs-combo__label">{label}</div>}
      <div className="dcs-combo__value">{format ? format(v) : v.toFixed(2)}</div>
      <div className="dcs-combo__btn" onPointerDown={(e) => { e.stopPropagation(); set(Math.min(max, v + (step || 0.01))); }}>
        <Icon name="chevron-right" size="sm" />
      </div>
      {editing && (
        <input
          ref={inputRef}
          className="dcs-combo__edit"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') setEditing(false);
          }}
        />
      )}
    </div>
  );
}

/* ─────────── Check / Radio / Switch ─────────── */
function Check({ checked, onChange, children, radio }) {
  const [cur, set] = useControl(checked, onChange);
  return (
    <div className={`dcs-check${radio ? ' dcs-radio' : ''}`} role={radio ? 'radio' : 'checkbox'} aria-checked={cur} onClick={() => set(!cur)}>
      <div className="dcs-check__box">
        {!radio && cur && <Icon name="check" />}
      </div>
      {children != null && children !== '' && <span>{children}</span>}
    </div>
  );
}

function Switch({ checked, onChange }) {
  const [cur, set] = useControl(checked, onChange);
  return <div className="dcs-switch" role="switch" aria-checked={cur} onClick={() => set(!cur)} />;
}

/* ─────────── Tab bar ─────────── */
function Tabs({ tabs, value, onChange }) {
  const [cur, set] = useControl(value, onChange);
  return (
    <div className="dcs-tabs" role="tablist">
      {tabs.map(t => (
        <button key={t.value}
                className="dcs-tab"
                role="tab"
                aria-selected={cur === t.value}
                onClick={() => set(t.value)}>
          {t.icon && <Icon name={t.icon} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Toolbar ─────────── */
function Toolbar({ children, vertical, size, floating, className = '', style }) {
  const cls = [
    'dcs-toolbar',
    vertical && 'dcs-toolbar--v',
    size && `dcs-toolbar--${size}`,
    floating && 'dcs-toolbar--floating',
    className,
  ].filter(Boolean).join(' ');
  return <div className={cls} style={style}>{children}</div>;
}
function ToolbarSep() { return <div className="dcs-toolbar__sep" />; }

/* ─────────── Tree ─────────── */
function Tree({ nodes, selected, onSelect, expanded, onExpand }) {
  const [iExp, setIExp] = useState(() => expanded || new Set());
  const [iSel, setISel] = useState(selected);
  const exp = onExpand ? expanded : iExp;
  const sel = onSelect ? selected : iSel;
  const select = onSelect || setISel;
  const toggle = onExpand || ((id) => setIExp(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  }));
  const rows = [];
  const walk = (items, depth) => {
    items.forEach(node => {
      const isOpen = exp.has(node.id);
      const hasChildren = node.children && node.children.length;
      rows.push(
        <div
          key={node.id}
          className="dcs-tree__row"
          style={{ '--depth': depth }}
          aria-selected={sel === node.id}
          onClick={() => {
            select(node.id);
            if (hasChildren) toggle(node.id);
          }}
        >
          <div
            className={`dcs-tree__chevron${isOpen ? ' dcs-tree__chevron--open' : ''}`}
            onClick={(e) => { e.stopPropagation(); if (hasChildren) toggle(node.id); }}
          >
            {hasChildren && <Icon name="chevron-right" size="sm" />}
          </div>
          {node.icon && <Icon className="dcs-tree__icon" name={node.icon} />}
          <span className="dcs-tree__label">{node.label}</span>
          {node.meta && <span className="dcs-tree__meta">{node.meta}</span>}
          {node.actions && <div className="dcs-tree__actions">{node.actions}</div>}
        </div>
      );
      if (hasChildren && isOpen) walk(node.children, depth + 1);
    });
  };
  walk(nodes, 0);
  return <div className="dcs-tree">{rows}</div>;
}

/* ─────────── Color swatch / picker (simple) ─────────── */
function Swatch({ color, label }) {
  return (
    <div className="dcs-swatch">
      <div className="dcs-swatch__chip" style={{ '--c': color }} />
      <span>{label || color}</span>
    </div>
  );
}

/* ─────────── Foldout — Blender-style soft section ─────────── */
function Foldout({ title, icon, meta, tools, defaultOpen = true, children, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`dcs-foldout${!open ? ' dcs-foldout--collapsed' : ''}${accent ? ' dcs-foldout--accent' : ''}`}>
      <div className="dcs-foldout__header" onClick={() => setOpen(o => !o)}>
        <div className={`dcs-foldout__chevron${open ? ' dcs-foldout__chevron--open' : ''}`}>
          <Icon name="chevron-right" size="sm" />
        </div>
        {icon && <Icon className="dcs-foldout__icon" name={icon} size="sm" />}
        <div className="dcs-foldout__title">{title}</div>
        {meta && <div className="dcs-foldout__meta">{meta}</div>}
        {tools && <div className="dcs-foldout__tools" onClick={(e) => e.stopPropagation()}>{tools}</div>}
      </div>
      <div className="dcs-foldout__body">{children}</div>
    </div>
  );
}

function Foldouts({ children, style }) {
  return <div className="dcs-foldouts" style={style}>{children}</div>;
}

/* ─────────── SubPanel ─────────── */
function SubPanel({ title, icon, onClose, defaultOpen = true, children, tools }) {
  const [open, setOpen] = useState(defaultOpen);
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div className={`dcs-subpanel${!open ? ' dcs-subpanel--collapsed' : ''}`}>
      <div className="dcs-subpanel__header" onClick={() => setOpen(o => !o)}>
        <div className={`dcs-subpanel__chevron${open ? ' dcs-subpanel__chevron--open' : ''}`}>
          <Icon name="chevron-right" size="sm" />
        </div>
        {icon && <Icon name={icon} size="sm" style={{ width: 12, height: 12 }} />}
        <div className="dcs-subpanel__title">{title}</div>
        {tools && <div onClick={(e) => e.stopPropagation()}>{tools}</div>}
        <div className="dcs-subpanel__close" onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); else setClosed(true); }}>
          <Icon name="close" size="sm" />
        </div>
      </div>
      <div className="dcs-subpanel__body">{children}</div>
    </div>
  );
}

/* ─────────── DockPane — tabbed dockable view ─────────── */
function DockPane({ tabs, value, onChange, onClose, tools, children }) {
  const [closed, setClosed] = useState(new Set());
  const visible = tabs.filter(t => !closed.has(t.value));
  if (!visible.length) return null;
  return (
    <div className="dcs-dockpane">
      <div className="dcs-dockpane__tabs">
        {visible.map(t => (
          <div
            key={t.value}
            className="dcs-dockpane__tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
          >
            {t.icon && <Icon name={t.icon} size="sm" />}
            <span>{t.label}</span>
            {(t.closeable !== false) && (
              <div
                className="dcs-dockpane__tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) onClose(t.value);
                  else {
                    const n = new Set(closed); n.add(t.value); setClosed(n);
                    if (value === t.value && visible.length > 1) {
                      const next = visible.find(x => x.value !== t.value);
                      if (next) onChange(next.value);
                    }
                  }
                }}
              >
                <Icon name="close" size="sm" />
              </div>
            )}
          </div>
        ))}
        {tools && <div className="dcs-dockpane__tools">{tools}</div>}
      </div>
      <div className="dcs-dockpane__body">{children}</div>
    </div>
  );
}

/* ─────────── MenuBar ─────────── */
function MenuBar({ brand, items, menus, meta, onPick }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useDismiss(ref, open !== null, () => setOpen(null));
  return (
    <div className="dcs-menubar" ref={ref}>
      {brand && (
        <div className="dcs-menubar__brand">
          {brand.icon && <Icon name={brand.icon} />}
          <span>{brand.label}</span>
        </div>
      )}
      {items && items.map(m => {
        const def = menus && menus[m];
        return (
          <div key={m} style={{ position: 'relative', display: 'flex' }}>
            <button
              className="dcs-menubar__item"
              aria-expanded={open === m}
              style={open === m ? { background: 'var(--dcs-surface-2)', color: 'var(--dcs-text)' } : null}
              onClick={() => def && setOpen(o => (o === m ? null : m))}
              onMouseEnter={() => def && setOpen(o => (o !== null ? m : o))}
            >{m}</button>
            {def && open === m && (
              <div className="dcs-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 1 }}>
                <MenuList items={def} onPick={(v) => { onPick && onPick(m, v); setOpen(null); }} />
              </div>
            )}
          </div>
        );
      })}
      <div className="dcs-menubar__spacer" />
      {meta && <div className="dcs-menubar__meta">{meta}</div>}
    </div>
  );
}

/* ─────────── Card ─────────── */
function Card({
  title, meta, desc, media, badges, footer, tools, closeable, onClose,
  selected, onClick, horizontal, className = '', style, children,
}) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  const cls = [
    'dcs-card',
    horizontal && 'dcs-card--horizontal',
    onClick && 'dcs-card--clickable',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div
      className={cls}
      aria-selected={selected || undefined}
      onClick={onClick}
      style={style}
    >
      {badges && <div className="dcs-card__badges">{badges}</div>}
      {closeable && (
        <div
          className="dcs-card__close"
          onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); else setClosed(true); }}
        >
          <Icon name="close" />
        </div>
      )}
      {media && <div className="dcs-card__media">{media}</div>}
      {(title || meta || desc || children) && (
        <div className="dcs-card__body">
          {title && <div className="dcs-card__title">{title}</div>}
          {meta && <div className="dcs-card__meta">{meta}</div>}
          {desc && <div className="dcs-card__desc">{desc}</div>}
          {children}
        </div>
      )}
      {tools && <div className="dcs-card__tools">{tools}</div>}
      {footer && <div className="dcs-card__footer">{footer}</div>}
    </div>
  );
}

function CardGrid({ children, style }) {
  return <div className="dcs-card-grid" style={style}>{children}</div>;
}
function CardList({ children, style }) {
  return <div className="dcs-card-list" style={style}>{children}</div>;
}

Object.assign(window, {
  Panel, SubPanel, Foldout, Foldouts, Button, ButtonGroup, Slider, Fader, Knob, Combo,
  Check, Switch, Tabs, Toolbar, ToolbarSep, Tree, Swatch, DockPane, MenuBar,
  Card, CardGrid, CardList,
  useDismiss, MenuList, Splitter, DockLayout,
});
