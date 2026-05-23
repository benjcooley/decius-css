/* sections-overlays.jsx — new components (menus, popovers, toasts) and the
   vanilla decius.js runtime docs. Demos use the real framework classes. */
const { useState: useStateO } = React;

/* ─────────── Menus ─────────── */
function MenuSurface({ withSub }) {
  return (
    <div className="dcs-menu" style={{ position: 'relative', width: 210 }}>
      <div className="dcs-menu__label">File</div>
      <div className="dcs-menu__item"><span className="dcs-menu__icon"><Icon name="file" size="sm" /></span><span className="dcs-menu__label-text">New</span><span className="dcs-menu__shortcut">⌘N</span></div>
      <div className="dcs-menu__item"><span className="dcs-menu__icon"><Icon name="folder-open" size="sm" /></span><span className="dcs-menu__label-text">Open…</span><span className="dcs-menu__shortcut">⌘O</span></div>
      <div className="dcs-menu__item dcs-menu__item--active"><span className="dcs-menu__check"><Icon name="check" size="sm" /></span><span className="dcs-menu__label-text">Autosave</span></div>
      <div className="dcs-menu__sep" />
      {withSub && <div className="dcs-menu__item dcs-menu__item--has-sub"><span className="dcs-menu__icon"><Icon name="export" size="sm" /></span><span className="dcs-menu__label-text">Export As</span><span className="dcs-menu__caret"><Icon name="chevron-right" size="sm" /></span></div>}
      <div className="dcs-menu__item dcs-menu__item--danger"><span className="dcs-menu__icon"><Icon name="trash" size="sm" /></span><span className="dcs-menu__label-text">Delete</span></div>
    </div>
  );
}

function SectionMenus() {
  return (
    <section className="dw-section" id="menus">
      <div className="dw-section__eyebrow">Overlays · 01</div>
      <h2>Menus &amp; dropdowns</h2>
      <p className="dw-section__lead">
        Floating command menus for buttons, menubars, and right-click. <code>decius.js</code> opens
        and positions them; here they're shown inline. Items take icons, shortcuts, checks, danger
        styling, separators, and submenus.
      </p>
      <Demo caption="dropdown + context menu surfaces">
        <div className="dcs-row" style={{ gap: 24, alignItems: 'flex-start' }}>
          <MenuSurface />
          <MenuSurface withSub />
        </div>
      </Demo>
      <CodeBlock lang="html" code={`<button class="dcs-btn" data-dcs-toggle="menu" data-dcs-target="#file-menu">File</button>

<div class="dcs-menu" id="file-menu">
  <div class="dcs-menu__item" data-dcs-value="new">
    <span class="dcs-menu__icon"><i class="di di-file"></i></span>
    <span class="dcs-menu__label-text">New</span>
    <span class="dcs-menu__shortcut">⌘N</span>
  </div>
  <div class="dcs-menu__sep"></div>
  <div class="dcs-menu__item dcs-menu__item--danger">…Delete</div>
</div>

<!-- right-click context menu on any element -->
<div data-dcs-menu="#file-menu">right-click me</div>`} />
    </section>
  );
}

/* ─────────── Popovers ─────────── */
function SectionPopovers() {
  return (
    <section className="dw-section" id="popovers">
      <div className="dw-section__eyebrow">Overlays · 02</div>
      <h2>Popovers</h2>
      <p className="dw-section__lead">
        A small floating card anchored to a trigger — richer than a tooltip, it can hold real
        controls. <code>data-dcs-placement</code> picks the side; the arrow follows.
      </p>
      <Demo caption="anchored card with an arrow">
        <div style={{ position: 'relative', paddingBottom: 40 }}>
          <div className="dcs-popover" style={{ position: 'relative', width: 260 }} data-dcs-pos="bottom">
            <div className="dcs-popover__header">Quick settings</div>
            <div className="dcs-popover__body">Put sliders, toggles, anything here. Dismissed on outside-click or <code>Esc</code>.</div>
            <div className="dcs-popover__arrow" style={{ top: -6, left: 24 }} />
          </div>
        </div>
      </Demo>
      <CodeBlock lang="html" code={`<button class="dcs-btn" data-dcs-toggle="popover"
        data-dcs-target="#info" data-dcs-placement="top">Details</button>

<div class="dcs-popover" id="info">
  <div class="dcs-popover__header">Quick settings</div>
  <div class="dcs-popover__body">…</div>
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
