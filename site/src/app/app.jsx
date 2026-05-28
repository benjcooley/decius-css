/* app.jsx — main docs site wiring */
const { useState: useStateApp, useEffect: useEffectApp } = React;

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
    { id: 'dnd',    label: 'Drag & drop', icon: 'move' },
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

function Sidebar({ active, onJump, open }) {
  return (
    <aside className={`dw-sidebar${open ? ' dw-sidebar--open' : ''}`}>
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

function TopBar({ onMenu }) {
  return (
    <header className="dw-top">
      <button className="dw-hamburger" onClick={onMenu} aria-label="Toggle navigation"><Icon name="menu" /></button>
      <a href="#top" className="dw-brand">
        <span className="dw-brand__mark">
          <Icon name="decius" size="lg" />
        </span>
        <span>decius<span style={{ color: 'var(--dw-accent-lo)' }}>.css</span></span>
        <span className="dw-brand__version">v0.5.3 Mus</span>
      </a>
      <nav className="dw-nav">
        <a href="#install" className="active">Docs</a>
        <a href="#buttons">Components</a>
        <a href="#sample-dcc">Showpieces</a>
        <a href="#install">Install</a>
      </nav>
      <div className="dw-top__spacer" />
      <div className="dw-top__actions">
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener"
           className="dw-cta dw-cta--ghost" style={{ height: 32, padding: '0 12px' }}>
          <Icon name="export" size="sm" /> GitHub
        </a>
      </div>
    </header>
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
  const [navOpen, setNavOpen] = useStateApp(false);
  useEffectApp(() => {
    // Sync hash → active
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (h) setActive(h);
    };
    sync();
    window.addEventListener('hashchange', sync);

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
      obs.disconnect();
    };
  }, []);

  const jump = (id) => {
    setActive(id);
    setNavOpen(false);   // close the mobile drawer on navigate
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="dw-page">
      <TopBar onMenu={() => setNavOpen(o => !o)} />
      <Sidebar active={active} onJump={jump} open={navOpen} />
      {navOpen && <div className="dw-scrim" onClick={() => setNavOpen(false)} />}
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
        <SectionDragDrop />
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
          <span>v0.5.3 "Mus" · MIT</span>
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
// DndProvider wraps the app so typed drag-and-drop works across panels/demos.
createRoot(document.getElementById('root')).render(<DndProvider><App /></DndProvider>);
