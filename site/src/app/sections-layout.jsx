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
            <div className="dcs-col" style={{ gap: 6 }}>
              <div className="dcs-field"><label className="dcs-field__label">Name</label><input className="dcs-input" defaultValue="Cube.003" /></div>
              <div className="dcs-field"><label className="dcs-field__label">Mass</label><Combo value={1.000} min={0} max={100} step={0.001} format={v => v.toFixed(3)} width="100%" /></div>
              <div className="dcs-field"><label className="dcs-field__label">Friction</label><Combo value={0.500} min={0} max={1} step={0.001} format={v => v.toFixed(3)} width="100%" /></div>
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
            <div className="dcs-col" style={{ gap: 8 }}>
              <div className="dcs-field"><label className="dcs-field__label">FPS</label><Combo value={24} min={1} max={120} step={1} format={v => `${v}`} width={100} /></div>
              <div className="dcs-field"><label className="dcs-field__label">Length</label><Combo value={240} min={1} max={9999} step={1} format={v => `${v} frames`} width={140} /></div>
              <div className="dcs-field"><label className="dcs-field__label">Loop</label><Switch checked /></div>
            </div>
          </div>
        </Panel>
      </Demo>
    </section>
  );
}

function SectionDock() {
  const [pos, setPos] = useStateL({ x: 1.428, y: -0.952, z: 3.000 });
  const [rough, setRough] = useStateL(0.42);
  const [metallic, setMetallic] = useStateL(0.08);
  const [wire, setWire] = useStateL(false);
  const [shadow, setShadow] = useStateL(true);
  const [shading, setShading] = useStateL('shaded');
  const [tool, setTool] = useStateL('select');
  const [last, setLast] = useStateL('—');

  const DOCK_MENUS = {
    File: [
      { label: 'New Scene', icon: 'file', shortcut: '⌘N' },
      { label: 'Open…', icon: 'folder-open', shortcut: '⌘O' },
      { sep: true },
      { label: 'Save', icon: 'save', shortcut: '⌘S' },
      { label: 'Export As', icon: 'export', sub: [{ label: 'glTF' }, { label: 'USD' }, { label: 'FBX' }] },
      { sep: true },
      { label: 'Quit', icon: 'close', danger: true },
    ],
    Edit: [
      { label: 'Undo', icon: 'undo', shortcut: '⌘Z' }, { label: 'Redo', icon: 'redo', shortcut: '⇧⌘Z' },
      { sep: true }, { label: 'Cut', icon: 'cut' }, { label: 'Copy', icon: 'copy' }, { label: 'Paste', icon: 'paste' },
    ],
    View: [
      { label: 'Wireframe', check: wire }, { label: 'Show grid', check: true }, { label: 'Gizmos', check: true },
      { sep: true }, { label: 'Frame selected', icon: 'fit', shortcut: 'F' }, { label: 'Fullscreen', icon: 'fullscreen', shortcut: 'F11' },
    ],
    Mesh: [{ label: 'Extrude', icon: 'extrude' }, { label: 'Subdivide', icon: 'subdivide' }, { label: 'Mirror', icon: 'mirror' }, { label: 'Array', icon: 'array' }],
    Render: [{ label: 'Render image', icon: 'render', shortcut: 'F12' }, { label: 'Render animation', icon: 'play' }],
    Help: [{ label: 'Documentation', icon: 'help' }, { label: 'About modeler', icon: 'info' }],
  };

  const TAB_META = {
    hier: { label: 'Hierarchy', icon: 'layers' }, proj: { label: 'Project', icon: 'folder' },
    scene: { label: 'Scene', icon: 'cube' }, game: { label: 'Game', icon: 'play' }, uv: { label: 'UV Editor', icon: 'uv' },
    console: { label: 'Console', icon: 'cpu' }, animation: { label: 'Animation', icon: 'curve' }, timeline: { label: 'Timeline', icon: 'timeline' },
    inspector: { label: 'Inspector', icon: 'cog' }, lighting: { label: 'Lighting', icon: 'light' },
  };

  const Viewport = () => (
    <div className="dcs-viewport" style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="-100 -60 200 120" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="dl-grid" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(1.5, 0.5)">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth=".25" />
          </pattern>
        </defs>
        <rect x="-100" y="0" width="200" height="60" fill="url(#dl-grid)" />
        <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,.15)" strokeWidth=".4" />
        <g transform="translate(-6 -8) rotate(18)" filter="drop-shadow(0 4px 12px rgba(0,0,0,.5))">
          {wire ? (
            <path d="M-20-20 L20-20 L25-15 L25 15 L-16 22 L-20 12 Z M-20-20 L0 0 L20-20 M-20 12 L0 0 L25 15" fill="none" stroke="#4d9fff" strokeWidth=".4" />
          ) : (
            <>
              <path d="M-20-20 L20-20 L25-15 L25 15 L-16 22 L-20 12 Z" fill="rgba(77,159,255,.22)" stroke="#4d9fff" strokeWidth=".4" />
              <path d="M-20-20 L25-15 L25 15 L-16 22 Z" fill="rgba(77,159,255,.10)" stroke="rgba(77,159,255,.35)" strokeWidth=".3" />
            </>
          )}
        </g>
      </svg>
      <div className="dcs-viewport__overlay dcs-viewport__overlay--tl">
        <div className="dcs-viewport__floater">
          <Button sm icon iconLeft="select" pressed={tool === 'select'} onClick={() => setTool('select')} />
          <Button sm icon iconLeft="move" pressed={tool === 'move'} onClick={() => setTool('move')} />
          <Button sm icon iconLeft="rotate" pressed={tool === 'rotate'} onClick={() => setTool('rotate')} />
          <Button sm icon iconLeft="scale-corners" pressed={tool === 'scale'} onClick={() => setTool('scale')} />
        </div>
        <div className="dcs-viewport__floater">
          <Button sm icon iconLeft="view-wire" pressed={shading === 'wire'} onClick={() => { setShading('wire'); setWire(true); }} />
          <Button sm icon iconLeft="view-solid" pressed={shading === 'shaded'} onClick={() => { setShading('shaded'); setWire(false); }} />
          <Button sm icon iconLeft="view-tex" pressed={shading === 'tex'} onClick={() => { setShading('tex'); setWire(false); }} />
        </div>
      </div>
      <div className="dcs-viewport__overlay dcs-viewport__overlay--tr">
        <span className="dcs-badge dcs-badge--accent">PERSPECTIVE</span>
        <span className="dcs-badge dcs-badge--soft">F 048 / 240</span>
      </div>
      <div className="dcs-viewport__overlay dcs-viewport__overlay--br">
        <div style={{ fontFamily: 'var(--dcs-font-num)', fontVariantNumeric: 'tabular-nums', fontSize: 10, color: 'rgba(255,255,255,.6)', textAlign: 'right', lineHeight: 1.5 }}>
          <div>jane_body · 64,201 tri</div>
          <div style={{ color: 'var(--dcs-accent)' }}>60 fps · 4.1 ms</div>
        </div>
      </div>
      <div className="dcs-viewport__overlay dcs-viewport__overlay--bl">
        <div className="dcs-viewport__floater">
          <Button sm icon iconLeft="magnet" pressed />
          <Button sm icon iconLeft="snap-grid" />
          <Button sm icon iconLeft="gizmo" pressed />
        </div>
      </div>
    </div>
  );

  const Outliner = () => (
    <Tree
      expanded={new Set(['scene', 'env', 'chars'])}
      selected="cube"
      nodes={[{
        id: 'scene', label: 'Scene_Intro', icon: 'globe', meta: '37', children: [
          { id: 'env', label: 'Environment', icon: 'folder-open', children: [
            { id: 'sky', label: 'Sky_4k.hdr', icon: 'image' }, { id: 'sun', label: 'Sun.001', icon: 'light' }, { id: 'fog', label: 'VolumeFog', icon: 'cube' },
          ] },
          { id: 'chars', label: 'Characters', icon: 'folder-open', children: [
            { id: 'cube', label: 'jane_body', icon: 'mesh', meta: '64k' }, { id: 'rig', label: 'jane_rig', icon: 'bone' }, { id: 'mat', label: 'jane_skin', icon: 'palette' },
          ] },
          { id: 'cam', label: 'Camera.001', icon: 'camera' },
        ]
      }]}
    />
  );

  const InspectorView = () => (
    <Foldouts>
      <Foldout title="Transform" icon="move" tools={<Button ghost sm icon iconLeft="key" />}>
        <div className="dcs-props">
          {[['X', '#ef6b6b', pos.x, 'x'], ['Y', '#4ed18a', pos.y, 'y'], ['Z', '#4d9fff', pos.z, 'z']].map(([k, c, v, key]) => (
            <div key={k} className="dcs-field">
              <span className="dcs-field__label" style={{ flex: '0 0 16px', color: c, fontFamily: 'var(--dcs-font-num)', fontSize: 11 }}>{k}</span>
              <Combo value={v} onChange={nv => setPos(p => ({ ...p, [key]: nv }))} min={-10} max={10} step={0.001} format={n => n.toFixed(3)} />
            </div>
          ))}
        </div>
      </Foldout>
      <Foldout title="Material" icon="palette" meta="Lambert.001">
        <div className="dcs-props">
          <div className="dcs-field"><span className="dcs-field__label">Albedo</span><div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} /><span>#4D9FFF</span></div></div>
          <div className="dcs-field"><span className="dcs-field__label">Rough</span><Slider value={rough} onChange={setRough} /></div>
          <div className="dcs-field"><span className="dcs-field__label">Metallic</span><Slider value={metallic} onChange={setMetallic} /></div>
        </div>
      </Foldout>
      <Foldout title="Display" icon="eye">
        <div className="dcs-props">
          <div className="dcs-field"><span className="dcs-field__label">Wireframe</span><Switch checked={wire} onChange={setWire} /></div>
          <div className="dcs-field"><span className="dcs-field__label">Cast shadow</span><Switch checked={shadow} onChange={setShadow} /></div>
        </div>
      </Foldout>
      <Foldout title="Modifiers" icon="bolt" defaultOpen={false} meta="3" />
    </Foldouts>
  );

  const LightingView = () => (
    <Foldouts>
      <Foldout title="Ambient" icon="globe">
        <div className="dcs-props">
          <div className="dcs-field"><span className="dcs-field__label">Color</span><div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#7c8492' }} /><span>#7C8492</span></div></div>
          <div className="dcs-field"><span className="dcs-field__label">Intensity</span><Slider value={0.4} /></div>
        </div>
      </Foldout>
      <Foldout title="Sun" icon="light">
        <div className="dcs-props">
          <div className="dcs-field"><span className="dcs-field__label">Exposure</span><Slider value={0.6} /></div>
          <div className="dcs-field"><span className="dcs-field__label">Soft shadows</span><Switch checked /></div>
        </div>
      </Foldout>
    </Foldouts>
  );

  const ConsoleView = () => (
    <div style={{ padding: 'var(--dcs-s-3) var(--dcs-s-5)', fontFamily: 'var(--dcs-font-mono)', fontSize: 11, lineHeight: 1.7 }}>
      <div style={{ color: 'var(--dcs-text-mute)' }}><span style={{ color: 'var(--dcs-ok)' }}>[ok]</span> Scene cached · 312 MB</div>
      <div style={{ color: 'var(--dcs-text-mute)' }}><span style={{ color: 'var(--dcs-accent)' }}>[info]</span> 4 modifiers evaluated · 4.1 ms</div>
      <div style={{ color: 'var(--dcs-text-mute)' }}><span style={{ color: 'var(--dcs-warn)' }}>[warn]</span> jane_body has 12 n-gons</div>
      <div style={{ color: 'var(--dcs-text)' }}><span style={{ color: 'var(--dcs-accent)' }}>›</span> <span style={{ width: 6, height: 12, background: 'var(--dcs-accent)', display: 'inline-block', verticalAlign: 'middle', animation: 'dcs-blink 1s steps(1) infinite' }} /></div>
    </div>
  );

  const Dopesheet = () => (
    <div style={{ padding: 8 }}>
      <div style={{ height: 100, position: 'relative', background: 'var(--dcs-well)', border: '1px solid var(--dcs-line)', borderRadius: 3 }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i / 12) * 100}%`, top: 0, bottom: 0, width: 1, background: i % 4 === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.04)' }} />
        ))}
        {[12, 24, 48, 64, 96, 128, 160].map(f => (
          <div key={f} style={{ position: 'absolute', left: `${(f / 240) * 100}%`, top: '50%', width: 8, height: 8, marginLeft: -4, marginTop: -4, background: 'var(--dcs-accent)', transform: 'rotate(45deg)' }} />
        ))}
        <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, width: 2, background: 'var(--dcs-accent-hi)' }} />
      </div>
    </div>
  );

  const ProjectList = () => (
    <div className="dcs-tree" style={{ padding: '4px 0' }}>
      {[['Assets', 'folder-open'], ['Materials', 'palette'], ['Textures', 'texture'], ['Models', 'mesh'], ['Sounds', 'volume'], ['Scripts', 'cpu']].map(([n, ic], i) => (
        <div key={n} className="dcs-tree__row" aria-selected={i === 2}>
          <span style={{ width: 14 }} /><Icon name={ic} className="dcs-tree__icon" /><span className="dcs-tree__label">{n}</span>
        </div>
      ))}
    </div>
  );

  const Placeholder = (label, icon) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--dcs-text-mute)' }}>
      <Icon name={icon} size="xl" /><span style={{ fontSize: 12 }}>{label}</span>
    </div>
  );

  const renderContent = (id) => {
    switch (id) {
      case 'hier': return <Outliner />;
      case 'proj': return <ProjectList />;
      case 'scene': return <div style={{ position: 'relative', height: '100%', minHeight: 200 }}><Viewport /></div>;
      case 'game': return Placeholder('Game view', 'play');
      case 'uv': return Placeholder('UV editor', 'uv');
      case 'console': return <ConsoleView />;
      case 'animation': return <Dopesheet />;
      case 'timeline': return Placeholder('Timeline tracks', 'timeline');
      case 'inspector': return <InspectorView />;
      case 'lighting': return <LightingView />;
      default: return null;
    }
  };

  const layout = {
    type: 'split', dir: 'row', sizes: [1, 2.6, 1.2], children: [
      { type: 'tabs', tabs: ['hier', 'proj'] },
      { type: 'split', dir: 'col', sizes: [2.4, 1], children: [
        { type: 'tabs', tabs: ['scene', 'game', 'uv'] },
        { type: 'tabs', tabs: ['console', 'animation', 'timeline'] },
      ] },
      { type: 'tabs', tabs: ['inspector', 'lighting'] },
    ],
  };

  return (
    <section className="dw-section" id="dock">
      <div className="dw-section__eyebrow">Layout · 03</div>
      <h2>Dock panels</h2>
      <p className="dw-section__lead">
        A real docking workspace. <strong style={{ color: 'var(--dw-text)' }}>Grab any tab and drag it</strong> —
        drop on a pane's <em>center</em> to add it as a tab, or on an <em>edge</em> (left / right / top / bottom)
        to dock a new split. Drag the seams to resize, and the menu bar drops real menus.
      </p>
      <Demo frame="app" inset noDensity caption="Drag tabs to dock · drag seams to resize · click the menus">
        <div style={{ display: 'flex', flexDirection: 'column', height: 580 }}>
          <MenuBar
            brand={{ icon: 'decius', label: 'modeler' }}
            items={['File', 'Edit', 'View', 'Mesh', 'Render', 'Help']}
            menus={DOCK_MENUS}
            onPick={(m, v) => setLast(`${m} › ${v}`)}
            meta={<><span>Scene_Intro_v014.dcs</span><span className="dcs-badge dcs-badge--accent">MODIFIED</span></>}
          />
          <DockLayout initial={layout} tabMeta={(id) => TAB_META[id]} renderContent={renderContent} />
          <div className="dcs-statusbar">
            <span className="dcs-statusbar__item dcs-statusbar__item--ok"><Icon name="check-circle" size="sm" /> Ready</span>
            <span className="dcs-statusbar__item">menu: {last}</span>
            <span className="dcs-statusbar__spacer" />
            <span className="dcs-statusbar__item">jane_body · 64,201 tri</span>
            <span className="dcs-statusbar__sep" />
            <span className="dcs-statusbar__item dcs-statusbar__item--accent">60 fps</span>
          </div>
        </div>
      </Demo>
    </section>
  );
}

Object.assign(window, { SectionPanels, SectionDock, SectionSubpanels, SectionFoldouts });

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
                <Foldout title="Transform" icon="move" meta="Local" tools={<Button ghost sm icon iconLeft="key" />}>
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
          <div style={{ fontSize: 13, color: 'var(--dw-text-dim)', lineHeight: 1.65, paddingTop: 6 }}>
            <p><strong style={{ color: 'var(--dw-text)' }}>Foldout vs SubPanel.</strong> Both collapse. The visual difference is rhythm.</p>
            <p><strong style={{ color: 'var(--dw-text)' }}>Foldouts</strong> are soft, lighter-bg cards with margins — they feel like grouped properties. Use for inspectors with many heterogeneous sections (Blender's N-panel, Unity's Inspector).</p>
            <p><strong style={{ color: 'var(--dw-text)' }}>Subpanels</strong> are full-width seams in a stack — they feel like rigid rows. Use when controls are dense and visual chunking matters more than soft separation (Maya's Channel Box, Houdini's parameter editor).</p>
          </div>
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
              <div className="dcs-col" style={{ gap: 3 }}>
                <div className="dcs-field" style={{ gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--dcs-danger)', width: 12, fontFamily: 'var(--dcs-font-mono)' }}>X</span>
                  <Combo value={1.428} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" />
                </div>
                <div className="dcs-field" style={{ gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--dcs-ok)', width: 12, fontFamily: 'var(--dcs-font-mono)' }}>Y</span>
                  <Combo value={-0.952} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" />
                </div>
                <div className="dcs-field" style={{ gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--dcs-accent)', width: 12, fontFamily: 'var(--dcs-font-mono)' }}>Z</span>
                  <Combo value={3.000} min={-10} max={10} step={0.001} format={v => v.toFixed(3)} width="100%" />
                </div>
              </div>
            </SubPanel>
            <SubPanel title="Display" icon="eye">
              <div className="dcs-col" style={{ gap: 4 }}>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Wireframe</span>
                  <Switch checked={false} />
                </div>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Smooth shade</span>
                  <Switch checked />
                </div>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Cast shadow</span>
                  <Switch checked />
                </div>
              </div>
            </SubPanel>
            <SubPanel title="Material" icon="palette" defaultOpen={false}>
              <div className="dcs-col" style={{ gap: 6 }}>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Albedo</span>
                  <div className="dcs-swatch"><div className="dcs-swatch__chip" style={{ '--c': '#4d9fff' }} /><span>#4D9FFF</span></div>
                </div>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Roughness</span>
                  <Slider value={0.42} />
                </div>
              </div>
            </SubPanel>
            <SubPanel title="Constraints" icon="link" defaultOpen={false}>
              <div className="dcs-col" style={{ gap: 4 }}>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Lock X</span><Switch checked={false} /></div>
                <div className="dcs-field" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Track to</span><Combo value={0} min={0} max={4} step={1} format={() => 'Cam.001'} width={90} /></div>
              </div>
            </SubPanel>
            <SubPanel title="Subdivision" icon="subdivide" defaultOpen={false}>
              <div className="dcs-field" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--dcs-text-dim)' }}>Level</span>
                <Combo value={2} min={0} max={6} step={1} format={v => `${v}×`} width={70} />
              </div>
            </SubPanel>
          </Panel>
        </div>
      </Demo>
    </section>
  );
}
