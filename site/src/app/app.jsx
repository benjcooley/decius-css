/* app.jsx — main docs site wiring */
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const REPO_URL = 'https://github.com/benjcooley/decius-css';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "darkness": "default",
  "density": "comfortable",
  "radius": "default"
}/*EDITMODE-END*/;

const NAV = [
  { group: 'Overview', items: [
    { id: 'top',    label: 'Introduction',  icon: 'decius' },
    { id: 'why',    label: 'Why decius',    icon: 'help' },
    { id: 'install',label: 'Install',       icon: 'rocket' },
    { id: 'javascript', label: 'JavaScript', icon: 'cpu' },
  ]},
  { group: 'Foundations', items: [
    { id: 'colors',  label: 'Color',    icon: 'palette' },
    { id: 'type',    label: 'Type',     icon: 'edit' },
    { id: 'spacing', label: 'Spacing',  icon: 'grid' },
    { id: 'icons',   label: 'Icons',    icon: 'star' },
  ]},
  { group: 'Components', items: [
    { id: 'buttons', label: 'Buttons',  icon: 'check-circle' },
    { id: 'inputs',  label: 'Inputs',   icon: 'edit' },
    { id: 'sliders', label: 'Sliders & faders',  icon: 'wave-sine' },
    { id: 'knobs',   label: 'Knobs',    icon: 'cog' },
    { id: 'combo',   label: 'Combo fields', icon: 'caret-up-down' },
    { id: 'checks',  label: 'Checks · switches', icon: 'check' },
  ]},
  { group: 'Layout', items: [
    { id: 'panels',  label: 'Panels',     icon: 'array' },
    { id: 'subpanels', label: 'Subpanels', icon: 'menu' },
    { id: 'foldouts',  label: 'Foldouts',  icon: 'chevron-down' },
    { id: 'dock',    label: 'Dock panels', icon: 'layers' },
  ]},
  { group: 'Data', items: [
    { id: 'lists',  label: 'Lists',  icon: 'menu' },
    { id: 'trees',  label: 'Trees',  icon: 'folder-open' },
    { id: 'tables', label: 'Tables', icon: 'grid' },
    { id: 'cards',  label: 'Cards',  icon: 'image' },
    { id: 'badges', label: 'Badges & keys', icon: 'tag' },
  ]},
  { group: 'Feedback', items: [
    { id: 'alerts', label: 'Alerts', icon: 'alert' },
    { id: 'modals', label: 'Modals', icon: 'info' },
  ]},
  { group: 'Overlays', items: [
    { id: 'menus',    label: 'Menus & dropdowns', icon: 'menu' },
    { id: 'popovers', label: 'Popovers',          icon: 'info' },
    { id: 'toasts',   label: 'Toasts',            icon: 'alert' },
  ]},
  { group: 'Editors', items: [
    { id: 'color-pickers', label: 'Color pickers', icon: 'droplet' },
    { id: 'curve',         label: 'Curve editor',  icon: 'curve' },
    { id: 'graph',         label: 'Node graph',    icon: 'graph' },
    { id: 'textures',      label: 'Texture pickers', icon: 'texture' },
  ]},
  { group: 'Showpieces', items: [
    { id: 'sample-dcc',   label: 'Sample DCC tool', icon: 'cube' },
    { id: 'sample-synth', label: 'Sample synth',    icon: 'wave-saw' },
    { id: 'skeuomorphic', label: 'Skeuomorphic hw', icon: 'cable' },
  ]},
];

function Sidebar({ active, onJump }) {
  return (
    <aside className="dw-sidebar">
      {NAV.map(group => (
        <div key={group.group}>
          <div className="dw-sidebar__group">{group.group}</div>
          {group.items.map(it => (
            <a key={it.id} href={`#${it.id}`}
               className={active === it.id ? 'active' : ''}
               onClick={(e) => { e.preventDefault(); onJump(it.id); }}>
              <Icon name={it.icon} size="sm" /> {it.label}
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}

function TopBar({ onOpenSearch }) {
  return (
    <header className="dw-top">
      <a href="#top" className="dw-brand">
        <span className="dw-brand__mark">
          <Icon name="decius" size="lg" />
        </span>
        <span>decius<span style={{ color: 'var(--dw-accent-lo)' }}>.css</span></span>
        <span className="dw-brand__version">v0.4.0 Mus</span>
      </a>
      <nav className="dw-nav">
        <a href="#install" className="active">Docs</a>
        <a href="#buttons">Components</a>
        <a href="#sample-dcc">Showpieces</a>
        <a href="#install">Install</a>
      </nav>
      <div className="dw-top__spacer" />
      <div className="dw-top__actions">
        <button type="button" className="dw-search" onClick={onOpenSearch}
                aria-label="Search components" style={{ fontFamily: 'inherit', cursor: 'pointer' }}>
          <Icon name="search" size="sm" />
          <span>Search components…</span>
          <kbd>⌘K</kbd>
        </button>
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener"
           className="dw-cta dw-cta--ghost" style={{ height: 32, padding: '0 12px' }}>
          <Icon name="export" size="sm" /> GitHub
        </a>
      </div>
    </header>
  );
}

/* ⌘K command palette — searches every documented section and jumps to it. */
function SearchPalette({ open, onClose, onJump }) {
  const [q, setQ] = useStateApp('');
  const [hi, setHi] = useStateApp(0);
  const inputRef = useRefApp(null);
  const items = NAV.flatMap(g => g.items.map(it => ({ ...it, group: g.group })));
  const ql = q.trim().toLowerCase();
  const results = ql
    ? items.filter(it =>
        it.label.toLowerCase().includes(ql) ||
        it.group.toLowerCase().includes(ql) ||
        it.id.includes(ql))
    : items;

  useEffectApp(() => {
    if (!open) return;
    setQ(''); setHi(0);
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  if (!open) return null;
  const pick = (it) => { onClose(); onJump(it.id); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(results.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[hi]) pick(results[hi]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(16,22,34,.45)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 16px 16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(560px, 100%)', background: 'var(--dw-bg)', border: '1px solid var(--dw-line)',
        borderRadius: 12, boxShadow: '0 24px 64px rgba(16,24,40,.28)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--dw-line)' }}>
          <Icon name="search" />
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setHi(0); }} onKeyDown={onKey}
            placeholder="Search components…" spellCheck={false} style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--dw-text)', fontSize: 15, fontFamily: 'inherit',
            }} />
          <kbd style={{ fontSize: 11, color: 'var(--dw-text-mute)', border: '1px solid var(--dw-line)', borderRadius: 4, padding: '1px 6px' }}>esc</kbd>
        </div>
        <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: 6 }}>
          {results.length === 0 && (
            <div style={{ padding: 16, color: 'var(--dw-text-mute)', fontSize: 13 }}>No matches for “{q}”.</div>
          )}
          {results.map((it, i) => (
            <div key={it.id} role="option" aria-selected={i === hi}
              onMouseEnter={() => setHi(i)} onClick={() => pick(it)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, cursor: 'pointer',
                background: i === hi ? 'var(--dw-accent-dim)' : 'transparent',
                color: i === hi ? 'var(--dw-text)' : 'var(--dw-text-dim)',
              }}>
              <Icon name={it.icon} size="sm" />
              <span style={{ flex: 1 }}>{it.label}</span>
              <span style={{ fontSize: 11, color: 'var(--dw-text-mute)' }}>{it.group}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ACCENT_OPTIONS = [
  { name: 'blue',   hex: '#4d9fff' },
  { name: 'cyan',   hex: '#00b8d4' },
  { name: 'orange', hex: '#ff8a3a' },
  { name: 'violet', hex: '#8b6dff' },
  { name: 'green',  hex: '#3dd68a' },
];

function Tweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks at the document level — the CSS vars then cascade through
  // every .dcs subtree. Demos that have their own attribute explicitly set
  // override locally (per-demo toggle wins; otherwise the global cascades in).
  useEffectApp(() => {
    const root = document.body;
    if (t.accent === 'blue') root.removeAttribute('data-dcs-accent');
    else root.setAttribute('data-dcs-accent', t.accent);
    if (t.darkness === 'default') root.removeAttribute('data-dcs-dark');
    else root.setAttribute('data-dcs-dark', t.darkness);
    root.setAttribute('data-dcs-density', t.density);
    if (t.radius === 'default') root.removeAttribute('data-dcs-radius');
    else root.setAttribute('data-dcs-radius', t.radius);
  }, [t]);

  const currentHex = (ACCENT_OPTIONS.find(o => o.name === t.accent) || ACCENT_OPTIONS[0]).hex;

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakColor
          label="Accent"
          options={ACCENT_OPTIONS.map(o => o.hex)}
          value={currentHex}
          onChange={hex => {
            const opt = ACCENT_OPTIONS.find(o => o.hex === hex);
            if (opt) setTweak('accent', opt.name);
          }}
        />
        <TweakRadio
          label="Darkness"
          options={[
            { value: 'darker',  label: 'Darker' },
            { value: 'default', label: 'Default' },
            { value: 'lighter', label: 'Lighter' },
          ]}
          value={t.darkness}
          onChange={v => setTweak('darkness', v)}
        />
      </TweakSection>
      <TweakSection title="Sizing">
        <TweakRadio
          label="Density"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Cozy' },
            { value: 'spacious', label: 'Spacious' },
          ]}
          value={t.density}
          onChange={v => setTweak('density', v)}
        />
        <TweakRadio
          label="Radius"
          options={[
            { value: 'sharp', label: 'Sharp' },
            { value: 'default', label: 'Default' },
            { value: 'round', label: 'Round' },
          ]}
          value={t.radius}
          onChange={v => setTweak('radius', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

function App() {
  const [active, setActive] = useStateApp('top');
  const [searchOpen, setSearchOpen] = useStateApp(false);
  useEffectApp(() => {
    // Sync hash → active
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (h) setActive(h);
    };
    sync();
    window.addEventListener('hashchange', sync);

    // ⌘K / Ctrl+K opens the command palette from anywhere.
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);

    // Intersection observer for scroll-spy
    const sections = NAV.flatMap(g => g.items.map(i => i.id));
    const els = sections.map(id => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-30% 0% -60% 0%', threshold: 0 });
    els.forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('keydown', onKey);
      obs.disconnect();
    };
  }, []);

  const jump = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="dw-page">
      <TopBar onOpenSearch={() => setSearchOpen(true)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} onJump={jump} />
      <Sidebar active={active} onJump={jump} />
      <main className="dw-main">
        <SectionHero />
        <SectionWhy />
        <SectionInstall />
        <SectionJavaScript />

        <hr />
        <SectionColors />
        <SectionType />
        <SectionSpacing />
        <SectionIcons />

        <hr />
        <SectionButtons />
        <SectionInputs />
        <SectionSliders />
        <SectionKnobs />
        <SectionCombo />
        <SectionChecksSwitches />

        <hr />
        <SectionPanels />
        <SectionSubpanels />
        <SectionFoldouts />
        <SectionDock />

        <hr />
        <SectionLists />
        <SectionTrees />
        <SectionTables />
        <SectionCards />
        <SectionBadges />

        <hr />
        <SectionAlerts />
        <SectionModals />

        <hr />
        <SectionMenus />
        <SectionPopovers />
        <SectionToasts />

        <hr />
        <SectionColorPicker />
        <SectionCurve />
        <SectionGraph />
        <SectionTexture />

        <hr />
        <SectionSampleDCC />
        <SectionSampleSynth />
        <SectionSkeuomorphic />

        <footer style={{ marginTop: 80, paddingTop: 32, borderTop: '1px solid var(--dw-line)', display: 'flex', gap: 28, color: 'var(--dw-text-mute)', fontSize: 13, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="dw-brand" style={{ fontSize: 14 }}>
            <span className="dw-brand__mark" style={{ width: 24, height: 24 }}><Icon name="decius" /></span>
            decius.css
          </span>
          <span>v0.4.0 "Mus" · MIT</span>
          <span style={{ flex: 1 }} />
          <a href="#install">Install</a>
          <a href="#colors">Tokens</a>
          <a href="#sample-dcc">Showpieces</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">GitHub</a>
          <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer noopener">Changelog</a>
        </footer>
      </main>
      <Tweaks />
    </div>
  );
}

// Icons are a web font (loaded via CSS), so we can mount immediately.
createRoot(document.getElementById('root')).render(<App />);
