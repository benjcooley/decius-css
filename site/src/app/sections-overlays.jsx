/* sections-overlays.jsx — new components (menus, popovers, toasts) and the
   vanilla decius.js runtime docs. Demos use the real framework classes. */
const { useState: useStateO, useRef: useRefO, useEffect: useEffectO } = React;
// useDismiss + MenuList now live in dcs.jsx (shared with MenuBar/DockLayout).

/* ─────────── Menus ─────────── */
const MENUS = {
  File: [
    { label: 'New', icon: 'file', shortcut: '⌘N' },
    { label: 'Open…', icon: 'folder-open', shortcut: '⌘O' },
    { sep: true },
    { label: 'Export As', icon: 'export', sub: [{ label: 'PNG' }, { label: 'EXR' }, { label: 'glTF' }, { label: 'USD' }] },
    { sep: true },
    { label: 'Delete', icon: 'trash', danger: true },
  ],
  Edit: [
    { label: 'Undo', icon: 'undo', shortcut: '⌘Z' },
    { label: 'Redo', icon: 'redo', shortcut: '⇧⌘Z' },
    { sep: true },
    { label: 'Cut', icon: 'cut' }, { label: 'Copy', icon: 'copy' }, { label: 'Paste', icon: 'paste' },
  ],
  View: [
    { label: 'Wireframe', check: true }, { label: 'Grid', check: true }, { label: 'Gizmos' },
    { sep: true },
    { label: 'Fullscreen', icon: 'fullscreen', shortcut: 'F11' },
  ],
  Help: [{ label: 'Documentation', icon: 'help' }, { label: 'About decius', icon: 'info' }],
};

function MenuBarDemo({ onPick }) {
  const [open, setOpen] = useStateO(null);
  const ref = useRefO(null);
  useDismiss(ref, open !== null, () => setOpen(null));
  return (
    <div className="dcs-menubar" ref={ref}>
      <div className="dcs-menubar__brand"><Icon name="decius" /> <span>modeler</span></div>
      {Object.keys(MENUS).map(name => (
        <div key={name} style={{ position: 'relative', display: 'flex' }}>
          <button
            className="dcs-menubar__item"
            style={open === name ? { background: 'var(--dcs-surface-2)', color: 'var(--dcs-text)' } : null}
            onClick={() => setOpen(o => (o === name ? null : name))}
            onMouseEnter={() => setOpen(o => (o !== null ? name : o))}
          >{name}</button>
          {open === name && (
            <div className="dcs-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 2 }}>
              <MenuList items={MENUS[name]} onPick={(v) => { onPick(v); setOpen(null); }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DropdownDemo({ onPick }) {
  const [open, setOpen] = useStateO(false);
  const ref = useRefO(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <Button primary iconLeft="cog" onClick={() => setOpen(o => !o)}>Options <Icon name="chevron-down" size="sm" /></Button>
      {open && (
        <div className="dcs-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4 }}>
          <MenuList items={MENUS.View} onPick={(v) => { onPick(v); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function ContextMenuDemo({ onPick }) {
  const [pos, setPos] = useStateO(null);
  const ref = useRefO(null);
  useDismiss(ref, pos !== null, () => setPos(null));
  const items = [
    { label: 'Cut', icon: 'cut' }, { label: 'Copy', icon: 'copy' }, { label: 'Paste', icon: 'paste' },
    { sep: true }, { label: 'Rename', icon: 'edit' }, { label: 'Delete', icon: 'trash', danger: true },
  ];
  return (
    <>
      <div
        className="dcs-well"
        onContextMenu={(e) => { e.preventDefault(); setPos({ x: e.clientX, y: e.clientY }); }}
        style={{ flex: 1, minWidth: 180, padding: 18, borderRadius: 5, textAlign: 'center', color: 'var(--dcs-text-mute)', cursor: 'context-menu' }}
      >
        right-click here
      </div>
      {pos && (
        <div ref={ref} className="dcs-menu" style={{ position: 'fixed', top: pos.y, left: pos.x, zIndex: 9999 }}>
          <MenuList items={items} onPick={(v) => { onPick(v); setPos(null); }} />
        </div>
      )}
    </>
  );
}

function SectionMenus() {
  const [last, setLast] = useStateO('—');
  return (
    <section className="dw-section" id="menus">
      <div className="dw-section__eyebrow">Overlays · 01</div>
      <h2>Menus &amp; dropdowns</h2>
      <p className="dw-section__lead">
        Floating command menus for menubars, buttons, and right-click. Items take icons, shortcuts,
        checks, danger styling, separators, and nested submenus (hover <em>Export As</em>). All live:
      </p>
      <Demo frame="app" caption="menu bar · dropdown button · right-click context menu">
        <div className="dcs-col" style={{ gap: 0 }}>
          <MenuBarDemo onPick={setLast} />
          <div className="dcs-row" style={{ gap: 16, alignItems: 'flex-start', padding: 16 }}>
            <DropdownDemo onPick={setLast} />
            <ContextMenuDemo onPick={setLast} />
          </div>
          <div style={{ padding: '0 16px 14px', fontSize: 12, fontFamily: 'var(--dcs-font-mono)', color: 'var(--dcs-text-mute)' }}>
            last action: <span style={{ color: 'var(--dcs-accent)' }}>{last}</span>
          </div>
        </div>
      </Demo>
      <CodeBlock lang="html" code={`<button class="dcs-btn" data-dcs-toggle="menu" data-dcs-target="#file-menu">File</button>
<div class="dcs-menu" id="file-menu">
  <div class="dcs-menu__item" data-dcs-value="new">
    <span class="dcs-menu__icon"><i class="di di-file"></i></span>
    <span class="dcs-menu__label-text">New</span><span class="dcs-menu__shortcut">⌘N</span>
  </div>
  <div class="dcs-menu__item dcs-menu__item--has-sub">Export As
    <div class="dcs-menu dcs-menu__sub"><div class="dcs-menu__item">PNG</div></div>
  </div>
</div>
<div data-dcs-menu="#file-menu">right-click me</div>   <!-- context menu -->`} />
    </section>
  );
}

/* ─────────── Popovers ─────────── */
function PopoverDemo({ placement = 'bottom', label }) {
  const [open, setOpen] = useStateO(false);
  const [opacity, setOpacity] = useStateO(0.8);
  const ref = useRefO(null);
  useDismiss(ref, open, () => setOpen(false));
  const top = placement === 'bottom';
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <Button primary={open} iconLeft="info" onClick={() => setOpen(o => !o)}>{label}</Button>
      {open && (
        <div className="dcs-popover" data-dcs-pos={placement}
             style={{ position: 'absolute', left: 0, width: 240, [top ? 'top' : 'bottom']: '100%', [top ? 'marginTop' : 'marginBottom']: 10 }}>
          <div className="dcs-popover__arrow" style={{ [top ? 'top' : 'bottom']: -6, left: 20 }} />
          <div className="dcs-popover__header">Layer settings<span style={{ flex: 1 }} />
            <span className="dcs-toast__close" onClick={() => setOpen(false)}><Icon name="close" size="sm" /></span>
          </div>
          <div className="dcs-popover__body dcs-col" style={{ gap: 10 }}>
            <div className="dcs-field"><span className="dcs-field__label">Opacity</span><Slider value={opacity} onChange={setOpacity} /><span className="dcs-mono" style={{ width: 34, textAlign: 'right' }}>{Math.round(opacity * 100)}</span></div>
            <div className="dcs-field" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 11 }}>Lock layer</span><Switch /></div>
            <div className="dcs-field" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 11 }}>Blend</span><ButtonGroup value="normal" options={[{ value: 'normal', label: 'Norm' }, { value: 'add', label: 'Add' }, { value: 'mul', label: 'Mul' }]} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionPopovers() {
  return (
    <section className="dw-section" id="popovers">
      <div className="dw-section__eyebrow">Overlays · 02</div>
      <h2>Popovers</h2>
      <p className="dw-section__lead">
        A small floating card anchored to a trigger — richer than a tooltip, it can hold real
        controls. Click to open; outside-click or <code>Esc</code> dismisses.
        <code>data-dcs-placement</code> picks the side and the arrow follows.
      </p>
      <Demo frame="app" caption="click a button — the popover holds live controls">
        <div className="dcs-row" style={{ gap: 16, padding: '12px 4px 56px' }}>
          <PopoverDemo placement="bottom" label="Below" />
          <PopoverDemo placement="top" label="Above" />
        </div>
      </Demo>
      <CodeBlock lang="html" code={`<button class="dcs-btn" data-dcs-toggle="popover"
        data-dcs-target="#info" data-dcs-placement="top">Details</button>

<div class="dcs-popover" id="info">
  <div class="dcs-popover__header">Layer settings</div>
  <div class="dcs-popover__body">…controls…</div>
  <div class="dcs-popover__arrow"></div>
</div>`} />
    </section>
  );
}

/* ─────────── Toasts (live) ─────────── */
const TOAST_ICON = { ok: 'check-circle', warn: 'alert', danger: 'error', info: 'info' };
function SectionToasts() {
  const [toasts, setToasts] = useStateO([]);
  const push = (variant, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, variant, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return (
    <section className="dw-section" id="toasts">
      <div className="dw-section__eyebrow">Overlays · 03</div>
      <h2>Toasts &amp; notifications</h2>
      <p className="dw-section__lead">
        Transient, stacked notifications. Create them in one call — <code>decius.toast(…)</code> —
        with <code>ok</code>, <code>warn</code>, <code>danger</code>, and <code>info</code> variants.
        Try it:
      </p>
      <Demo caption="real toasts, dismissed automatically">
        <div className="dcs-row" style={{ gap: 8 }}>
          <Button iconLeft="check-circle" onClick={() => push('ok', 'Saved', 'scene.blend written')}>OK</Button>
          <Button iconLeft="alert" onClick={() => push('warn', 'Heads up', 'Unsaved changes')}>Warn</Button>
          <Button danger iconLeft="error" onClick={() => push('danger', 'Render failed', 'GPU out of memory')}>Danger</Button>
          <Button iconLeft="info" onClick={() => push('info', 'Exported', 'turntable.mp4 · 1080p')}>Info</Button>
        </div>
      </Demo>
      <CodeBlock lang="js" code={`decius.toast({
  title: 'Saved',
  message: 'scene.blend written',
  variant: 'ok',        // ok | warn | danger | info
  timeout: 4000,        // ms; 0 = sticky
  placement: 'bottom-right',
});`} />
      {toasts.length > 0 && (
        <div className="dcs" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          <div className="dcs-toasts" style={{ position: 'static', width: 320 }}>
            {toasts.map((t) => (
              <div key={t.id} className={`dcs-toast dcs-toast--${t.variant}`}>
                <div className="dcs-toast__icon"><Icon name={TOAST_ICON[t.variant]} /></div>
                <div className="dcs-toast__body">
                  <div className="dcs-toast__title">{t.title}</div>
                  <div className="dcs-toast__msg">{t.msg}</div>
                </div>
                <div className="dcs-toast__close" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><Icon name="close" size="sm" /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────── JavaScript runtime ─────────── */
function SectionJavaScript() {
  return (
    <section className="dw-section" id="javascript">
      <div className="dw-section__eyebrow">Overview · JavaScript</div>
      <h2>JavaScript</h2>
      <p className="dw-section__lead">
        Components that need behavior — collapse, modals, menus, popovers, tabs, toasts, and the
        drag controls (sliders, faders, knobs, combo fields) — are driven by <code>decius.js</code>:
        a single, <strong style={{ color: 'var(--dw-text)' }}>zero-dependency</strong> vanilla
        script. No React required. (A React layer exists too — it's what powers this site.)
      </p>

      <div className="dw-subhead"><h3>1. Include it</h3><div className="dw-subhead__meta">~14 kB min</div></div>
      <CodeBlock lang="html" code={`<link rel="stylesheet" href="…/decius.bundle.min.css">
<script src="…/decius.min.js"></script>
<!-- auto-initializes on DOMContentLoaded -->`} />

      <div className="dw-subhead"><h3>2. Use the data API</h3><div className="dw-subhead__meta">Bootstrap-style</div></div>
      <CodeBlock lang="html" code={`<!-- modal -->
<button data-dcs-toggle="modal" data-dcs-target="#m">Open</button>
<div class="dcs-modal-backdrop" id="m"> … <button data-dcs-dismiss="modal">Close</button> </div>

<!-- tabs -->
<div class="dcs-tabs">
  <button class="dcs-tab" aria-selected="true" data-dcs-target="#p1">Mesh</button>
  <button class="dcs-tab" data-dcs-target="#p2">Shading</button>
</div>
<div id="p1" data-dcs-tabpanel>…</div>
<div id="p2" data-dcs-tabpanel hidden>…</div>

<!-- controls build themselves from data-* -->
<div data-dcs-slider data-min="0" data-max="1" data-value="0.6"></div>
<div data-dcs-knob data-min="0" data-max="1" data-value="0.4" data-label="CUT"></div>`} />

      <div className="dw-subhead"><h3>3. Or call the API</h3><div className="dw-subhead__meta">window.decius</div></div>
      <CodeBlock lang="js" code={`decius.toast({ title: 'Saved', variant: 'ok' });
decius.modal.open('#confirm');
decius.menu.open('#ctx', { x: 120, y: 200 });
decius.init(container);   // wire up dynamically-added markup

// components emit events:
slider.addEventListener('input', (e) => console.log(e.detail.value));
menu.addEventListener('dcs:select', (e) => console.log(e.detail.value));`} />

      <div style={{ marginTop: 24 }}>
        <div className="dcs-alert" style={{ background: 'var(--dw-bg-soft)', borderColor: 'var(--dw-line)', borderLeftColor: 'var(--dw-accent)', color: 'var(--dw-text)' }}>
          <div className="dcs-alert__icon"><Icon name="bolt" /></div>
          <div className="dcs-alert__body">
            <div className="dcs-alert__title" style={{ color: 'var(--dw-text)' }}>Built for affineui</div>
            <div className="dcs-alert__msg" style={{ color: 'var(--dw-text-dim)' }}>
              On <a href="https://github.com/benjcooley/affineui">affineui</a>, your app supplies behavior natively;
              <code>decius.js</code> is the browser-side equivalent so the same markup is interactive anywhere.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionMenus, SectionPopovers, SectionToasts, SectionJavaScript });
