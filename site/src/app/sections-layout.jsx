/* sections-layout.jsx
   Panels · Dockpanels · Toolbars
*/
const { useState: useStateL } = React;

function SectionPanels() {
  return (
    <section className="dw-section" id="panels">
      <div className="dw-section__eyebrow">Layout · 01</div>
      <h2>Panels</h2>
      <p className="dw-section__lead">
        The atomic unit of a DCC interface. Every panel is a header strip, a body, and an optional
        status footer — wrapped in a 1px dark frame that gives the page its grid-snap feeling.
      </p>

      <Demo frame="app" caption="The standard panel, raised variant, and a closeable one with an X in the header">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Panel title="Properties" icon="cog">
            <div className="dcs-props">
              <div className="dcs-field"><label className="dcs-field__label">Name</label><input className="dcs-input" defaultValue="Cube.003" /></div>
              <div className="dcs-field"><label className="dcs-field__label">Mass</label><Combo value={1.000} min={0} max={100} step={0.001} format={v => v.toFixed(3)} /></div>
              <div className="dcs-field"><label className="dcs-field__label">Friction</label><Combo value={0.500} min={0} max={1} step={0.001} format={v => v.toFixed(3)} /></div>
            </div>
          </Panel>
          <Panel raised title="Material" icon="palette" headerActive
                 tools={<><Button ghost sm icon iconLeft="plus" /><Button ghost sm icon iconLeft="more-h" /></>}>
            <div className="dcs-col" style={{ gap: 8 }}>
              <Swatch color="#4d9fff" label="Albedo" />
              <Swatch color="#23262e" label="Specular" />
              <Swatch color="#b48cff" label="Emission" />
            </div>
          </Panel>
          <Panel title="Status" icon="info" closeable>
            <div className="dcs-col" style={{ gap: 6, fontSize: 12, color: 'var(--dcs-text-dim)' }}>
              <div><span className="dcs-badge dcs-badge--ok dcs-badge--dot">VALID</span> &nbsp; mesh topology</div>
              <div><span className="dcs-badge dcs-badge--warn dcs-badge--dot">12 NGONS</span></div>
              <div><span className="dcs-badge dcs-badge--accent">120,481 TRI</span></div>
            </div>
          </Panel>
        </div>
      </Demo>

      <Demo frame="app" caption="Tabbed panel — Blender-style header tabs">
        <Panel pad={0}>
          <Tabs
            value="anim"
           
            tabs={[
              { value: 'world', label: 'World', icon: 'globe' },
              { value: 'mesh', label: 'Mesh', icon: 'mesh' },
              { value: 'anim', label: 'Animation', icon: 'curve' },
              { value: 'render', label: 'Render', icon: 'render' },
            ]}
          />
          <div style={{ padding: 16 }}>
            <div className="dcs-props">
              <div className="dcs-field"><label className="dcs-field__label">FPS</label><Combo value={24} min={1} max={120} step={1} format={v => `${v}`} /></div>
              <div className="dcs-field"><label className="dcs-field__label">Length</label><Combo value={240} min={1} max={9999} step={1} format={v => `${v} frames`} /></div>
              <div className="dcs-field"><label className="dcs-field__label">Loop</label><Switch checked /></div>
            </div>
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

function SectionDock() {
  const [last, setLast] = useStateL('—');
  const [opacity, setOpacity] = useStateL(0.8);
  const [rough, setRough] = useStateL(0.35);
  const [gain, setGain] = useStateL(0.6);
  const [visible, setVisible] = useStateL(true);
  const [solo, setSolo] = useStateL(false);
  const [blend, setBlend] = useStateL('normal');
  const [mode, setMode] = useStateL('move');

  const DOCK_MENUS = {
    File: [{ label: 'New', icon: 'file', shortcut: '⌘N' }, { label: 'Open…', icon: 'folder-open', shortcut: '⌘O' }, { sep: true }, { label: 'Save', icon: 'save', shortcut: '⌘S' }, { label: 'Close', icon: 'close', danger: true }],
    Edit: [{ label: 'Undo', icon: 'undo', shortcut: '⌘Z' }, { label: 'Redo', icon: 'redo', shortcut: '⇧⌘Z' }, { sep: true }, { label: 'Copy', icon: 'copy' }, { label: 'Paste', icon: 'paste' }],
    View: [{ label: 'Show grid', check: true }, { label: 'Snap', check: true }, { sep: true }, { label: 'Reset layout', icon: 'array' }],
    Help: [{ label: 'Documentation', icon: 'help' }, { label: 'About', icon: 'info' }],
  };
  const TAB_META = {
    tree: { label: 'Tree', icon: 'layers' }, files: { label: 'Files', icon: 'folder' },
    preview: { label: 'Preview', icon: 'image' }, widgets: { label: 'Widgets', icon: 'cog' },
    log: { label: 'Log', icon: 'cpu' }, inspector: { label: 'Inspector', icon: 'edit' },
  };

  const TreeView = () => (
    <Tree
      expanded={new Set(['root', 'group'])}
      selected="b"
      nodes={[{
        id: 'root', label: 'Project', icon: 'folder-open', children: [
          { id: 'group', label: 'Group', icon: 'group', children: [
            { id: 'a', label: 'Node A', icon: 'cube' },
            { id: 'b', label: 'Node B', icon: 'cube', meta: 'sel' },
            { id: 'c', label: 'Node C', icon: 'sphere' },
          ] },
          { id: 'cam', label: 'Camera', icon: 'camera' },
          { id: 'light', label: 'Light', icon: 'light' },
        ],
      }]}
    />
  );
  const Files = () => (
    <div className="dcs-list">
      {[['intro.scene', 'cube'], ['hero.mat', 'palette'], ['sky_4k.hdr', 'image'], ['walk.anim', 'curve'], ['notes.md', 'file']].map(([n, ic], i) => (
        <div key={n} className="dcs-list__item" aria-selected={i === 0}><Icon name={ic} /><span style={{ flex: 1 }}>{n}</span></div>
      ))}
    </div>
  );
  const Preview = () => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dcs-bg-app)' }}>
      <div style={{ width: '70%', maxWidth: 260, aspectRatio: '4/3', borderRadius: 8, background: 'radial-gradient(circle at 35% 30%, #b6d6ff, #4d9fff 55%, #1c4080 100%)', boxShadow: 'inset 0 0 30px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.4)', opacity }} />
    </div>
  );
  // A grab-bag of "rando" widgets — proves real controls survive docking/resize.
  const Widgets = () => (
    <div className="dcs-col" style={{ gap: 12, padding: 12 }}>
      <div className="dcs-row" style={{ gap: 18, justifyContent: 'space-around' }}>
        <Knob value={gain} onChange={setGain} size={48} label="GAIN" format={v => `${(v * 100).toFixed(0)}`} />
        <Knob value={rough} onChange={setRough} size={48} label="MIX" bipolar format={v => `${((v - 0.5) * 200).toFixed(0)}`} />
      </div>
      <div className="dcs-props">
        <div className="dcs-field"><span className="dcs-field__label">Level</span><Slider value={gain} onChange={setGain} /></div>
        <div className="dcs-field"><span className="dcs-field__label">Size</span><Combo value={rough} onChange={setRough} min={0} max={1} step={0.01} format={v => v.toFixed(2)} /></div>
      </div>
      <ButtonGroup value={mode} onChange={setMode} options={[{ value: 'move', icon: 'move', label: 'Move' }, { value: 'rotate', icon: 'rotate', label: 'Rot' }, { value: 'scale', icon: 'scale-corners', label: 'Scale' }]} />
      <div className="dcs-row" style={{ gap: 16 }}>
        <Check checked={visible} onChange={setVisible}>Enabled</Check>
        <div className="dcs-row" style={{ gap: 6 }}><Switch checked={solo} onChange={setSolo} /><span style={{ fontSize: 12 }}>Solo</span></div>
      </div>
      <div className="dcs-row" style={{ gap: 8 }}><Button sm primary iconLeft="check">Apply</Button><Button sm ghost iconLeft="undo">Reset</Button></div>
    </div>
  );
  // Plain monochrome log — deliberately not colorful.
  const LogView = () => (
    <div style={{ padding: '6px 12px', fontFamily: 'var(--dcs-font-mono)', fontSize: 11, lineHeight: 1.7, color: 'var(--dcs-text-dim)' }}>
      {[
        '12:04:01  project opened',
        '12:04:01  loaded 6 nodes',
        `12:04:09  gain → ${(gain * 100).toFixed(0)}%`,
        `12:04:12  blend = ${blend}`,
        `12:04:18  menu: ${last}`,
        '12:04:20  autosave ok',
      ].map((l, i) => (
        <div key={i}><span style={{ color: 'var(--dcs-text-mute)' }}>{l.slice(0, 8)}</span>{l.slice(8)}</div>
      ))}
    </div>
  );
  const Inspector = () => (
    <div className="dcs-props">
      <div className="dcs-field"><span className="dcs-field__label">Name</span><input className="dcs-input" defaultValue="Node B" /></div>
      <div className="dcs-field"><span className="dcs-field__label">Opacity</span><Slider value={opacity} onChange={setOpacity} /><span className="dcs-mono" style={{ width: 34, textAlign: 'right' }}>{Math.round(opacity * 100)}</span></div>
      <div className="dcs-field"><span className="dcs-field__label">Rough</span><Combo value={rough} onChange={setRough} min={0} max={1} step={0.01} format={v => v.toFixed(2)} /></div>
      <div className="dcs-field"><span className="dcs-field__label">Visible</span><Switch checked={visible} onChange={setVisible} /></div>
      <div className="dcs-field"><span className="dcs-field__label">Blend</span><ButtonGroup value={blend} onChange={setBlend} options={[{ value: 'normal', label: 'Norm' }, { value: 'add', label: 'Add' }, { value: 'mul', label: 'Mul' }]} /></div>
      <div className="dcs-field"><span className="dcs-field__label">Tint</span><div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} /><span>#4D9FFF</span></div></div>
    </div>
  );

  const renderContent = (id) => {
    switch (id) {
      case 'tree': return <div style={{ padding: 'var(--dcs-s-2) 0' }}>{TreeView()}</div>;
      case 'files': return <div style={{ padding: 'var(--dcs-s-2) 0' }}>{Files()}</div>;
      case 'preview': return <div style={{ position: 'relative', height: '100%', minHeight: 180 }}>{Preview()}</div>;
      case 'widgets': return Widgets();
      case 'log': return LogView();
      case 'inspector': return <div style={{ padding: 'var(--dcs-s-3) var(--dcs-s-4)' }}>{Inspector()}</div>;
      default: return null;
    }
  };
  const layout = {
    type: 'split', dir: 'row', sizes: [1, 1.9, 1.05], children: [
      { type: 'tabs', tabs: ['tree', 'files'] },
      { type: 'split', dir: 'col', sizes: [2, 1], children: [
        { type: 'tabs', tabs: ['preview', 'widgets'] },
        { type: 'tabs', tabs: ['log'] },
      ] },
      { type: 'tabs', tabs: ['inspector'] },
    ],
  };

  return (
    <section className="dw-section" id="dock">
      <div className="dw-section__eyebrow">Layout · 03</div>
      <h2>Dock panels</h2>
      <p className="dw-section__lead">
        A real docking workspace — small on purpose, with a tree, an inspector, a log, and a grab-bag
        of widgets. <strong style={{ color: 'var(--dw-text)' }}>Grab any tab and drag it</strong>: drop on a pane's
        <em> center</em> to add it as a tab, or an <em>edge</em> (left / right / top / bottom) to dock a new split.
        Drag the seams to resize; the menu bar drops real menus. The full
        {' '}<a href="#sample-dcc">Sample DCC tool</a> uses this same engine with richer panels.
      </p>
      <div className="dcs-alert" style={{ background: 'var(--dw-bg-soft)', borderColor: 'var(--dw-line)', borderLeftColor: 'var(--dw-accent)', color: 'var(--dw-text)', marginBottom: 20 }}>
        <div className="dcs-alert__icon"><Icon name="cpu" /></div>
        <div className="dcs-alert__body">
          <div className="dcs-alert__title" style={{ color: 'var(--dw-text)' }}>What's vanilla vs React</div>
          <div className="dcs-alert__msg" style={{ color: 'var(--dw-text-dim)' }}>
            The CSS (<code>.dcs-dock</code>, <code>.dcs-dockpane</code>, <code>.dcs-splitter</code>, <code>.dcs-menubar</code>)
            is plain framework CSS, and <code>decius.js</code> drives the <strong>menus, tabs, and splitter resize</strong>.
            The full <strong>grab-and-dock layout manager</strong> (rearranging panes via center/edge drop-zones) is a
            <strong> React reference component</strong> — docking is an app-level concern, and on
            {' '}<a href="https://github.com/benjcooley/affineui">affineui</a> the host provides it natively.
          </div>
        </div>
      </div>
      <Demo frame="app" inset noDensity minw={760} caption="Drag tabs to dock · drag seams to resize · click the menus">
        <div style={{ display: 'flex', flexDirection: 'column', height: 470 }}>
          <MenuBar
            brand={{ icon: 'decius', label: 'workspace' }}
            items={['File', 'Edit', 'View', 'Help']}
            menus={DOCK_MENUS}
            onPick={(m, v) => setLast(`${m} › ${v}`)}
            meta={<><span>untitled.scene</span></>}
          />
          <DockLayout initial={layout} tabMeta={(id) => TAB_META[id]} renderContent={renderContent} />
          <div className="dcs-statusbar">
            <span className="dcs-statusbar__item dcs-statusbar__item--ok"><Icon name="check-circle" size="sm" /> Ready</span>
            <span className="dcs-statusbar__item">menu: {last}</span>
            <span className="dcs-statusbar__spacer" />
            <span className="dcs-statusbar__item dcs-statusbar__item--accent">drag a tab to dock</span>
          </div>
        </div>
      </Demo>
    </section>
  );
}
/* ------------------------------------------------------------
   Center "Document" pane + tear-off dockable panels.
   Pure stock decius markup + behaviour: no React DockLayout.
   ------------------------------------------------------------ */
function SectionTearoff() {
  // Use a ref-based mount: render an empty container and inject the
  // workspace HTML into it once. decius.js will pick up the tabs,
  // tear-off behaviour, drag handles, etc. on init().
  const hostRef = React.useRef(null);
  React.useEffect(() => {
    if (!hostRef.current || hostRef.current.dataset.mounted) return;
    hostRef.current.dataset.mounted = '1';
    hostRef.current.innerHTML = TEAROFF_WORKSPACE_HTML;
    if (window.decius && window.decius.init) window.decius.init(hostRef.current);
  }, []);

  return (
    <section className="dw-section" id="tearoff">
      <div className="dw-section__eyebrow">Layout · 05</div>
      <h2>Document pane &amp; tear-off panels</h2>
      <p className="dw-section__lead">
        A Photoshop-style workspace built from stock decius components only — no React docking
        engine. The <strong>center "Document" pane</strong> (<code>.dcs-dockpane--center</code>) holds the
        editor, with a multi-tab document strip that's <em>locked in place</em>: documents aren't
        interchangeable with side-panel tabs. The <strong>side panels</strong> ("Tools", "Layers",
        "Properties") are regular <code>.dcs-dockpane</code>s — drag any of their tabs out and you get
        a <code>.dcs-panel--floating</code> hovering over the document; drag it back over another side
        pane's tab strip to re-dock. Document tabs stay put.
      </p>
      <div className="dcs-alert dcs-alert--info" style={{ marginBottom: 20 }}>
        <div className="dcs-alert__icon"><Icon name="info" /></div>
        <div className="dcs-alert__body">
          <div className="dcs-alert__title">How it's wired</div>
          <div className="dcs-alert__msg">
            <code>data-dcs-dock-kind</code> segregates pools: "documents" tabs only re-dock to documents
            panes, "panels" tabs only to panels panes. <code>data-dcs-dock-tearoff="false"</code> (implied by
            <code> .dcs-dockpane--center</code>) locks a pane's tabs in place. Floating panels are parented
            to the workspace's positioned ancestor, so they hover over the document but don't scroll
            with the page — and on <a href="https://github.com/benjcooley/affineui">affineui</a> the
            host can promote them to real OS child windows instead.
          </div>
        </div>
      </div>
      <Demo frame="app" inset noDensity minw={760} caption="Drag a side-panel tab anywhere to tear it off · drag it back over another tab strip to re-dock · document tabs stay put">
        <div
          ref={hostRef}
          style={{ position: 'relative', height: 470, overflow: 'hidden', background: 'var(--dcs-bg-app)' }}
        />
      </Demo>
    </section>
  );
}

const TEAROFF_WORKSPACE_HTML = `
<div class="dw-workspace" style="position:absolute;inset:0;display:grid;grid-template-columns:220px 1fr 240px;gap:1px;background:var(--dcs-line);">

  <!-- LEFT side dock — Tools / Outliner -->
  <div class="dcs-dockpane" style="background:var(--dcs-bg);">
    <div class="dcs-dockpane__tabbar">
      <div class="dcs-dockpane__tabs">
        <button class="dcs-dockpane__tab" aria-selected="true" data-dcs-target="#dw-tear-tools"><i class="di di-cube"></i> Tools</button>
        <button class="dcs-dockpane__tab" data-dcs-target="#dw-tear-outliner"><i class="di di-folder-open"></i> Outliner</button>
      </div>
    </div>
    <div class="dcs-dockpane__body" style="padding:var(--dcs-s-3);">
      <div id="dw-tear-tools" data-dcs-tabpanel>
        <div class="dcs-col" style="gap:var(--dcs-s-3);">
          <div class="dcs-row" style="gap:var(--dcs-s-2);flex-wrap:wrap;">
            <button class="dcs-btn dcs-btn--icon" aria-pressed="true"><i class="di di-move"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-rotate"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-scale"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-marquee"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-lasso"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-brush"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-eraser"></i></button>
            <button class="dcs-btn dcs-btn--icon"><i class="di di-fill"></i></button>
          </div>
          <div class="dcs-note dcs-note--mute" style="font-size:var(--dcs-fs-xs);padding:0 var(--dcs-s-1);">Drag the "Tools" tab onto the document.</div>
        </div>
      </div>
      <div id="dw-tear-outliner" data-dcs-tabpanel hidden>
        <div class="dcs-tree" data-dcs-select>
          <div class="dcs-tree__row" style="--depth:0;"><span class="dcs-tree__chevron dcs-tree__chevron--open"><i class="di di-chevron-right"></i></span><span class="dcs-tree__icon"><i class="di di-folder-open"></i></span><span class="dcs-tree__label">Scene</span></div>
          <div class="dcs-tree__row" style="--depth:1;"><span class="dcs-tree__chevron"></span><span class="dcs-tree__icon"><i class="di di-cube"></i></span><span class="dcs-tree__label">Cube</span></div>
          <div class="dcs-tree__row" aria-selected="true" style="--depth:1;"><span class="dcs-tree__chevron"></span><span class="dcs-tree__icon"><i class="di di-light"></i></span><span class="dcs-tree__label">Key Light</span></div>
          <div class="dcs-tree__row" style="--depth:1;"><span class="dcs-tree__chevron"></span><span class="dcs-tree__icon"><i class="di di-camera"></i></span><span class="dcs-tree__label">Camera</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- CENTER: locked Document pane (multi-tabbed) -->
  <div class="dcs-dockpane dcs-dockpane--center">
    <div class="dcs-dockpane__tabbar">
      <div class="dcs-dockpane__tabs">
        <button class="dcs-dockpane__tab" aria-selected="true" data-dcs-target="#dw-tear-doc-1"><i class="di di-image"></i> hero.psd <span class="dcs-dockpane__tab-close"><i class="di di-close"></i></span></button>
        <button class="dcs-dockpane__tab" data-dcs-target="#dw-tear-doc-2"><i class="di di-image"></i> banner.png <span class="dcs-dockpane__tab-close"><i class="di di-close"></i></span></button>
        <button class="dcs-dockpane__tab" data-dcs-target="#dw-tear-doc-3"><i class="di di-image"></i> Untitled-3 <span class="dcs-dockpane__tab-close"><i class="di di-close"></i></span></button>
      </div>
    </div>
    <div class="dcs-dockpane__body">
      <div id="dw-tear-doc-1" data-dcs-tabpanel style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:60%;max-width:340px;aspect-ratio:16/10;border-radius:6px;background:linear-gradient(135deg,#ff8a3a 0%,#ff6b9d 40%,#7e4fff 100%);box-shadow:0 14px 40px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.3);"></div>
      </div>
      <div id="dw-tear-doc-2" data-dcs-tabpanel hidden style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:60%;max-width:340px;aspect-ratio:16/10;border-radius:6px;background:radial-gradient(circle at 30% 30%, #4dffd2, #2a8efa 60%, #1c2870);box-shadow:0 14px 40px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.3);"></div>
      </div>
      <div id="dw-tear-doc-3" data-dcs-tabpanel hidden style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dcs-text-mute);">
        <div style="width:60%;max-width:340px;aspect-ratio:16/10;border-radius:6px;background-image:repeating-conic-gradient(#cfcfcf 0 90deg,#fff 90deg 180deg);background-size:18px 18px;box-shadow:0 14px 40px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.3);"></div>
      </div>
    </div>
  </div>

  <!-- RIGHT side dock — Layers / Properties -->
  <div class="dcs-dockpane" style="background:var(--dcs-bg);">
    <div class="dcs-dockpane__tabbar">
      <div class="dcs-dockpane__tabs">
        <button class="dcs-dockpane__tab" aria-selected="true" data-dcs-target="#dw-tear-layers"><i class="di di-layers"></i> Layers</button>
        <button class="dcs-dockpane__tab" data-dcs-target="#dw-tear-props"><i class="di di-cog"></i> Properties</button>
      </div>
    </div>
    <div class="dcs-dockpane__body" style="padding:0;">
      <div id="dw-tear-layers" data-dcs-tabpanel>
        <div class="dcs-list" data-dcs-select>
          <div class="dcs-list__item" aria-selected="true"><i class="di di-eye"></i><span style="flex:1;">Hero Layer</span><span style="color:var(--dcs-text-mute);font-size:var(--dcs-fs-xs);">Normal</span></div>
          <div class="dcs-list__item"><i class="di di-eye"></i><span style="flex:1;">Title text</span><span style="color:var(--dcs-text-mute);font-size:var(--dcs-fs-xs);">Mult</span></div>
          <div class="dcs-list__item"><i class="di di-eye-off"></i><span style="flex:1;color:var(--dcs-text-mute);">Sketch</span><span style="color:var(--dcs-text-mute);font-size:var(--dcs-fs-xs);">Normal</span></div>
          <div class="dcs-list__item"><i class="di di-eye"></i><span style="flex:1;">Background</span><span style="color:var(--dcs-text-mute);font-size:var(--dcs-fs-xs);">Normal</span></div>
        </div>
      </div>
      <div id="dw-tear-props" data-dcs-tabpanel hidden style="padding:var(--dcs-s-3);">
        <div class="dcs-props">
          <div class="dcs-field"><span class="dcs-field__label">Opacity</span><div data-dcs-slider data-min="0" data-max="1" data-value="0.85"></div></div>
          <div class="dcs-field"><span class="dcs-field__label">Fill</span><div data-dcs-slider data-min="0" data-max="1" data-value="1"></div></div>
          <div class="dcs-field"><span class="dcs-field__label">Locked</span><div class="dcs-check"><div class="dcs-check__box"></div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

Object.assign(window, { SectionPanels, SectionDock, SectionSubpanels, SectionFoldouts, SectionTearoff });

function SectionFoldouts() {
  return (
    <section className="dw-section" id="foldouts">
      <div className="dw-section__eyebrow">Layout · 04</div>
      <h2>Foldouts</h2>
      <p className="dw-section__lead">
        Blender-style soft section cards. Use these inside a scrolling property inspector to group
        related controls into rounded, lighter-bg containers with comfortable margins. Click a
        header to collapse. Pair them with subpanels — foldouts are the soft, breathy version.
      </p>
      <Demo frame="app">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'flex-start' }}>
          <Panel title="Inspector ▸ jane_body" icon="cog" pad={0}
                 tools={<><Button ghost sm icon iconLeft="pin" /><Button ghost sm icon iconLeft="more-h" /></>}>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <Foldouts>
                <Foldout title="Transform" icon="move" meta="Local">
                  <div className="dcs-props">
                    {[['X', '#ef6b6b', 1.428], ['Y', '#4ed18a', -0.952], ['Z', '#4d9fff', 3.000]].map(([k, c, v]) => (
                      <div key={k} className="dcs-field">
                        <span className="dcs-field__label" style={{ color: c, flex: '0 0 16px', fontFamily: 'var(--dcs-font-num)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{k}</span>
                        <Combo value={v} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} />
                      </div>
                    ))}
                  </div>
                </Foldout>
                <Foldout title="Material" icon="palette" meta="Lambert.001">
                  <div className="dcs-props">
                    <div className="dcs-field">
                      <span className="dcs-field__label">Albedo</span>
                      <div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} /><span>#4D9FFF</span></div>
                    </div>
                    <div className="dcs-field">
                      <span className="dcs-field__label">Roughness</span>
                      <Slider value={0.42} />
                    </div>
                    <div className="dcs-field">
                      <span className="dcs-field__label">Metallic</span>
                      <Slider value={0.08} />
                    </div>
                    <div className="dcs-field">
                      <span className="dcs-field__label">Specular</span>
                      <Combo value={0.5} min={0} max={1} step={0.01} format={v => v.toFixed(2)} />
                    </div>
                    <div className="dcs-field">
                      <span className="dcs-field__label">Use texture</span>
                      <Switch checked />
                    </div>
                    <div className="dcs-field">
                      <span className="dcs-field__label">Tag</span>
                      <input className="dcs-input" defaultValue="opaque/metallic" />
                    </div>
                  </div>
                </Foldout>
                <Foldout title="Display" icon="eye">
                  <div className="dcs-props">
                    {[
                      { l: 'Wireframe', v: false },
                      { l: 'Smooth shading', v: true },
                      { l: 'Cast shadow', v: true },
                      { l: 'In viewport', v: true },
                      { l: 'In render', v: true },
                    ].map(it => (
                      <div key={it.l} className="dcs-field">
                        <span className="dcs-field__label">{it.l}</span>
                        <Switch checked={it.v} />
                      </div>
                    ))}
                  </div>
                </Foldout>
                <Foldout title="Constraints" icon="link" defaultOpen={false} meta="0" />
                <Foldout title="Modifiers" icon="bolt" defaultOpen={false} meta="3" />
                <Foldout title="Subdivision" icon="subdivide" defaultOpen={false} meta="L2" />
                <Foldout title="UV Maps" icon="uv" defaultOpen={false} meta="1" />
                <Foldout title="Vertex Groups" icon="mesh" defaultOpen={false} meta="0" />
              </Foldouts>
            </div>
          </Panel>
          <div className="dw-note" style={{ paddingTop: 6 }}>
            <p><strong>Foldout vs SubPanel.</strong> Both collapse. The visual difference is rhythm.</p>
            <p><strong>Foldouts</strong> are soft, lighter-bg cards with margins — they feel like grouped properties. Use for inspectors with many heterogeneous sections (Blender's N-panel, Unity's Inspector).</p>
            <p><strong>Subpanels</strong> are full-width seams in a stack — they feel like rigid rows. Use when controls are dense and visual chunking matters more than soft separation (Maya's Channel Box, Houdini's parameter editor).</p>
          </div>
        </div>
      </Demo>

      <h3 style={{ marginTop: 36, marginBottom: 8 }}>It's a base component — raw CSS or JS</h3>
      <p className="dw-section__lead" style={{ marginTop: 0 }}>
        A foldout is just markup. Wrap it in a native <code>&lt;details&gt;</code> and it opens and closes
        with <strong style={{ color: 'var(--dw-text)' }}>zero JavaScript</strong> — same class names, same look
        (the second one below starts collapsed). Or drive it yourself by toggling the
        {' '}<code>.dcs-foldout--collapsed</code> class — that's what React does here, and what the vanilla
        {' '}<code>decius.js</code> runtime wires up automatically on any <code>.dcs-foldout__header</code>.
      </p>
      <Demo frame="app">
        <div className="dcs-foldouts" style={{ maxWidth: 360 }}>
          <details className="dcs-foldout" open>
            <summary className="dcs-foldout__header">
              <span className="dcs-foldout__chevron"><Icon name="chevron-right" size="sm" /></span>
              <Icon className="dcs-foldout__icon" name="move" size="sm" />
              <span className="dcs-foldout__title">Transform</span>
              <span className="dcs-foldout__meta">native &lt;details&gt;</span>
            </summary>
            <div className="dcs-foldout__body">
              <div className="dcs-props">
                <div className="dcs-field"><span className="dcs-field__label">Position</span><input className="dcs-input" defaultValue="0.0, 0.0, 0.0" /></div>
                <div className="dcs-field"><span className="dcs-field__label">Scale</span><input className="dcs-input" defaultValue="1.0" /></div>
              </div>
            </div>
          </details>
          <details className="dcs-foldout">
            <summary className="dcs-foldout__header">
              <span className="dcs-foldout__chevron"><Icon name="chevron-right" size="sm" /></span>
              <Icon className="dcs-foldout__icon" name="palette" size="sm" />
              <span className="dcs-foldout__title">Material</span>
              <span className="dcs-foldout__meta">native &lt;details&gt;</span>
            </summary>
            <div className="dcs-foldout__body">
              <div className="dcs-props">
                <div className="dcs-field"><span className="dcs-field__label">Albedo</span><input className="dcs-input" defaultValue="#4D9FFF" /></div>
                <div className="dcs-field"><span className="dcs-field__label">Roughness</span><input className="dcs-input" defaultValue="0.42" /></div>
              </div>
            </div>
          </details>
        </div>
      </Demo>
    </section>
  );
}

function SectionSubpanels() {
  return (
    <section className="dw-section" id="subpanels">
      <div className="dw-section__eyebrow">Layout · 03</div>
      <h2>Subpanels</h2>
      <p className="dw-section__lead">
        Inside a panel, group properties into collapsible subpanels with a single chevron and a hover-revealed
        close affordance. Subpanels share the panel's chrome — they're horizontal seams in a stack, not
        nested boxes.
      </p>
      <Demo frame="app">
        <div style={{ maxWidth: 320 }}>
          <Panel title="Inspector ▸ jane_body" icon="cog" pad={0}
                 tools={<><Button ghost sm icon iconLeft="pin" /><Button ghost sm icon iconLeft="more-h" /></>}>
            <SubPanel title="Transform" icon="move">
              <div className="dcs-props" style={{ '--dcs-props-label-w': '14px' }}>
                <div className="dcs-field">
                  <span className="dcs-field__label" style={{ fontSize: 10, color: 'var(--dcs-danger)', fontFamily: 'var(--dcs-font-mono)' }}>X</span>
                  <Combo value={1.428} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} />
                </div>
                <div className="dcs-field">
                  <span className="dcs-field__label" style={{ fontSize: 10, color: 'var(--dcs-ok)', fontFamily: 'var(--dcs-font-mono)' }}>Y</span>
                  <Combo value={-0.952} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} />
                </div>
                <div className="dcs-field">
                  <span className="dcs-field__label" style={{ fontSize: 10, color: 'var(--dcs-accent)', fontFamily: 'var(--dcs-font-mono)' }}>Z</span>
                  <Combo value={3.000} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} />
                </div>
              </div>
            </SubPanel>
            <SubPanel title="Display" icon="eye">
              <div className="dcs-props">
                <div className="dcs-field"><span className="dcs-field__label">Wireframe</span><Switch checked={false} /></div>
                <div className="dcs-field"><span className="dcs-field__label">Smooth shade</span><Switch checked /></div>
                <div className="dcs-field"><span className="dcs-field__label">Cast shadow</span><Switch checked /></div>
              </div>
            </SubPanel>
            <SubPanel title="Material" icon="palette" defaultOpen={false}>
              <div className="dcs-props">
                <div className="dcs-field">
                  <span className="dcs-field__label">Albedo</span>
                  <div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} /><span>#4D9FFF</span></div>
                </div>
                <div className="dcs-field"><span className="dcs-field__label">Roughness</span><Slider value={0.42} /></div>
              </div>
            </SubPanel>
            <SubPanel title="Constraints" icon="link" defaultOpen={false}>
              <div className="dcs-props">
                <div className="dcs-field"><span className="dcs-field__label">Lock X</span><Switch checked={false} /></div>
                <div className="dcs-field"><span className="dcs-field__label">Track to</span><Combo value={0} min={0} max={4} step={1} format={() => 'Cam.001'} /></div>
              </div>
            </SubPanel>
            <SubPanel title="Subdivision" icon="subdivide" defaultOpen={false}>
              <div className="dcs-props">
                <div className="dcs-field"><span className="dcs-field__label">Level</span><Combo value={2} min={0} max={6} step={1} format={v => `${v}×`} /></div>
              </div>
            </SubPanel>
          </Panel>
        </div>
      </Demo>
    </section>
  );
}
